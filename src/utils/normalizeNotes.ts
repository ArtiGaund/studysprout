import { join, parse } from "path";

export type BlockMapEntry = {
    id: string | number;
    start: number;
    end: number;
    type?: string;
};
export function normalizeNotes(input: any): string{
    if(input === null || input === undefined) return "";

     // String: handle JSON-stringified blocks, HTML, plain text 
    if(typeof input === "string"){
        let s = input.trim();
        // try parse JSON to pull textual leaves
        if((s.startsWith("{") || s.startsWith("[")) && s.length < 200000){
            try {
                const parsed = JSON.parse(s);
                return normalizeNotes(parsed);
               
            } catch (error) {  /* Not JSON*/ }
        }

        // strip HTML tags
        if(s.includes("<") && s.includes(">")) s = s.replace(/<\/?[^>]+(>|$)/g, " ");
        // normalize whitespace/control chars
        s = s.replace(/[\u0000-\u001F\u007F]+/g, " ");
        s = s.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
        s = s.replace(/[ \t]{2,}/g, " ").replace(/\u00A0/g, " ").trim();
        return s;
    }

    // Array of blocks (notion-like)
    if(Array.isArray(input)){

        // BlockNote block structure support
        if(input.length > 0 && typeof input[0] === "object" && Array.isArray(input[0]?.content)){
            const out: string[] = [];
            const walk = (blocks: any[]) => {
                for(const block of blocks){
                    if(!block) continue;

                    // Extract inline text
                    if(Array.isArray(block.content)){
                        const text = block.content
                        .map((inline: any) => 
                        typeof inline.text === "string" ? inline.text : ""
                        )
                        .join("")
                        .trim();

                        if(text) out.push(text);
                    }

                    // children
                    if(Array.isArray(block.children)) walk(block.children);
                }

            }
            walk(input);
            return out.join("\n\n").trim();
        }
        const parts: string[] = [];
        for(const block of input){
            if(!block || typeof block !== "object" ) continue;
           
            // Block editor shape: { content: [{ type: 'text', text: '...'}], children: [...]}
            if(Array.isArray(block.content) && block.content.length > 0){
                const textParts: string[] = [];
                for(const inline of block.content){
                    if(inline?.type === "text" && typeof inline.text === "string"){
                        textParts.push(inline.text);
                    }else if(typeof inline?.text === "string"){
                        textParts.push(inline.text);
                    }
                }
                const blockText = textParts.join("").trim();
                if(blockText) parts.push(blockText);
            }else if(typeof block.text === "string"){
                // Fallback: direct text field
                if(block.text.trim()) parts.push(block.text.trim());
            }else if(typeof block.plain_text === "string"){
                if(block.plain_text.trim()) parts.push(block.plain_text.trim());
            }

            // Recursively process children blocks
            if(Array.isArray(block.children) && block.children.length > 0){
                const childParts = normalizeNotes(block.children);
                if(childParts.trim()) parts.push(childParts);
            }
           
        }
        return parts.join("\n\n").replace(/\s{2,}/g, " ").trim();
    }


   

    // Object: prefer .data/.content then gather leaves
    if(typeof input === "object"){
        if(input.data !== undefined) return normalizeNotes(input.data);
        if(input.content !==undefined) return normalizeNotes(input.content);
        const collected: string[] = [];
        (function walk(node: any){
            if(node == null) return;
            if(typeof node === "string") collected.push(node);
            else if(Array.isArray(node)) node.forEach(walk);
            else if(node && typeof node === "object") Object.values(node).forEach(walk);
        })(input)
        return collected.join("\n\n").replace(/\s{2,}/g," ").trim();
    }


    return String(input ?? "");
}

// structuredPlainText + a mapping from block ids -> char ranges



export function normalizeNotesWithMapping(input: any): {
    normalizedPlainText: string;
    structuredPlainText: string;
    blockMap: BlockMapEntry[];
}{
    // if input is string containing JSON, parse it first to recover block array/object
    let parsed =  input;
    if(typeof input === "string"){
        const s = input.trim();
        if((s.startsWith("[") || s.startsWith("{")) && s.length < 500000){
            try {
                parsed = JSON.parse(s);
            } catch (error) {
                parsed = input;
            }
        }
    }

    // Build normalized plain text using existing function for compatibility
    const normalizedPlainText = normalizeNotes(parsed);

    // 1If parsed is not an array of blocks, return minimal structured text
    if(!Array.isArray(parsed)){
        return{
            normalizedPlainText,
            structuredPlainText: normalizedPlainText,
            blockMap: []
        };
    }

    // extract inline text from a single block 
    function extractBlockText(block: any): string| null{
        if(!block || typeof block !== "object") return "";
        const parts: string[] = [];
        if(Array.isArray(block.content)){
            for(const inline of block.content){
                if(inline == null) continue;
                if(typeof inline.text === "string") parts.push(inline.text);
                else if(typeof inline.plain_text === "string") parts.push(inline.plain_text);
                else if(typeof inline === "string") parts.push(inline);
            }
        }
        if(typeof block.text === "string"){
            parts.push(block.text);
        }
        if(typeof block.plain_text === "string"){
            parts.push(block.plain_text);
        }
        if(parts.length === 0){
            // collect string leaves fallback
            (function walk(n:any){
                if(n == null) return;
                if(typeof n === "string") parts.push(n);
                else if(Array.isArray(n)) n.forEach(walk);
                else if(typeof n === "object") Object.values(n).forEach(walk);
            })(block);
        }
        const result = parts.join("").trim();
        return result.length ? result : null;
    }

    // Build structuredPlainText (light markdown) and blockMap
    const structuredParts: string[] = [];
    const blockMap: BlockMapEntry[] = [];
    let cursor = 0;

    function pushBlock(text: string, id: string|number, type?: string){
        if(!text) return;
        const safeText = String(text).trim();
        if(!safeText) return;
        // For structured ouput, include simple prefixes for types
        let header = "";
        if(type){
            const t = String(type).toLowerCase();
            if(t.includes("heading") || t.includes("heading1") || t.includes("heading2")) header = `#`;
            else if(t.includes("list") || t.includes("listitem")) header = `- `;
            else if(t.includes("quote")) header = `> `;
        }
        const blockText = header + safeText;
        // record start/end on the plain (no header) normalized stream to map back to content
        const start = cursor;
        const toAppend = blockText;
        structuredParts.push(toAppend);
        cursor += toAppend.length;
        // Add paragraph separator
        structuredParts.push("\n\n");
        cursor += 2;
        blockMap.push({
            id: id ?? (blockMap.length),
            start,
            end: cursor,
            type
        });
    }

    for(const block of parsed){
        const blockId = block.id ?? block._id ?? undefined;
        const blockType = block.type ?? block.nodeType ?? undefined;
        // Extract own block text
        const ownText = extractBlockText(block);
        if(ownText){
            pushBlock(ownText, blockId ?? parsed.indexOf(block), blockType);
        }
        // children (if any) processed as separate entried to keep mapping fine-grained
        if(Array.isArray(block.children) && block.children.length > 0){
            for(const child of block.children){
                const childId = child?.id ?? undefined;
                const childType = child?.type ?? undefined;
                const childText = extractBlockText(child);
                if(childText){
                    pushBlock(childText, childId ?? parsed.indexOf(child), childType);
                }
            }
        }
       
    // Remove trailing separator if present
    if(structuredParts.length > 0){
        const last = structuredParts[structuredParts.length -1];
        if(typeof last === "string" && last.trim() === ""){
            // strip final empty piece
            structuredParts.pop();
            cursor = structuredParts.join("").length;
            // fix last blockMap end if needed
            if(blockMap.length > 0){
                const lastEntry = blockMap[blockMap.length -1];
                lastEntry.end = cursor;
            }
        }
    }
       
    }
     // join and trim
        const structuredPlainText = structuredParts.join("").trim();
     return {
            normalizedPlainText,
            structuredPlainText,
            blockMap,
        }
}
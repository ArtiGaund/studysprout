/**
 * Auto summary generator - zero AI cost.
 * 
 * Strategy: Find heading blocks and take the first 1-2 sentences of the paragraph that follows
 * each heading. This gives a structural overview of the document.
 * 
 * Why no AI: Summaries of your own notes don't need language understanding.
 * You wrote them - the first sentence after each heading Is the summary.
 * Gemini is only worth calling when you need genuine language tranformation (like simplifying a 
 * research paper) not for extraction.
 */

export interface SectionSummary{
    heading: string;
    summary: string;
    blockId: string;
};

export interface AutoSummary{
    sections: SectionSummary[];
    totalWords: number;
    generatedAt: Date;
};

export function generateAutoSummary(
    blocks: Record<string, any>,
    blockOrder: string[]
): AutoSummary{
    const sections: SectionSummary[] = [];
    let totalWords = 0;

    for(let i = 0;i< blockOrder.length; i++){
        const blockId = blockOrder[i];
        const block = blocks[blockId];
        if(!block) continue;

        const text = (block.plainText || block.content || "") as string;
        if(text.trim()){
            totalWords += text.split(/\s+/).filter(Boolean).length;
        }

        // Found a header - look for the next paragraph to summarize
        if(block.type === "heading" || text.trim().length > 0){
            let summary = "";

            // Scan forward for the first non-empty paragraph
            for(let j = i + 1; j < Math.min(i + 5, blockOrder.length); j++){
                const nextBlock = blocks[blockOrder[j]];
                if(!nextBlock) continue;

                const nextText = (nextBlock.plainText || nextBlock.content || "") as string;

                // Skip other heading, empty blocks and image blocks
                if(
                    nextBlock.type === "heading" ||
                    nextBlock.type === "image" ||
                    !nextText.trim()
                ) continue;

                // Take first sentence - up to first period, question mark, or 150 chars
                const firstSentence = nextText.split(/(?<=[.!?])\s+/)[0] || nextText;
                summary = firstSentence.slice(0, 200).trim();

                // Add ellipsis if truncated
                if(firstSentence.length > 200) summary += "...";
                break;
            }

            sections.push({
                heading: text.trim(),
                summary: summary || "No description",
                blockId,
            });
        }
    }
    return {
        sections,
        totalWords,
        generatedAt: new Date(),
    }
}

/**
 * Generates a plain text summary of the whole file.
 * Used for concept graph context - gives Gemini a condensed version instead of all block text.
 */

export function generatePlainSummary(
    blocks: Record<string, any>,
    blockOrder: string[],
    maxLength: 300
): string{
    const parts: string[] = [];

    for(const blockId of blockOrder){
        const block = blocks[blockId];
        if(!block) continue;
        if(block.type === "image") continue;

        const text = (block.plainText || block.content || "") as string;
        if(!text.trim()) continue;

        // Prioritize heading blocks - they give structure
        if(block.type === "heading"){
            parts.unshift(text.trim());  //headings go to front
        }else{
            parts.push(text.trim());
        }

        if(parts.join(" ").length > maxLength) break;
    }

    return parts.join(" ").slice(0, maxLength).trim();
}
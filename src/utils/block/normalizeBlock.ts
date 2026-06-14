import { IBlock } from "@/model/file.model";

export interface UIBlock {
    id: string;
    type: string;
    props?: {
        level?: number;
    };
    content: any;
    uiPlainText?: string;
}
export function normalizeBlockUI(block: any): UIBlock{
    const rawContent = block?.content ?? [];
    return {
        id: block.id,
        type: block.type,
        props: block.props ?? {},
        content: Array.isArray(rawContent) 
        ? rawContent.map((c: any) => ({
            ...c,
            styles: undefined,
        }))
        : rawContent,
        uiPlainText: extractPlainText(block),
    }
}
function extractPlainText(block: any): string{
    const c = block?.content;
    return extractNode(c).trim();
}

function extractNode(node: any): string{
    if(!node) return "";

    // plain string
    if(typeof node === "string") return node;

    // node with text
    if(typeof node === "object" && typeof node.text === "string") return node.text;

    // array -> flatten recursively
    if(Array.isArray(node)){
        return node.map(extractNode).join(" ");
    }

    // nested block (tables, list items, rows, cells, etc)
    if(typeof node === "object" && node.content){
        return extractNode(node.content);
    }
    
    return "";
}
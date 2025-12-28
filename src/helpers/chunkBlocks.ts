import { UIBlock } from "@/utils/block/normalizeBlock";

export interface ChunkBlocks{
    fileId: string;
    blockId: string;
    text: string;
    updatedAt: Date;
}
export function chunkBlocks(blocks: ChunkBlocks[], maxChunkChars = 12000){
    const chunks: ChunkBlocks[][] = [];
    let current: ChunkBlocks[] = [];
    let length = 0;

    for(const block of blocks){
        const text = block.text ?? "";
        
        if(length + text.length > maxChunkChars){
            chunks.push(current);
            current = [];
            length = 0;
        }
        current.push(block);
        length += text.length;
    }
    if(current.length > 0) chunks.push(current);
    return chunks;
}
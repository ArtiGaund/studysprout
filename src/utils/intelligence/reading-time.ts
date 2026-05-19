/**
 * Universal reading time estimator.
 * Works for both PDF-generated files (has plainText) and normal editor files (has content).
 * Always prefer plainText if available, falls back to content
 */

export function estimateReadingTimeFromBlocks(
    blocks: Record<string, any>,
    blockOrder: string[]
): number{
    const WORDS_PER_MINUTE = 200;
    let totalMinutes = 0;

    for(const blockId of blockOrder){
        const block = blocks[blockId];
        if(!block) continue;

        // Prefer plainText, fallback to content for any legacy blocks
        const text = (block.plainText || block.content || "") as string;
        if(!text.trim()) continue;

        if(block.type === "image"){
            totalMinutes += 0.5;
            continue;
        }

        const wordCount = text.split(/\s+/).filter(Boolean).length;
        // Math blocks take longer - only set on PDF blocks, normal editor blocks get multiplier 1
        const multiplier = block.props?.isMath ? 3 : 1;
        totalMinutes += (wordCount / WORDS_PER_MINUTE) * multiplier;
    }

    return Math.max(1, Math.ceil(totalMinutes));
}
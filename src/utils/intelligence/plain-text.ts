import { IBlock } from "@/model/file.model";

export function deriveFilePlainText(
    blocksObject: Record<string, IBlock>,
    blockOrder: string[]
): string{
    return blockOrder
        .map(id => blocksObject[id]?.plainText)
        .filter(Boolean)
        .join("\n");
}
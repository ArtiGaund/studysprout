import { StructuralBlock } from "./pdf-structural-parser";

export interface ContentChunk {
    title: string;
    blocks: StructuralBlock[];
    pageStart: number;
    pageEnd: number;
}

// ── TUNING ────────────────────────────────────────────────────────────────────
// Page-based chunking keeps file count in sync with the inspect-route estimate.
// Inspect route: suggestedFileCount = Math.ceil(activePageCount / 20)  (books)
// So TARGET_PAGES_PER_FILE = 20 → same estimate both places.

export const TARGET_PAGES_PER_FILE = 20;  // flush at next heading after this many pages
export const MIN_PAGES_PER_FILE    = 12;  // merge back if chunk is shorter than this
export const MAX_PAGES_PER_FILE    = 35;  // hard cap — force flush even without heading

// Inline labels that should NOT trigger a chunk split.
export const INLINE_LABEL_PATTERN =
    /^(proof|example|definition|theorem|lemma|corollary|remark|note|exercise|solution)\b/i;

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Resolve page number for a block.
 * blockPageMap is populated in pdfWorker from block.pageNumber.
 * Falls back to block.pageNumber for image/table blocks that may not be
 * in the map if they were added after the map was built.
 */
function pageOf(block: StructuralBlock, map: Map<string, number>): number {
    return map.get(block.id) ?? block.pageNumber ?? 0;
}

/**
 * True for a heading that should trigger a chunk boundary.
 * Excludes inline labels like "Proof", "Example", "Definition" which are
 * content within a section, not structural section dividers.
 * Image and table blocks never trigger splits.
 */
function isChapterHeading(block: StructuralBlock): boolean {
    return (
        block.type === "heading" &&
        (block.props?.level === 1 || block.props?.level === 2) &&
        typeof block.content === "string" &&
        block.content.trim().length > 3 &&
        !INLINE_LABEL_PATTERN.test(block.content.trim())
    );
}

// ── MAIN CHUNKER ──────────────────────────────────────────────────────────────

/**
 * Split allBlocks into topic chunks, each spanning ~TARGET_PAGES_PER_FILE pages.
 *
 * Rules:
 *   1. Never split inside a topic — only at a chapter/section heading boundary.
 *   2. Once a chunk has ≥ TARGET_PAGES_PER_FILE pages, flush at the NEXT heading.
 *   3. Hard cap at MAX_PAGES_PER_FILE — flush at the next clean paragraph end.
 *   4. After all flushes, merge any chunk shorter than MIN_PAGES_PER_FILE into
 *      its preceding neighbor.
 *   5. Image and table blocks are treated as regular content — they don't split
 *      or count differently from text blocks.
 */
export function splitIntoTopicChunks(
    allBlocks: StructuralBlock[],
    blockPageMap: Map<string, number>,
): ContentChunk[] {
    const chunks: ContentChunk[] = [];
    let currentBlocks: StructuralBlock[] = [];
    let currentTitle  = "Introduction";
    let chunkStartPage = -1;

    const flush = (nextTitle: string) => {
        if (currentBlocks.length === 0) return;
        const firstPage = pageOf(currentBlocks[0], blockPageMap);
        const lastPage  = pageOf(currentBlocks[currentBlocks.length - 1], blockPageMap);
        chunks.push({
            title:     currentTitle,
            blocks:    [...currentBlocks],
            pageStart: firstPage,
            pageEnd:   lastPage,
        });
        currentBlocks  = [];
        currentTitle   = nextTitle;
        chunkStartPage = -1;
    };

    for (const block of allBlocks) {
        const blockPage = pageOf(block, blockPageMap);

        if (chunkStartPage === -1) chunkStartPage = blockPage;

        const pagesAccumulated = blockPage - chunkStartPage + 1;
        const headingHere      = isChapterHeading(block);

        if (headingHere) {
            const title = block.content as string;

            if (pagesAccumulated >= TARGET_PAGES_PER_FILE) {
                // ✅ Normal case: hit target page count AND heading boundary → flush
                flush(title);
            } else if (pagesAccumulated >= MAX_PAGES_PER_FILE) {
                // ✅ Hard cap hit at heading → flush
                flush(title);
            } else {
                // Not enough pages yet — absorb heading, update running title
                if (currentBlocks.length > 3) currentTitle = title;
                currentBlocks.push(block);
                continue;
            }

        } else if (pagesAccumulated >= MAX_PAGES_PER_FILE) {
            // Hard cap hit with no heading — flush after next clean paragraph end
            if (
                block.type === "paragraph" &&
                typeof block.content === "string" &&
                /[.!?]\s*$/.test(block.content)
            ) {
                currentBlocks.push(block);
                flush(`${currentTitle} (continued)`);
                continue;
            }
        }

        currentBlocks.push(block);
    }

    // Flush remainder
    if (currentBlocks.length > 0) {
        const firstPage = pageOf(currentBlocks[0], blockPageMap);
        const lastPage  = pageOf(currentBlocks[currentBlocks.length - 1], blockPageMap);
        chunks.push({
            title:     currentTitle,
            blocks:    [...currentBlocks],
            pageStart: firstPage,
            pageEnd:   lastPage,
        });
    }

    return mergeTinyChunks(chunks);
}

// ── POST-PASS: merge undersized chunks ────────────────────────────────────────

export function mergeTinyChunks(chunks: ContentChunk[]): ContentChunk[] {
    const result: ContentChunk[] = [];
    for (const chunk of chunks) {
        const pages = chunk.pageEnd - chunk.pageStart + 1;
        const prev  = result[result.length - 1];
        if (pages < MIN_PAGES_PER_FILE && prev) {
            prev.blocks.push(...chunk.blocks);
            prev.pageEnd = chunk.pageEnd;
            prev.title   = prev.title.replace(/\s*\(continued\)\s*$/, "");
        } else {
            result.push({ ...chunk });
        }
    }
    return result;
}

// Kept for any callers that import it — no longer used by splitIntoTopicChunks.
export function findParagraphBreak(blocks: StructuralBlock[], targetIdx: number): number {
    const searchStart = Math.max(0, targetIdx - 10);
    for (let i = targetIdx; i >= searchStart; i--) {
        const block = blocks[i];
        if (
            block.type === "paragraph" &&
            typeof block.content === "string" &&
            /[.!?]\s*$/.test(block.content)
        ) {
            return i + 1;
        }
    }
    return targetIdx;
}
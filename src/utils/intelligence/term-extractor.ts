/**
 * @utility extractTermsFromBlocks
 * @description Takes a file's blocks and return a deduplicated array of meaningful terms extracted
 * from all block content.
 * 
 * Called from:
 * - fileSyncWorker -> after saving "blocks" + "blockOrder" to MongoDB
 * - PDFWorker -> after saving each chunks "blocks" + "blockOrder"
 * 
 * Output stored in: `file.terms: string[]` in MongoDB
 * 
 * Pipeline:
 * 1. Collect plainText / structuredText from every block in blockOrder.
 * 2. Strip markdown syntax, punctuation, and stop-words.
 * 3. Tokenise, normalize (lowercase + trim)
 * 4. Deduplicate and return
 */

import { IBlock } from "@/model/file.model";

// ---Stop-word list (expand as needed) ---

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","if","in","on","at","to","for",
  "of","with","by","from","is","it","its","was","are","were","be",
  "been","being","have","has","had","do","does","did","will","would",
  "could","should","may","might","shall","can","not","no","nor",
  "so","yet","both","either","neither","than","that","this","these",
  "those","such","as","up","out","about","into","over","after","then",
  "when","where","which","who","whom","how","what","there","here",
  "also","just","more","most","some","any","all","each","every","both",
  "few","i","we","you","he","she","they","me","us","him","her","them",
  "my","our","your","his","their","its","own","same",
  // generic verbs
    "using","used","use","uses","make","makes","making","allow","allows",
    "provide","provides","providing","require","requires","requiring",
    "include","includes","including","represent","represents","enable",
    "enables","enabling","reduce","reduces","reducing","manage","manages",
    "create","creates","creating","help","helps","define","defines",
    "refer","refers","called","known","based","related","given","found",
    // generic adjectives/adverbs
    "different","important","common","specific","various","general","large",
    "small","simple","complex","new","old","high","low","good","great",
    "many","much","often","usually","typically","especially","particularly",
    "also","however","therefore","thus","hence","whereas","although",
    "valuable","critical","essential","vast","rich","manageable","structured",
    "unstructured","down","others","world","role","phase","amounts","sequence",
    "phrases","foundation","interpretation","monitor","concepts","explanation",
    "expressions","making","reducing","requiring","providing","data-driven",
]);

// ---Markdown / noise patterns to strip before tokenising ---

const STRIP_PATTERNS: RegExp[] = [
  /```[\s\S]*?```/g,          // fenced code blocks
  /`[^`]+`/g,                 // inline code
  /\$\$[\s\S]*?\$\$/g,        // block math
  /\$[^$]+\$/g,               // inline math
  /!\[.*?\]\(.*?\)/g,         // markdown images
  /\[.*?\]\(.*?\)/g,          // markdown links
  /^\|.*\|$/gm,               // table rows
  /^#+\s*/gm,                 // heading markers
  /^[-*]\s+/gm,               // bullet markers
  /^\d+\.\s+/gm,              // numbered list markers
  /[*_~`>#|\\]/g,             // remaining markdown symbols
  /\[(Image:.*?)\]/g,         // [Image: alt] placeholders
  /\[Embedded Image\]/g,      // bare image placeholders
  /https?:\/\/\S+/g,          // URLs
  /[^a-zA-Z0-9\s'-]/g,        // non-word characters (keep hyphens + apostrophes)
];

// --- Core helper: clean a raw string into token ---

function tokenise(raw: string): string[]{
    let text = raw;

    for(const pattern of STRIP_PATTERNS){
        text = text.replace(pattern, " ");
    }

    return text
        .toLowerCase()
        .split(/\s+/)
        .map(t => t.replace(/^['-]+|['-]+$/g, "").trim()) //strip leading/trailing ' and -
        .filter(t => t.length > 2 && !STOP_WORDS.has(t) && /[a-z]/.test(t));
}

// --- Public API ---

/**
 * Extracts meaningful terms from a file's blocks.
 * 
 * @param blocks - The `blocks` map saved in MongoDB (`Record<id, IBlock>`)
 * @param blockOrder - Ordered list of block IDs (mirrors the editor structure)
 * @return Deduplicated, lowercase term array - stored as  `file.terms`
 */

export function extractTermsFromBlocks(
    blocks: Record<string, IBlock>,
    blockOrder: string[],
): string[] {
    const seen = new Set<string>();
    const terms: string[] = [];

    for(const id of blockOrder){
        const block = blocks[id];
        if(!block) continue;

        // Prefer plainText, Fallback to structuredText, then content as a safety net.
        const raw: string = 
            (block.plainText as string | undefined) ??
            (block.structuredText as string | undefined) ??
            (block.content as string | undefined) ??
            "";

        if(!raw.trim()) continue;

        for(const term of tokenise(raw)){
            if(!seen.has(term)){
                seen.add(term);
                terms.push(term);
            }
        }
    }
    return terms;
}
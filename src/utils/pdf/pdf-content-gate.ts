/**
 * Scans blocks from the beginning and finds the index where real content actually starts - skipping
 * TOC, preface, acknowledgments etc.
 * 
 * This is a second pass gate that runs AFTER parsing, not during.
 * It's more reliable than page-based boundary detection because it operates on actual extracted
 * text, not page positions.
 */

import { StructuralBlock } from "./pdf-structural-parser";

// Patterns that indicate we're still in front matter.
// Matches acknowledgments, TOC, preface, publisher info etc.
const FRONT_MATTER_PATTERNS: RegExp[] = [
    /advisory\s+board/i,
    /acknowledgment/i,
    /table\s+of\s+contents/i,
    /^\s*contents\s*$/i,
    /foreword/i,
    /preface/i,
    /about\s+the\s+author/i,
    /springer/i,
    /isbn|issn/i,
    /printed\s+in/i,
    /all\s+rights\s+reserved/i,
    /library\s+of\s+congress/i,
    /first\s+published/i,
    /this\s+edition/i,
    /published\s+by/i,
    /university\s+press/i,
];

// Patterns that definitively signal real content has started.
// Covers books (Chapter 1), research papers (Abstract, Introduction),
// lecture notes (Lecture 1), and general documents.
const CONTENT_START_PATTERNS: RegExp[] = [
    /^chapter\s+1\b/i,
    /^1\s+[A-Z]/,           // "1 Vector Spaces" style
    /^introduction$/i,
    /^abstract$/i,
    /^1\.\s+introduction/i,
    /^lecture\s+1\b/i,
    /^section\s+1\b/i,
    /^overview$/i,
];

/**
 * Scans the block list from the start and returns the index where
 * real content begins — skipping TOC, preface, acknowledgments, publisher info.
 *
 * Only called on the first chunk of a document (front matter only appears at start).
 * Returns 0 if no front matter is detected (safe default — nothing is skipped).
 */
export function findContentStartIndex(blocks: StructuralBlock[]): number{
   
    for(let i = 0;i< blocks.length; i++){
        const block = blocks[i];
        if(typeof block.content !== "string") continue;
        const text = block.content.trim();

        // Once we see a definition content-start heading, stop
        if(
            block.type === "heading" &&
            CONTENT_START_PATTERNS.some((p) => p.test(text))
        ){
            return i;
        }

        // Track front matter - if we're deep enough and haven't hit a content start, use density
        // as fallback
        if(i > 30){
            // If we've passed 30 blocks and still no content start found, look for the first long
            // paragraph (real content is dense)
            if(
                block.type === "paragraph" &&
                text.length > 200 &&
                !FRONT_MATTER_PATTERNS.some((p) => p.test(text))
            ){
               return i;
            }
        }
    }

    // No front matter detected — start from the beginning
    return 0;
}
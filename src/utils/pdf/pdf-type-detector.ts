export type PDFType = "book" | "research" | "slides" | "notes";

export interface PDFTypeResult {
    type: PDFType;
    confidence: "high" | "medium" | "low";
    reason: string;
}

/**
 * Detects PDF type from page count, text density, and keyword patterns.
 * Called during inspection so the result can be stored and used by all downstream stages without
 * re-detection
 * 
 * Why this matters:
 * - Books have front matters -> need startOffset detection
 * - Research papers start at page 1 -> startOffset always 1
 * - Slides have huge fonts -> heading threshold need adjustment
 * - Notes are dense paragraphs -> no chapter splitting needed
 */

export function detectPDFType(
    totalpages: number,
    fullText: string,
    avgCharsPerPage: number,
): PDFTypeResult{
    const text = fullText.toLowerCase();

    // Slide decks: very few characters per page(big fonts, lots of whitespaces) and typically 
    // under 100 pages
    if(avgCharsPerPage < 400 && totalpages < 200){
        return {
            type: "slides",
            confidence: "high",
            reason: "Low character density suggests slide deck",
        };
    }

    // Research papers: has abstract, typically under 30 pages
    const hasAbstract = /\babstract\b/.test(text);
    const hasMethodology = 
        /\b(methodology|methods|materials and methods|experimental)\b/.test(text);
    const hasConclusion = /\b(conclusion|conclusions|summary)\b/.test(text);
    const researchScore = [ hasAbstract, hasMethodology, hasConclusion].filter(Boolean).length;

    if(researchScore >=2 && totalpages < 50){
        return {
            type: "research",
            confidence: researchScore === 3 ? "high" : "medium",
            reason: "Abstract/methodology/conclusion structure detected",
        };
    }

    // Books: many pages, has chapter structure
    const hasChapters = /\bchapter\s+\d+\b/i.test(text);
    if(totalpages > 50 && hasChapters){
        return {
            type: "book",
            confidence: "high",
            reason: "Multi-chapter structure with many pages",
        };
    }

    // Notes: default for everything else
    return {
        type: "notes",
        confidence: "low",
        reason: "No distinctive structure detected, treating as notes",
    };
}
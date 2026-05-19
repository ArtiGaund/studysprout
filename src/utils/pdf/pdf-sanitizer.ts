// Universal replacements — work correctly across ALL PDF types.
// No book-specific mappings here.
const UNIVERSAL_REPLACEMENTS: [RegExp, string][] = [
    // Ligatures that pdf-parse doesn't always decompose
    [/ﬁ/g, "fi"],
    [/ﬂ/g, "fl"],
    [/ﬀ/g, "ff"],
    [/ﬃ/g, "ffi"],
    [/ﬄ/g, "ffl"],
    [/ﬅ/g, "st"],

    // Soft hyphen (used for line-break hints in some PDFs) — just remove
    [/\u00AD/g, ""],

    // Non-breaking hyphen variants → regular hyphen
    [/\u2010|\u2011/g, "-"],

    // Dashes — preserve semantic meaning
    [/\u2013/g, "–"], // en dash
    [/\u2014/g, "—"], // em dash

    // Curly quotes → straight (safer for AI consumption and display)
    [/[\u2018\u2019]/g, "'"],
    [/[\u201C\u201D]/g, '"'],

    // Zero-width and invisible characters
    [/[\u200B\u200C\u200D\uFEFF]/g, ""],

    // Multiple spaces → single space
    [/[ \t]{2,}/g, " "],
];

// Universal noise line patterns — publisher/journal boilerplate
// present across many different PDFs regardless of subject or publisher.
const NOISE_LINE_PATTERNS: RegExp[] = [
    /©\s*.{0,80}\d{4}/i,               // © Publisher 2023
    /all rights reserved/i,
    /doi\s*:\s*10\.\d+/i,              // DOI string
    /downloaded from/i,                 // journal download watermarks
    /this content downloaded/i,
    /www\.[a-z0-9\-]+\.[a-z]{2,}/i,    // URLs
    /^\s*page\s+\d+\s*(of\s+\d+)?\s*$/i, // "Page 3 of 12"
    /^\s*\d+\s*$/,                      // standalone number
    /^\s*[ivxlcdmIVXLCDM]+\s*$/,       // roman numeral page number
];



export function isUniversalNoiseLine(text: string): boolean {
    const t = text.trim();
    if (t.length === 0) return true;
    if (t.length < 3) return true;
    return NOISE_LINE_PATTERNS.some((p) => p.test(t));
}

// ─── UNIVERSAL SANITIZER ──────────────────────────────────────────────────────
// Safe for all PDF types. Returns empty string if the line is pure noise.
export function sanitizeLosslessText(text: string): string {
    if (!text) return "";

    let cleaned = text;

    // 1. Unicode normalization — fixes many encoding inconsistencies automatically
    try {
        cleaned = cleaned.normalize("NFC");
    } catch {
        // normalize() unavailable in some environments — skip safely
    }

    // 2. Universal character replacements
    for (const [pattern, replacement] of UNIVERSAL_REPLACEMENTS) {
        cleaned = cleaned.replace(pattern, replacement);
    }

    // 3. Drop noise lines
    if (isUniversalNoiseLine(cleaned)) return "";

    return cleaned.trim();
}

// ─── AXLER-SPECIFIC GLYPH FIX ────────────────────────────────────────────────
// Axler's "Linear Algebra Done Right" uses a custom font encoding where
// the visual glyph for D is stored as = in the PDF character stream.
// This ONLY applies to that specific book — never run this on other PDFs.
// Detection is done by title in the worker before this is called.
export function applyAxlerGlyphFix(text: string): string {
    // Pattern: = followed by a capital letter at a word boundary
    // "=efinition" → "Definition", "=OI" → "DOI", "=escartes" → "Descartes"
    return text.replace(/\b=([A-Z])/g, "D$1");
}

//--- CID DECODING -----------------------
// Some PDFs use custom font encodings where special characters get stored as (cid: N) placeholder
// codes instead of proper Unicode.

// LADR ("Linear Algebra Done Right" by Axler) uses this encoding for all its math operators. The
// mapping below was derived by analyzing character positions and context across the full PDF.

// WHY THIS IS NECESSARY:
// pdfjs maps unresolved CID glyphs silently to spaces - so "u1 - v1" becomes "u1  v1" (two spaces).
// This is unreadable and mathematically wrong. pdf-parse-fork preserves them as (cid: N) strings
// which we can decode here.

// This function is safe to run on ALL PDFs - if a PDF has no CID codes, the replace calls are
// no-ops.
const CID_REPLACEMENTS: Record<string, string> = {
    "(cid:2)": "λ",
    "(cid:3)": "−",
    "(cid:4)(cid:4)(cid:4)": "···",  // must be before single (cid:4)
    "(cid:4)": "·",
    "(cid:5)": "≥",
    "(cid:6)": "≤",
    "(cid:7)": "⊆",
    "(cid:25)": "",
};

export function decodeCIDCodes(text: string): string {
    let result = text;
    for(const [cid, replacement] of Object.entries(CID_REPLACEMENTS)){
        result = result.split(cid).join(replacement);
    }
    return result;
}
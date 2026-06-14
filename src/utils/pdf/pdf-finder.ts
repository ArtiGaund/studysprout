export const findDocumentBoundaries = (
    fullText: string,
    totalPages: number
) => {
    const physicalPages = fullText.split('---PAGE SPLIT---').filter(p => p.trim().length > 0);
    const pageCount = physicalPages.length;
   
    let detectedStart = 1;
    let detectedEnd = totalPages;

    const isKnownFrontMatter = (text: string): boolean => {
       const cleanText = text.trim().toLowerCase()
       
        // Explicitly skip Table of Contents pages
        if(/contents|table of contents/i.test(cleanText.substring(0, 500))) return true;
        const noiseKeywords =[
            /preface/i, /acknowledgments/i, /copyright/i, /isbn/i, 
            /advisory board/i, /series editors/i, /editorial board/i,
            /all\s+rights\s+reserved/i, /springer\s+texts/i
        ];
        if(noiseKeywords.some(regex => regex.test(cleanText.substring(0, 800)))) return true;

        // TOC PATTERN: Lines ending in page numbers with dot leaders
        const lines = text.split('\n').filter(l => l.trim().length > 0);
       
        // TOC pattern: many lines ending in page numbers 
        const tocLineCount = lines.filter( l => /\.{3,}\s*\d+\s*$|\s{3,}\d+\s*$/.test(l)).length;
        if(tocLineCount > lines.length * 0.15) return true; // >30% of lines look like TOC entries

        return false;
    }

    const isStartAnchor = (text: string): boolean => {
        const cleanText = text.trim().toLowerCase();
        if(isKnownFrontMatter(text)) return false;
        // High-confidence content markers
        const startAnchors = [
            /chapter\s+1\b/i,
            /1\.a\s+r\s*n\s+and\s+c\s*n/i, // Specific fix for Axler's "1.A" formatting
            /1\.a\s+\b/i,          // Common in textbooks (Axler style)
            /1\.1\s+definition/i,
            /abstract\b/i,
            /introduction\b/i,
            /^1\s+introduction\b/i
        ];
        
        return startAnchors.some(regex => regex.test(cleanText.substring(0, 1500)));
    }

    // --- START: Use content density, not TOC page numbers ---
    // Stragtegy: skip pages that look like front matter (low density, TOC-like)
    // Front matter pages are typically: title page, copyright, TOC, preface
    // They have either very little text or text that looks like a TOC (lots of dots/numbers at end of lines)

    

    // Walk forward until we hit a dense, non-front-matter page
    for(let i = 0; i < Math.min(pageCount, 30); i++){
        const pageText = physicalPages[i];
        if(isStartAnchor(pageText)){
            detectedStart = i + 1;
            break;
        }

        if(isKnownFrontMatter(pageText) || pageText.trim().length < 900){
            detectedStart = i + 2;
            continue;
        }
    
        detectedStart = i + 1;
        break;
    }

    // --- END: scan last 20% of the book for back matter---
    // const backMatterRegex = /^\s*(references|bibliography|index|glossary|appendix|about\s+the\s+author)/im;
    const backMatterRegex = /(index|glossary|references|bibliography)/i;
    const lookbackStart = Math.floor(pageCount * 0.75) // only check last 25%

    for(let j = pageCount -1; j >= lookbackStart; j--){
        // Only flag as back matter if the WHOLE PAGE starts with there headers
        // not if "index" just appears somewhere in the middle of the content
         if (backMatterRegex.test(physicalPages[j].trim().substring(0, 200))) {
            detectedEnd = j; // page before this one
            break;
        }
    }

    if(totalPages > (pageCount + 50)){
        detectedEnd = totalPages;
    }

    return {
        startOffset: Math.max(1, Math.min(detectedStart, totalPages)),
        endOffset: Math.max(detectedStart + 1, Math.min(detectedEnd, totalPages)),
    }
}
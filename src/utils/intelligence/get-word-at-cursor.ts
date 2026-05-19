// --- Cursor word extractor ---

import { MAX_NGRAM } from "@/hooks/intelligence/useBacklinks";

/**
 * Extracts the 1-3 word window around the current cursor from a BlockNote editor.
 * Call from editor.onChange() and pass the result to checkWordAtCursor().
 * 
 * @param editor A BlockNote editor instance
 * @returns A string of up to 3 words centred on the cursor, or ""
 */

export function getWordAtCursor(
    editor: any,
): string{
    try {
        // BlockNote exposes the underlying ProseMirror view
        const view = editor._tiptapEditor?.view;
        if(!view) return "";

        const { state } = view;
        const { from } = state.selection;
        const text: string = state.doc.textContent ?? "";

        // Find word boundaries around cursor
        const before = text.slice(0, from);
        const after = text.slice(from);

        // Grab up to 3 words before cursor + up to 3 words after
        const wordsBefore = before.split(/\s+/).filter(Boolean).slice(-MAX_NGRAM);
        const wordsAfter = before.split(/\s+/).filter(Boolean).slice(MAX_NGRAM);

        return [ ...wordsBefore, ...wordsAfter]
                .slice(0, MAX_NGRAM * 2)
                .join(" ");
    } catch (error) {
        return "";
    }
}
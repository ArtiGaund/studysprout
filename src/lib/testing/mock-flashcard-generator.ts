/**
 * @module FlashcardMockFactory
 * @description Generates deterministic, schema-compliant mock flashcard data.
 * * USE CASES:
 * 1. UI Development: Prototyping the Flashcard Preview components without an active backend.
 * 2. Socket Testing: Simulating the 'report_progress' and 'generation_success' payloads.
 * 3. Unit Testing: Providing stable input for Redux slice and selector verification.
 * 4. Integration Checks: Verifying the 'blockIdsUsed' mapping logic in the document editor.
 */
export const getMockFlashcards = (
    count: number,
    blockIds: string[]
) => {
    // Array of supported pedagogical types to ensure variety in the mock set
    const types = [ "question-answer", "mcq", "fill-in-the-blank"];

    return Array.from({ length: count}).map((_,i) => ({
        // Cycle through types to test conditional rendering for all card formats
        type: types[i % types.length],

        // Dynamic strings help identify specific card indices during debugging
        question: `Mock Question #${i+1} for blocks ${blockIds.slice(0,2).join(", ")}`,
        answer: `This is a mock answer for testing UI and sockets.`,

        // Standard set of options for MCQ type testing
        options: [ "Option A", "Option B", "Option C", "Option D"],

        // Mocked source context to verify the "View Source" feature in the UI
        source_context: "This is a snippet of text from the source block used to verify context mapping",
        
        // Traceability: Links the card back to the provided block IDs
        blockIdsUsed: blockIds.slice(0,2),
    }));
}
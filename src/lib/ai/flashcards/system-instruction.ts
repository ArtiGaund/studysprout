/**
 * System instructions for Gemini to guide flashcard generation.
 * 
 * Responsibility:
 * - Tells the model how to behave (tone, constraints, style).
 * - Defines how flashcards should be formed from note content.
 * - Enforces output quality, safety and consistency.
 * 
 * Notes:
 * - Pure configuration. No business logic.
 * - Used only when calling Gemini's generateContent() //generateText(). 
 */

export function buildFlashcardsSystemInstruction(
    desiredTypes: string[],
    cardCount: number,
): string{
    const desiredTypesList = desiredTypes.join(', ');
    return `You are an expert educational flashcard generator. Your task is to analyze the provided study material 
    and generate high-quality flashcards.
    You MUST adhere to the following rules:
    1. **Format:** Your entire response MUST be a single JSON object conforming strict to the provided schema.
    2. **Types:** Generate cards for ALL of the following types: [${desiredTypesList}].
    3. **Content Source:** Generate cards ONLY from the 'STUDY MATERIAL'. Do not invent information.
    4. **Quantity:** Generate an equal distribution of types, ensuring the total set helps meet the user's request for
    ${cardCount} total cards.
    5. **Source Context:** The 'source_context' field MUST be a unique, short phrase ( 5 - 10 words ) taken directly
    from the text chunk.
    `
}
    export function buildUserPrompt(
        chunk: string,
        chunkIndex: number,
        totalChunks: number,
        customInstructions: string = ""
    ): string{
        return `
        STUDY MATERIAL (Chunk ${chunkIndex+1}/${totalChunks}):
        ---
        ${chunk}
        ---
        ${customInstructions ? `USER FOCUS INSTRUCTIONS: ${customInstructions}` : ""}
        `
    }
   
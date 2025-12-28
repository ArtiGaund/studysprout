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
    6. **Source Mapping Requirement:** Each flashcard MUST include "blockIdsUsed": string[]. These MUST ONLY be block IDs
    that appear in the material inside [BLOCK:<id>] markers. Never invent IDs. Never leave this empty.
    7. Each flashcard MUST extract concepts tied to those blocks.
    8. Do not merge unrelated blocks unless necessary.
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
   
    export function buildSingleFlashcardSystemInstruction(
        desiredTypes?: string
    ):string{
        const desiredTypesList = desiredTypes?.length 
        ? desiredTypes
        : "any appropriate educational type";
        return `
        You are an expert educational flashcard generator. Your task is to analyze the provided study material and 
        generate a **single** high-quality flashcard.
        You MUST adhere to the following rules:
        1. Format: Response MUST be a single JSON object conforming strict to the provided schema.
        2. Quality: Generate EXACTLY one flashcard.
        3. Type: Use the following types ONLY: [${desiredTypesList}].
        4. Content Source: Use ONLY the provided STUDY MATERIAL. Never invent facts.
        5. Source Context: 'source_context' MUST be a short 5 - 10 word phrase taken directly from the text.
        6. Source Mapping Requirement: Flashcard MUST include "blockIdsUsed": string[]. Only IDs from [BLOCK:<id>]
        markers. Never invent, nevery empty.
        7. The flashcard MUST clearly test a meaningful concept from the material.
        `;
    }

    export function buildSingleFlashcardUserPrompt(
        material: string,
        customInstructions: string = ""
    ): string {
        return `
        STUDY MATERIAL (Scoped Selection):
        ---
        ${material}
        ---

        Your job: generate exactly ONE flashcard based ONLY on this material.

        ${
            customInstructions
            ? `USER FOCUS INSTRUCTIONS: ${customInstructions}`
            : ""
        }
        `;
    }
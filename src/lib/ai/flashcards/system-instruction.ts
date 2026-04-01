/**
 * @module FlashcardPromptEngine
 * @description Centralized factory for LLM instructions. Standardizes the "System Persona" 
 * and "User Context" to ensure Gemini produces predictable, schema-compliant JSON.
 * * * KEY ENGINEERING CONSTRAINTS:
 * 1. Schema Adherence: Enforces a JSON-only response format to allow for automated parsing.
 * 2. Deterministic Mapping: Uses `[BLOCK:<id>]` markers to maintain a "Source of Truth" between 
 * generated cards and the original UI blocks.
 * 3. Delimiter Specification: Explicitly defines semicolon (;) delimiters for multi-blank answers 
 * to avoid CSV-style parsing errors.
 * 4. Contextual Chunking: Supports partial study material (Chunks) to handle large documents 
 * without exceeding LLM token limits.
 */

/**
     * @method buildSingleFlashcardSystemInstruction
     * @description A specialized, high-precision instruction set for generating 
     * exactly one flashcard. This is typically used for "Regenerate" or "Add One" 
     * features where a user targets a specific snippet of text.
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
    9. **Fill-in-the-blank Format:** Use EXACTLY three underscores (___) for each blank.
    10. **Multi-blank Answers:** If a card has multiple blanks, the 'answer' field MUST 
    contain the answers in the correct order, separated by a SEMICOLON (e.g., "Answer One; Answer Two"). 
    Do not use commas as delimiters, as they may appear within the answers themselves.
    `
}

/**
 * @method buildUserPrompt
 * @description Constructs the dynamic portion of the prompt, including chunk indices 
 * and user-defined focus instructions (e.g., "Focus on chemical formulas").
 */
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
   

    /**
 * @method buildSingleFlashcardSystemInstruction
 * @description Optimized instruction set for "Single Card Regeneration." 
 * Used when a user updates a specific block and wants to refresh only the affected cards.
 */
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
        8. **Fill-in-the-blank Format:** Use EXACTLY three underscores (___) for each blank.
        9. **Multi-blank Answers:** If a card has multiple blanks, the 'answer' field MUST 
        contain the answers in correct order, separated by a SEMICOLON (e.g., "Ans 1; Ans 2").`;
    }

    /**
     * @method buildSingleFlashcardUserPrompt
     * @description Constructs the scoped user prompt for a single-card generation request.
     * Focuses the AI's "attention" on a specific selection of text rather than a full document.
     */
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
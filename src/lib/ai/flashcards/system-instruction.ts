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

    const typeSpecificRules = desiredTypes.map(type => {
        switch(type){
            case 'diagram':
                return `- DIAGRAM cards: Generate a Mermaid diagram (flowchart LR or graph TD syntax)
                    in the 'diagram' field. The 'question' should ask the user to interpret or complete
                    the diagram. Keep diagrams simple - max 6 nodes.`;
            case 'image-labeling':
                return `- IMAGE-LABELING cards: If the source material contains image URLs (in format
                    [IMAGE: url]), use them. The 'question' field should be the image URL. The 'answer'
                    field should contain comma-separated labels the image represents.
                    The blanks array should contain the label positions.`;
            case 'chart':
                return `- CHART cards: Generate a simple JSON chart data structure in 'charData' field with
                    labels[] and values[]. Question asks user to interpret it.`;
            default:
                return '';
        }
    }).filter(Boolean).join("\n");

    return `You are an expert educational flashcard generator. Your task is to analyze the provided study material 
    and generate high-quality flashcards for ANY profession or background - not just students. This could be medical
    notes, legal documents, cooking recipes, programming concepts, business strategy, or any other domain.
    
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
    11. Universal language: Write in plain, clear language appropriate for the subject domain.
    ${typeSpecificRules}
    `.trim();
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
        `.trim();
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
        contain the answers in correct order, separated by a SEMICOLON (e.g., "Ans 1; Ans 2").`
        .trim();
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
        `.trim();
    }

    /**
     * @method buildDiagramFlashcardPrompt
     * @description Prompt for generating a diagram flashcard for concept text.
     * Used by GenerateDiagramFlashcard in generate-flashcard-from-chunks.ts
     */

    export function buildDiagramFlashcardPrompt(
        conceptText: string,
        fileTitle: string
    ): string{
        return `
        You are generating a diagram-based flashcard from material titled: "${fileTitle}".

        Material:
        ---
        ${conceptText}
        ---

        Generate a Mermaid diagram (flowchart LR syntax) representing the key concept of process.
        Then write a question asking the user to interpret, complete, or explain the diagram.

        Return ONLY valid JSON (no markdown, no explanation):
        {
            "question": "what does this diagram represent?",
            "diagram": "flowchart LR/n A[Concept] --> B[Result]",
            "answer": "Brief explanation of the diagram",
            "source_context": "short phrase from material",
            "blockIdsUsed": []
        }

        Keep the diagram simple - maximum 6 nodes, Use real concept from the material.
        `.trim();
    }

    /**
     * @method buildSimplificationPrompt
     * @description Prompt for simplifying complex content into plain language. 
     * Used by /api/file/[fileId]/simplify route
     * Intentionally profession-agnostic - works for research papers, legal docs, technical specs,
     * medical notes, etc.
     */

    export function buildSimplificationPrompt(
        fullText: string,
        targetAudience?: string,
    ): string{
        const audienceContext = targetAudience
            ? `The reader is :${targetAudience}.`
            : "The reader has no prior knowledge of this specific topic."
        return `
        Simplify the following content so it is easy to understand.
        ${audienceContext}

        Instructions:
        - Use plain, everyday language.
        - Explain technical terms briefly when they first appear.
        - Keep the same section structure as the original.
        - Do not skip important information - just express it more clearly
        - Use short sentences
        - For processes or steps, use numbered lists
        - Target length: about 60% of the original

        Content: 
        ---
        ${fullText.slice(0, 8000)}
        ---

        Return the simplified content as plain text with original section heading preserved.
        `.trim();
    }
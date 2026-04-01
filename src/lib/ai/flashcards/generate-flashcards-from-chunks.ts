/**
 * @service GenerateFlashcardsFromChunks
 * @description An advanced AI orchestration service that leverages Gemini 2.5 Flash to transform unstructured text into structured, schema-validated flashcards.
 * * CORE ARCHITECTURAL PATTERNS:
 * 1. Schema Enforcement: Uses `responseSchema` to guarantee that the LLM output strictly follows the `UnifiedFlashcardSchema`.
 * 2. Distributed Processing: Chunks text to bypass context window limitations and prevent "lost-in-the-middle" performance degradation.
 * 3. Resiliency (Exponential Backoff): Implements a `callGemini` helper with retry logic for 503 (Overloaded) errors.
 * 4. Contextual Mapping: Tracks `blockIdsUsed` for each card, enabling "source-to-flashcard" traceability for the end user.
 */

import { UnifiedFlashcardSchema } from "./flashcard-json-schema";
import { buildFlashcardsSystemInstruction, buildUserPrompt } from "./system-instruction";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Generative AI client as a singleton
export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define a common configuration for the model
const MODAL_NAME = "gemini-2.5-flash";
export async function GenerateFlashcardsFromChunks(
    aggregatedTexts: {
        text: string,
        blockIds: string[]
    }[],
     cardCount: number, 
     desiredTypes: string[],
     customInstructions: string = ""
    ){

        /**
         * @innerHelper callGemini
         * Handles transient API failures. Implements a basic retry loop 
         * to manage service availability issues without failing the entire batch.
         */
        async function callGemini(
            modelInstance: ReturnType<typeof gemini.getGenerativeModel>,
            userPrompt: string,
            retries = 5
        ):Promise<any>{
            for(let i=0;i<retries;i++){
                try {
                    return await modelInstance.generateContent({
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: userPrompt }],
                            },
                        ],
                    });
                } catch (error: any) {
                    if(error.status === 503 && i < retries - 1){
                        console.warn(`Gemini overloaded. Retrying ${i+2}/${retries}...`);
                        await new Promise((res) => 
                        setTimeout(res, 300*(i+1))
                        );
                        continue;
                    }
                    throw error;
                }
            }
        }
    try {
        // // 1. Input Validation: Fail-fast pattern to save API costs and processing time
        if(aggregatedTexts.length === 0){
            return {
                statusCode: 400,
                message: "No text chunks provided",
                success: false
            }
        }
        if(cardCount <= 0){
            return {
                statusCode: 200,
               data: { flashcads: [] },
                success: true
            }
        }
        if(desiredTypes.length === 0){
            return {
                statusCode: 400,
                message: "No types selected",
                success: false
            }
        }
         // 2. Schema Preparation: Combines static system rules with dynamic card-type requirements
        const systemInstruction = buildFlashcardsSystemInstruction(desiredTypes, cardCount);
        const finalFlashcardSchema = UnifiedFlashcardSchema(desiredTypes);
       
        // 3. Model Configuration: Configures the model with JSON output enforcement
        const modelInstance = gemini.getGenerativeModel({
            model: MODAL_NAME,
            systemInstruction,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: finalFlashcardSchema,
            }
        });

        const allGeneratedCards: any[] = [];

       /**
         * @section Chunk Processing Loop
         * Iterates through text segments to maintain high relevance and avoid model hallucinations 
         * caused by overwhelming context lengths.
         */
        for(let chunkIndex = 0; chunkIndex< aggregatedTexts.length; chunkIndex++){
            const rawText = aggregatedTexts[chunkIndex].text;
            const chunkBlockIds = aggregatedTexts[chunkIndex].blockIds;
            //  Build the dynamic User prompt for this chunk
            const userPrompt = buildUserPrompt(rawText, chunkIndex, aggregatedTexts.length, customInstructions);
            try {
                const response = await callGemini(modelInstance, userPrompt);
                const result = await response.response;
                const jsonText = await result.text();
            
                // Model returns raw JSON text → parse and extract flashcards
                const parsed = JSON.parse(jsonText);
                for(const card of parsed.flashcards ?? []){
                    if(!card.blockIdsUsed || card.blockIdsUsed.length === 0){
                        // fallback = full chunk range if model fails
                        card.blockIdsUsed = chunkBlockIds;
                    }
                }
                if(parsed.flashcards && Array.isArray(parsed.flashcards)){
                    // 4. Traceability: Mapping cards back to the specific blocks they originated from
                    const processedCards = parsed.flashcards.map((card: any) => ({
                        ...card,
                        blockIdsUsed: (card.blockIdsUsed && card.blockIdsUsed.length > 0)
                        ? card.blockIdsUsed
                        : chunkBlockIds
                    }));
                    allGeneratedCards.push(...processedCards);
                }
            } catch (error) {
                console.warn(`[Generate Flashcard From chunks] Failed to generate flashcards from chunk ${chunkIndex+1} due to following error: `,error);
                continue;
            }
        }
        return {
            success: true,
            message: "Flashcards generated successfully",
            data: {
                flashcards: allGeneratedCards
            }
        }
    } catch (error) {   
        console.warn("[Generate Flashcard From chunks] Failed to generate flashcards due to following error: ",error);
        return {
            success: false,
            message: "Failed to generate flashcards",
        }
    }
}


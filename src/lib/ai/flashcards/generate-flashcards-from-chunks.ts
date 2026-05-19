/**
 * @service GenerativeFlashcardsFromChunks
 * @description Transform text chunks into schema-validated flashcards using Gemini.
 * 
 * Uses shared gemini client and callGeminiWithRetry from lib/ai/gemini-client.ts instead of 
 * defining its own retry logic.
 */

import { UnifiedFlashcardSchema } from "./flashcard-json-schema";
import { callGeminiWithRetry, GEMINI_MODEL } from "./gemini-client";
import { buildDiagramFlashcardPrompt, buildFlashcardsSystemInstruction, buildUserPrompt } from "./system-instruction";
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
                const response = await callGeminiWithRetry(modelInstance, userPrompt);
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

/**
 * Generate a single diagram Flashcard from concept/text content.
 * Called when user requests diagram-type cards for a specific concept.
 */

export async function GenerateDiagramFlashcard(
    conceptText: string,
    fileTitle: string,
    blockIds: string[]
){
    try {
        const modelInstance = gemini.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const prompt = buildDiagramFlashcardPrompt(conceptText, fileTitle);
        const response = await callGeminiWithRetry(modelInstance, prompt);
        const result = await response.response;
        const jsonText = await result.text();
        const parsed = JSON.parse(
            jsonText.replace(/```json|```/g, "").trim()
        );

        return {
            success: true,
            card: {
                type: "diagram",
                question: parsed.question || "What does this diagram represent?",
                answer: parsed.answer || "",
                diagram: parsed.diagram || "",
                source_context: parsed.source_context || "",
                blockIdsUsed: blockIds,
                options: [],
                chartData: null,
            },
        };
        
    } catch (error) {
        console.warn("[GenerateDiagramFlashcard] Failed: ",error);
        return {
            success: false,
            card: null,
        };
    }
}


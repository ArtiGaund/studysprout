/**
 * Generates flashcards from multiple text chunks using Gemini.
 * 
 * Responsibilities:
 * - Validates input (chunks, cardCount, desiredTypes).
 * - Build system intructions and response schema based on chosen card types.
 * - Instantiate a configured Gemini model instance.
 * - Process chunks one-by-one and aggregated generated flashcards.
 * 
 * Notes:
 * - Returns flashcards in a normalized structure (success, message, etc).
 * - Schema - enforced: model output is validated using `UnifiedFlashcardSchema`.
 * - Chunk loop continues even if some chunks fail (best-effort generation).
 */


import { UnifiedFlashcardSchema } from "./flashcard-json-schema";
import { buildFlashcardsSystemInstruction, buildUserPrompt } from "./system-instruction";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Initialize the client once
export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define a common configuration for the model
const MODAL_NAME = "gemini-2.5-flash";
export async function GenerateFlashcardsFromChunks(
    aggregatedTexts: string[],
     cardCount: number, 
     desiredTypes: string[],
     customInstructions: string = ""
    ){

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
        // 1. Fast-fail for invalid or incomplete parameters
        if(aggregatedTexts.length === 0){
            return {
                statusCode: 400,
                message: "No text chunks provided",
                success: false
            }
        }
        if(cardCount < 5){
            return {
                statusCode: 400,
                message: "Minimum card count is 5",
                success: false
            }
        }
        if(desiredTypes.length === 0){
            return {
                statusCode: 400,
                message: "No types selected",
                success: false
            }
        }
        // 2. Build the System Instruction (Build static + dynamic instructions that govern model behavior)
        const systemInstruction = buildFlashcardsSystemInstruction(desiredTypes, cardCount);

        const finalFlashcardSchema = UnifiedFlashcardSchema(desiredTypes);

       //3. Create a single Gemini model instance for the entire batch

        const modelInstance = gemini.getGenerativeModel({
            model: MODAL_NAME,
            systemInstruction,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: finalFlashcardSchema,
            }
        });

        const allGeneratedCards: any[] = [];

       //4. Process each chunk independently to avoid model context limits

        for(let chunkIndex = 0; chunkIndex< aggregatedTexts.length; chunkIndex++){
            const chunk = aggregatedTexts[chunkIndex];
            // 5. Build the dynamic User prompt for this chunk
            const userPrompt = buildUserPrompt(chunk, chunkIndex, aggregatedTexts.length, customInstructions);
            try {
                const response = await callGemini(modelInstance, userPrompt);
                const result = await response.response;
                const jsonText = await result.text();
            
                //6. Model returns raw JSON text → parse and extract flashcards
                const parsed = JSON.parse(jsonText);
                
                if(parsed.flashcards && Array.isArray(parsed.flashcards)){
                    allGeneratedCards.push(...parsed.flashcards);
                }
            } catch (error) {
                console.warn(`[Generate Flashcard From chunks] Failed to generate flashcards from chunk ${chunkIndex+1} due to following error: `,error);
                continue;
            }
        }
        //7. Final unified structured response

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


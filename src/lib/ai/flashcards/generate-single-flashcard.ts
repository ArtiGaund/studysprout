import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSingleFlashcardSystemInstruction, buildSingleFlashcardUserPrompt } from "./system-instruction";
import { UnifiedFlashcardSchema } from "./flashcard-json-schema";
import { chunkBlocks } from "@/helpers/chunkBlocks";


// Initialize the client once
export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define a common configuration for the model
const MODAL_NAME = "gemini-2.5-flash";

export async function GenerateSingleFlashcard(
    preparedText: string,
    type: string,
    blockIds: string[]
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
        if(preparedText.length === 0){
            return  {
                statusCode: 400,
                message: "No text provided",
                success: false
            }
        }

        const systemInstruction = buildSingleFlashcardSystemInstruction(type);

         const finalFlashcardSchema = UnifiedFlashcardSchema([type]);

          const modelInstance = gemini.getGenerativeModel({
                     model: MODAL_NAME,
                     systemInstruction,
                     generationConfig: {
                         responseMimeType: "application/json",
                         responseSchema: finalFlashcardSchema,
                     }
        });

        const userPrompt = buildSingleFlashcardUserPrompt(preparedText);

        try {
            const response = await callGemini(modelInstance, userPrompt);
            const result = await response.response;
            const jsonText = await result.text();
            
                //6. Model returns raw JSON text → parse and extract flashcards
            const parsed = JSON.parse(jsonText);

            if(
                !parsed.flashcards ||
                !Array.isArray(parsed.flashcards) ||
                parsed.flashcards.length === 0
            ){
                throw new Error("Gemini did not generate a flashcard");
            }

            const card = parsed.flashcards[0];

            if(!card.blockIdsUsed || card.blockIdsUsed.length === 0){
                card.blockIdsUsed = blockIds;
            }
            return {
            statusCode: 200,
            message: "Outdated flashcard regenerated",
            flashcard: card,
            success: true
        }
        } catch (error) {
            console.warn(`[Generate Single Flashcard] Failed to regenerate outdated flashcard due to 
                following error: `,error);
            return {
                statusCode: 500,
                message: "Failed to regenerate flashcard",
                success: false
            };
        }
       
    } catch (error) {
        console.warn(`[Generate Single Flashcard] Failed to regenerate outdated flashcard due to 
            following error: `,error);
        return {
            statusCode: 500,
            message: "Failed to regenerate flashcard",
            success: false
        };
    }
}
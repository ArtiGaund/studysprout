/**
 * @module geminiClient
 * @description Shared Gemini API client and retry wrapper used across all AI features.
 * 
 * Why centralized:
 * - Single initialization of GoogleGenerativeAI (singleton pattern)
 * - Retry logic with exponential backoff in one place
 * - All Gemini calls share the same error handling behavior
 * - Easy to swap model version or add rate limiting in one file
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazily-initialized singleton — constructed on first use, not at import time.
// This avoids crashing Next.js build steps (or any module that imports this file)
// when GEMINI_API_KEY isn't present in that particular execution context.
let _gemini: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI {
  if (!_gemini) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    _gemini = new GoogleGenerativeAI(key);
  }
  return _gemini;
}

export const GEMINI_MODEL = "gemini-2.5-flash";

export type GeminiModelInstance = ReturnType<ReturnType<typeof getGemini>["getGenerativeModel"]>;

/**
 * Wraps a Gemini generateContent call with exponential backoff retry logic.
 * 
 * Handles 503 (model overloaded) errors specifically - these are transient and always worth retrying.
 * Other errors are thrown immediately.
 * 
 * @param modelInstance - A configured model from gemini-getGenerativeModel()
 * @param userPrompt - The user message to send
 * @param retries - Max attempts before throwing (default: 5)
 */
export async function callGeminiWithRetry(
    modelInstance: GeminiModelInstance,
    userPrompt: string,
    retries = 5,
): Promise<any>{
    for(let i = 0;i < retries; i++){
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
            const isOverloaded = error.status === 503;
            const canRetry = i < retries - 1;

            if(isOverloaded && canRetry){
                const waitMs = 300 * ( i + 1); //300ms, 600ms, 900ms...
                console.warn(
                    `[Gemini] Overloaded. Retry ${i + 2}/${retries} in ${waitMs}...`
                );
                await new Promise(res => setTimeout(res, waitMs));
                continue;
            }
            throw error;
        }
    }
}

/**
 * Convenience wrapper for simple text-in, text-out Gemini calls.
 * Used by: analyze route, simplify route, concept graph builder
 * 
 * For structured JSON output with schema enforcement, use callGeminiWithRetry directly with a 
 * configured modelInstance.
 * 
 * @param prompt - The full prompt to send
 * @param maxOutputTokens - Optional token limit (default: 2048)
 */
export async function callGeminiText(
    prompt: string,
    maxOutputTokens = 2048
): Promise<string>{
    const model = getGemini().getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { maxOutputTokens },
    });

    for(let i = 0;i < 3; i++){
        try {
            const response = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }],
                }]
            });
            return response.response.text();
        } catch (error: any) {
            const isOverloaded = error.status === 503;
            const canRetry = i < 2;
            
            if(isOverloaded && canRetry){
                await new Promise(res => setTimeout(res, 500 * (i+1)));
                continue;
            }
            throw error;
        }
    }

    return "";
}
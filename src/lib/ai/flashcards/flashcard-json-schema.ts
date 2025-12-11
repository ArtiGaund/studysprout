/**
 * Flashcard schema definitions for Gemini response shaping.
 * 
 * Responsibility:
 * - Enforces structure of generated flashcards (type, question, answer, etc).
 * - Ensures the model outputs predictable, typed JSON.
 * - Used by the flashcard generation route call before calling Gemini.
 * 
 * Notes:
 * - Does NOT contain business logic.
 * - Does NOT validate user input; only controls model output format.
 */

import { type ObjectSchema, type SimpleStringSchema, type ArraySchema, SchemaType, EnumStringSchema } from "@google/generative-ai";

const FlashcardTypeEnum: EnumStringSchema = {
  type: SchemaType.STRING,
  enum: ["question-answer", "fill-in-the-blank", "mcq"],
  format: "enum", //Enum type must include `format` to satisfy EnumStringSchema requirements.
}
// Flashcard item schema
const FlashcardItemSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    type: FlashcardTypeEnum,
    question: { type: SchemaType.STRING },
    answer: { type: SchemaType.STRING },
    options: {
      type: SchemaType.ARRAY,
      items: { type: "string" } as SimpleStringSchema,
    } as ArraySchema,
    source_context: { type: SchemaType.STRING },
  },
  required: ["type", "question", "answer", "source_context"],
};

export const UnifiedFlashcardSchema = (desiredTypes: string[]): ObjectSchema => ({
  type: SchemaType.OBJECT,
  properties: {
    flashcards: {
      type: "array",
      items: FlashcardItemSchema,
    } as ArraySchema,
  },
  required: ["flashcards"],
});

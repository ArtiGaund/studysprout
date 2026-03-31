/**
 * @model Flashcard
 * @description The core data entity for AI-generated study units in StudySprout. 
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Polymorphic Resource Binding: Supports Workspace, Folder, or File-level scoping via `resourceType`.
 * 2. Data Lineage (Source Tracking): Maps cards to specific `blockIds`, enabling "Jump to Source" UI features.
 * 3. Reactive State Management: Stores `blocksState` with timestamps to detect when the original note 
 * has changed, flagging the card for AI-regeneration.
 * 4. Extensible SR (Spaced Repetition): Schema includes commented hooks for SM-2 or similar 
 * algorithms (Ease Factor, Intervals, Due Dates).
 */
import mongoose, { Schema, Document, Types } from "mongoose";

export interface Flashcard{ 
    question: string;
    answer: string;
    type: "question-answer" | "fill-in-the-blank" | "mcq";
    options?: string[]; //for mcq

    parentSetId?: Types.ObjectId | string; //link back to Flashcardset
    resourceId: Types.ObjectId | string; //workspace/folder/file
    resourceType: "Workspace" | "Folder" | "File";

    createdBy: Types.ObjectId | string; 
    createdFor: string;
    updatedAt: Date;

    // Traceability Metadata: Links the generated card back to the source editor blocks
    source: {
        fileIds: string[];
        blockIds: string[];
        startBlockId?: string;
        endBlockId?: string;
        blocksState: Record<string, {
            updatedAt: Date;
        }>;
    },
}

/**
 * @schema SourceSchema
 * @internal Sub-document for tracking block-level dependencies. 
 * Essential for the 'Outdated Card' detection logic.
 */
const SourceSchema = new Schema({
     fileIds: [{
        type: Schema.Types.ObjectId,
        ref: "File",
        required: true,
       }],
       blockIds:[{
        type: String,
        required: true,
       }],
       startBlockId: String,
       endBlockId: String,
       blocksState: {
        type: Map,
        of: new Schema({
            updatedAt: {
                type: Date,
                required: true,
            },
        }, { _id: false }),
        required: true,
       }
}, { _id: false});
/**
 *  Flashcard Schema
 * Defines database fields and validation.
 */
export const FlashcardSchema: Schema<Flashcard> = new Schema({
   question: {
       type: String,
       required: true,
   },
   answer: {
       type: String,
       required: true,
   },
   type: {
       type: String,
       required: true,
   },
   options: {
       type: [String],
   },

   // Hierarchical Relationships
   parentSetId: {
       type: mongoose.Schema.Types.ObjectId,
       required: false,
       ref: "FlashcardSet",
   },
   resourceId: {
       type: mongoose.Schema.Types.ObjectId,
       required: true,
   },
   resourceType: {
       type: String,
       required: true,
   },
   createdBy: {
       type: mongoose.Schema.Types.ObjectId,
       required: true,
       ref: "User",
   },
   createdFor: {
       type: String,
    //    required: true,
   },
   source: {
      type: SourceSchema,
      required: true
   }
}, { timestamps: true });

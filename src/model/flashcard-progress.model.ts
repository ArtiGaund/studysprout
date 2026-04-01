/**
 * @schema FlashcardProgress
 * @description The data model for tracking Spaced Repetition System (SRS) metrics.
 * * ARCHITECTURAL IMPACT:
 * 1. SM-2 Implementation: Stores the core variables (Interval, Ease Factor, Repetition) 
 * required to calculate the next review date.
 * 2. Performance Indexing: A unique compound index on {userId, flashcardId, dueDate} 
 * ensures query efficiency for "Today's Review" queues and prevents duplicate tracking.
 * 3. Workspace Isolation: Includes `workspaceId` to allow for rapid multi-tenant 
 * cleanup and workspace-level statistics.
 * 4. Normalization: Separates static flashcard content from dynamic user progress 
 * to optimize storage and performance.
 */
import { Schema, Types } from "mongoose";

export interface IFlashcardProgress{
    userId: Types.ObjectId;
    flashcardId: Types.ObjectId;
    workspaceId: Types.ObjectId;

    // --- SRS Core (SM-2 Algorithm) ---
    interval: number;      // Current gap (in days) between reviews
    difficulty: number;    // Ease Factor: Adjusts how quickly the interval expands (Default: 2.5)
    repetition: number;    // Success streak: Consecutive correct answers
    dueDate: Date;         // The next scheduled time this card appears in the UI
    lastReviewed?: Date;   // Audit trail for history/streaks
}

export const FlashcardProgressSchema = new Schema<IFlashcardProgress>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    flashcardId: {
        type: Schema.Types.ObjectId,
        ref: "Flashcard",
        required: true,
    },
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    interval: {
        type: Number,
        default: 1,
    },
    difficulty: {
        type: Number,
        default: 2.5,
    },
    repetition: {
        type: Number,
        default: 0,
    },
    dueDate: {
        type: Date,
        default: Date.now,
    },
    lastReviewed: {
        type: Date,
    },
}, {
    timestamps: true,
    collection: 'flashcard_progress',
});

/**
 * @index Compound Index
 * Optimizes the "Get Due Cards" query which is the most frequent DB operation.
 * Constraints { unique: true } prevent a user from having multiple progress paths 
 * for the same card.
 */
FlashcardProgressSchema.index({
    userId: 1,
    flashcardId: 1,
    dueDate: 1,
}, { unique: true });


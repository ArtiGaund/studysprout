/**
 * @schema FlashcardProgress
 * @description Stores per-user spaced repetition (SM-2) progress for each flashcard.
 *
 * KEY FIELDS:
 * - interval: days until next review
 * - difficulty (ease factor): starts at 2.5 adjusts based on ratings.
 * - repetition: how many times reviewed correctly in a row
 * - dueDate: when to show this card next
 * - lastReviewed: when the user last rated this card
 * - flagged: user manually marked for review
 * 
 * CRITICAL: compound unique index on {userId, flashcardId}
 * This ensures each user has exactly one progress record per card, and make per-user per-card
 * lookups O(log n)
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
    flagged?: boolean;     //user manually flagged for extra attention
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
    flagged: {
        type: Boolean,
        default: false,
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


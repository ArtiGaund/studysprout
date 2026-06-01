/**
 * @model UserProgress
 * @description Tracks which files a user has completed.
 * Used by generateStudyPlan() as `completedFileIds` to:
 * 1. Skip already-read files
 * 2. Unlock files whose prerequisites are now met
 * 
 * Also used to calculate sub-concepts clearly today for the Weekly Learning Goal display.
 * 
 */
import { Schema, Types } from "mongoose";

export interface IUserProgress{
    userId: Types.ObjectId;
    fileId: Types.ObjectId;
    folderId: Types.ObjectId;
    workspaceId: Types.ObjectId;

    completedAt: Date;

    // how long they spent (in minutes) - used for weekly hours calc
    minuteSpent?: number;

    // True if completed via flashcard mastery (repetition >= 3 on all cards)
    completedViaFlashcards?: boolean;
}

export const UserProgressSchema = new Schema<IUserProgress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fileId: {
            type: Schema.Types.ObjectId,
            ref: "File",
            required: true,
        },
        folderId: {
            type: Schema.Types.ObjectId,
            ref: "Folder",
            required: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        completedAt: {
            type: Date,
            default: Date.now(),
        },
        minuteSpent: {
            type: Number,
        },
        completedViaFlashcards: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: false }
);

// One complete record per user per file
UserProgressSchema.index({
    userId: 1,
    fileId: 1,
}, { unique: true });

// Folder-scoped lookup for generateStudyPlan and weekly hours calc
UserProgressSchema.index({
    userId: 1,
    folderId: 1,
    completedAt: -1,
});

// Weekly hours: filter by workspaceId + completedAt range
UserProgressSchema.index({
    userId: 1,
    workspaceId: 1,
    completedAt: -1,
});
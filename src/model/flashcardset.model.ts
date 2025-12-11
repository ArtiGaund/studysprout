/**
 * FlashcardSet Model
 * 
 * Represents a generated batch ("exam paper") of flashcards.
 * A set belongs to a specific resource (workspace/folder/file).
 * and contains references to individual Flashcards.
 */
import mongoose, { Schema, Types } from "mongoose"

export interface FlashcardSet{
    title: string;
    description?: string;
    workspaceId: Types.ObjectId | string;
    folderId?: Types.ObjectId | string;
    resourceId: Types.ObjectId | string; //workspace/folder/file
    resourceType: "Workspace" | "Folder" | "File";
    createdBy: Types.ObjectId | string;
    totalCards: number;
    flashcards: Types.ObjectId[]; //reference to flashcards
    createdAt: Date;
    updatedAt: Date;
}

export const FlashcardSetSchema: Schema<FlashcardSet> = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Workspace",
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
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
    totalCards: {
        type: Number,
        required: true,
    },
    flashcards: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
        ref: "Flashcard",
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        required: true,
    }
})
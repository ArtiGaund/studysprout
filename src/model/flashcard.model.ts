import mongoose, { Schema, Document, Types } from "mongoose";

export interface Flashcard{
    question: string;
    answer: string;
    workspaceId?: Types.ObjectId;
    folderId?: Types.ObjectId;
    fileId?: Types.ObjectId;
    createdBy: Types.ObjectId; 
    createdFor: string;

    // Spaced Repetition
    interval: number; //days till next review
    difficulty: number; //how easy/difficult the card is (easeFactor)
    repetition: number; //number of successful reviews
    dueDate: Date;
    lastReviewed?: Date;

}

export const FlashcardSchema: Schema<Flashcard> = new Schema({
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace"
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder"
    },
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdFor: {
        type: String,
        required: true,
    },

    // Spaced repetition fields
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
        default: Date.now(),
    },
    lastReviewed: {
        type: Date
    }
}, { timestamps: true })
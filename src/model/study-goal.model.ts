/**
 * @model StudyGoal
 * @description Stores per-user study targets scoped to either a workspace or folder.
 * Used to render the goal line on the Weekly Research Graph (Workspace) and the circular progress
 * ring on the Weekly Learning Goal (folder).
 * 
 * Scope logic:
 * - workspaceId only -> workspace-level daily activity target
 * - workspaceId + folderId -> folder-level weekly hour target
 * 
 */

import mongoose, { Schema, Types } from "mongoose";
import { number } from "zod";

export interface StudyGoal{
    userId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    folderId?: Types.ObjectId | null;   //null = workspace-level goal

    // Workspace-level: daily activity target (cards + files per day)
    dailyTarget: number; // default 10

    // Folder-level: weekly hour target
    weeklyTargetHours: number;       //default 20

    // name of subject shown in the learning goal text
    subjectLabel?: string;         //e.g. Linear Algebra

    updatedAt: Date;
    createdAt: Date;
}

export const StudyGoalSchema = new Schema<StudyGoal>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        folderId: {
            type: Schema.Types.ObjectId,
            ref: "Folder",
            default: null,
        },
        dailyTarget: {
            type: Number,
            default: 10,
        },
        weeklyTargetHours: {
            type: Number,
            default: 20,
        },
        subjectLabel: {
            type: String,
        },
    },
    { timestamps: true }
);

// One goal per user per scope (Workspace or Folder)
StudyGoalSchema.index(
    { 
        userId: 1,
        workspaceId: 1,
        folderId: 1,
    },
    { unique: true },
);


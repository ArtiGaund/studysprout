/**
 * @model ActivityEvent
 * @description Append-only log of significant user actions within a workspace.
 * Power the "Recent Activity" feed on the workspace dashboard and the "View All Activity" page.
 * 
 */

import { Schema, Types } from "mongoose";

export type ActivityEventType =
    | "FILE_CREATED"
    | "FILE_UPDATED"
    | "FILE_ARCHIVED"
    | "FLASHCARD_SET_GENERATED"
    | "FLASHCARD_SET_DELETED"
    | "FLASHCARD_SET_REGENERATED"
    | "SYNTHESIS_COMPLETED"
    | "FOLDER_CREATED"
    | "FOLDER_DELETED"
    | "CONNECTION_CREATED"
    | "GOAL_UPDATED"
    | "MEMBER_JOINED"
    | "MEMBER_REMOVED";

export interface IActivityEvent{
    workspaceId: Types.ObjectId;
    folderId?: Types.ObjectId;
    fileId?: Types.ObjectId;
    userId?: Types.ObjectId;

    type: ActivityEventType;
    description: string;
    metadata?: Record<string, any>;

    createdAt: Date;
}

export const ActivityEventSchema = new Schema<IActivityEvent>(
    {
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
        fileId: {
            type: Schema.Types.ObjectId,
            ref: "File",
            default: null,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                "FILE_CREATED",
                "FILE_UPDATED",
                "FILE_ARCHIVED",
                "FLASHCARD_SET_GENERATED",
                "FLASHCARD_SET_DELETED",
                "FLASHCARD_SET_REGENERATED",
                "SYNTHESIS_COMPLETED",
                "FOLDER_CREATED",
                "FOLDER_DELETED",
                "CONNECTION_CREATED",
                "GOAL_UPDATED",
                "MEMBER_JOINED",
                "MEMBER_REMOVED",
            ],
        },
        description: {
            type: String,
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        }
    },
);

// Primary feed index
ActivityEventSchema.index({
    workspaceId: 1,
    createdAt: -1,
});
// Folder-scoped filter
ActivityEventSchema.index({
    workspaceId: 1,
    folderId: 1,
    createdAt: -1,
});
// Type filter on "View all Activity" page
ActivityEventSchema.index({
    workspaceId: 1,
    type: 1,
    createdAt: -1,
});

ActivityEventSchema.index(
    { createdAt: 1},
    { expireAfterSeconds: 60 * 60 * 24 * 90 }
);


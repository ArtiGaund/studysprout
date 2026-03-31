/**
 * @module WorkspaceModel
 * @description The core Mongoose schema for the 'Workspaces' collection. 
 * Orchestrates high-level metadata and permission-based access control.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. RBAC (Role-Based Access Control): Implements a `members` sub-document array with 'editor'/'viewer' roles.
 * 2. Hybrid ID Strategy: Supports both `Types.ObjectId` and `string` to ensure compatibility between 
 * the MongoDB driver and the Frontend/Redux types.
 * 3. Soft-Deletion Support: Includes an `inTrash` field to allow for "Undo" functionality.
 * 4. Relational Integrity: Links to "User", "Folder", and "Image" collections via MongoDB `ref`.
 */
import mongoose, { Schema, Types } from "mongoose";

// --- Types --
export type WorkspaceMemberRole = "editor" | "viewer";

/**
 * @interface WorkspaceMemberDB
 * Defines the structure for collaborative access. 
 */
export interface WorkspaceMemberDB {
    userId: Types.ObjectId | string;
    role: WorkspaceMemberRole;
    addedAt?: Date;
}
export interface WorkSpace{
    _id: Types.ObjectId |string,
    workspace_owner: Types.ObjectId | string, // Primary owner with full privileges
    title?: string,
    iconId?: string,
    data?: string,            // Catch-all for legacy or unstructured metadata
    inTrash?: string,          // Timestamp or ID indicating "Trash" status
    logo?: Types.ObjectId | string,
    bannerUrl?: string,
    folders?: Types.ObjectId[] | string[],  // One-to-Many relationship with Folders
    members?: WorkspaceMemberDB[];           // Collaborative members
    isPublic?: boolean;                      // Privacy toggle
}

// --- Schema Definition ---
export const WorkspaceSchema: Schema<WorkSpace> = new Schema({
    workspace_owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
         required: true
    },
    title:{
        type: String,
        required: [true, "workspace name is required"],
        unique: true,
        sparse: true, //Allow multiple workspace with same title
    },
    iconId:{
        type: String,
        // unique: true,
         // required: [true, "Workspace icon is required"],
    },
    data:{
        type: String,
    },
    inTrash: {
        type: String,
    },
    logo:{
        type:  Schema.Types.ObjectId,
        ref: "Image"
    },
    bannerUrl:{
        type: String,
    },
    folders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder"
    }],
    members: {
        type: [
        { 
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            role: {
                type: String,
                enum: ["editor", "viewer"],
                default: "editor",
            },
            addedAt: {
                type: Date,
                default: Date.now,
            }
        }
    ],
    default: [],
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
},
{
    timestamps: true   // Automatically generates 'createdAt' and 'updatedAt'
})

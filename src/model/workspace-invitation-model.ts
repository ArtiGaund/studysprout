import mongoose, { Schema } from "mongoose";

export type InviteStatus = "pending" | "accepted" | "rejected";

export interface WorkspaceInvitation {
    workspaceId: mongoose.Types.ObjectId;
    workspaceTitle: string;
    invitedBy: mongoose.Types.ObjectId;
    invitedByUsername: string;
    invitedUser: mongoose.Types.ObjectId;
    role: "editor" | "viewer";
    status: InviteStatus;
    createdAt: Date;
    updatedAt: Date;
}

export const WorkspaceInvitationSchema: Schema<WorkspaceInvitation> = new Schema({
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    workspaceTitle: {
        type: String,
        required: true,
    },
    invitedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    invitedByUsername: {
        type: String,
        required: true,
    },
    invitedUser: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: [ "editor", "viewer"],
        default: "editor",
    },
    status: {
        type: String,
        enum: [ "pending", "accepted", "rejected" ],
        default: "pending",
    },
}, {
    timestamps: true,
});

/**
 * Prevent duplicate pending invitations for the same workspace + user.
 * A user can be re-invited after rejecting (status changes from pending, so the unique constraint
 * no longer blocks it)
 */
WorkspaceInvitationSchema.index(
    { 
        workspaceId: 1,
        invitatedUser: 1,
    },
    {
        unique: true,
        partialFilterExpression: { status: "pending" },
        name: "unique_pending_invite",
    }
);



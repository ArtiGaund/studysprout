import mongoose, { Schema } from "mongoose";

export type NotificationType = 
    | "invitation_received"
    | "invitation_rejected"
    | "invitation_accepted";

export interface Notification {
    recipientId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderUsername: string;

    type: NotificationType;

    // Contextual metadata
    workspaceId: mongoose.Types.ObjectId;
    workspaceTitle: string;
    invitationId?: mongoose.Types.ObjectId;
    role?: "editor" | "viewer";

    // State
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const NotificationSchema: Schema<Notification> = new Schema({
    recipientId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    senderUsername: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: [ "invitation_received", "invitation_accepted", "invitation_rejected"],
        required: true,
    },
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    workspaceTitle: {
        type: String,
        required: true,
    },
    invitationId: {
        type: Schema.Types.ObjectId,
        req: "WorkspaceInvitation",
    },
    role: {
        type: String,
        enum: [ "editor", "viewer"],
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Auto-delete READ non-invitation notification after 30 days
NotificationSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: 30 * 24 * 60 * 60,
        partialFilterExpression: {
            read: true,
            type: [ "invitation_accepted", "invitation_rejected" ],
        },
    },
);
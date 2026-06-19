import { NotificationModel } from "@/model";
import { NotificationType } from "@/model/notification.model";
import mongoose from "mongoose";
import { emitServerEvent } from "../server-realtime";

interface CreateNotificationParams{
    recipientId: string;
    senderId: string;
    senderUsername: string;
    type: NotificationType;
    workspaceId: string;
    workspaceTitle: string;
    invitationId?: string;
    role?: "editor" | "viewer"; 
}

export async function createNotification(params: CreateNotificationParams){
    const {
        recipientId,
        senderId,
        senderUsername,
        type,
        workspaceId,
        workspaceTitle,
        invitationId,
        role,
    } = params;

    // Persist to DB
    const notification = await NotificationModel.create({
        recipientId: new mongoose.Types.ObjectId(recipientId),
        senderId: new mongoose.Types.ObjectId(senderId),
        senderUsername,
        type,
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        workspaceTitle,
        invitationId: invitationId ? new mongoose.Types.ObjectId(invitationId) : undefined,
        role,
        read: false,
    });

    // 2. Emit real-time to recipient's personal room
    await emitServerEvent("notification", {
        recipientId,
        notification: {
            _id: notification._id.toString(),
            recipientId,
            senderId,
            senderUsername,
            type,
            workspaceId,
            workspaceTitle,
            invitationId,
            role,
            read: false,
            createdAt: notification.createdAt.toISOString(),
        },
    });

    return notification;
}
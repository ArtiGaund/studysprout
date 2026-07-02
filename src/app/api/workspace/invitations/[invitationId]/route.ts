// user accept or reject invitation

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { createNotification } from "@/lib/notifications/createNotification";
import { emitServerRealtimeEvent } from "@/lib/realtime-emitter";

import { 
    NotificationModel, 
    UserModel, 
    WorkspaceInvitationModel, 
    WorkSpaceModel 
} from "@/model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";


export async function PATCH(
    request: NextRequest,
    { params }: { params: { invitationId: string }}
){
    /**
     * Body: { action: "accepted" | "rejected"}
     * 1. Auth
     * 2. Find invitation by id, verify invitedUser === session.user._id
     * 3. Verify status is still "pending"
     * 4. Update invitation.status = action
     * 5. If action === "accepted":
     *      -> run workspace.members.push({ userId, role, addedAt: new Date()})
     * 6. Notify owner via real-time:
     * emitServerRealtimeEvent('workspace-invitation', {
     *  workspaceId, invitedUserUsername, action: 'accepted' | 'rejected'
     * })
     * 7. Return successResponse
     */

    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Invitation Id PATCH route] Unauthorized",
            401,
            401,
        );

        const { invitationId } = params;
        if(!invitationId || !mongoose.Types.ObjectId.isValid(invitationId)){
            return errorResponse(
                "[Invitation Id PATCH route] Invalid invitation id",
                400,
                400,
            );
        }

        const { action } = await request.json();
        if(action !== "accepted" && action !== "rejected"){
            return errorResponse(
                `[Invitation PATCH route] action must be "accepted" or "rejected"`,
                400,
                400,
            );
        }

        // Find the invitation and verify ownership
        const invitation = await WorkspaceInvitationModel.findById(invitationId);
        if(!invitation) return errorResponse(
            "[Invitation Id PATCH route] Invitation not found",
            400,
            400,
        );

        if(invitation.invitedUser.toString() !== session.user._id){
            return errorResponse(
                "[Invitation PATCH route] Forbidden",
                403,
                403,
            );
        }

        // Idempotency guard - can only respond to a pending invite
        if(invitation.status !== "pending"){
            return errorResponse(
                `[Invitation PATCH route] Invitation is already been ${invitation.status}`,
                400,
                400,
            );
        }

        // Mutate status in-place
        invitation.status = action;
        await invitation.save();

        if(action === "accepted"){
            const workspace = await WorkSpaceModel.findById(invitation.workspaceId);

            if(!workspace){
                // Workspace was deleted been invite and response - roll back
                invitation.status = "rejected";
                await invitation.save();

                return errorResponse(
                    "[Invitation PATCH route] Workspace no longer exists",
                    404,
                    404,
                );
            }

            // Guard against race condition: user already added via another path
            const alreadyMember = workspace.members?.some(
                (member: any) => member.userId.toString() === session.user._id
            );
            if(!alreadyMember){
                workspace.members?.push({
                    userId: session.user._id,
                    role: invitation.role,
                    addedAt: new Date(),
                });
                await workspace.save();
            }

            // Fetch the accepting user's username from the real-time payload
            const acceptingUser = await UserModel.findById(session.user._id)
                .select("username email avatarType avatarUrl avatarInitials")
                .lean();

            // Notify all workspace clients to refresh the member list
            await emitServerRealtimeEvent("workspace-members-update", {
                workspaceId: invitation.workspaceId.toString(),
                userId: session.user._id,
                username: acceptingUser?.username,
                action: "added",
                member: {
                    _id: session.user._id,
                    username: acceptingUser?.username,
                    email: acceptingUser?.email,
                    avatarType: acceptingUser?.avatarType,
                    avatarUrl: acceptingUser?.avatarUrl,
                    avatarInitials: acceptingUser?.avatarInitials,
                    role: invitation.role,
                },
            });

            await emitServerRealtimeEvent("workspace-joined", {
                recipientId: session.user._id,
                workspace: {
                    _id: workspace._id.toString(),
                    workspace_owner: workspace.workspace_owner.toString(),
                    title: workspace.title,
                    iconId: workspace.iconId,
                    logo: workspace.logo,
                    bannerUrl: workspace.bannerUrl,
                    folders: workspace.folders?.map((f: any) => f.toString()),
                    isPublic: workspace.isPublic,
                }
            });
        }

        // Mark the invitation_received notification as read
        await NotificationModel.updateOne(
            {
                invitationId: invitation._id,
                type: "invitation_received",
                recipientId: session.user._id,
            },
            { $set: { read: true }},
        );

        // Notify the owner about the response
        const respondingUser = await UserModel.findById(session.user._id)
            .select("username")
            .lean(); 
        
        await createNotification({
            recipientId: invitation.invitedBy.toString(),
            senderId: session.user._id,
            senderUsername: respondingUser?.username ?? "Unknown",
            type: action === "accepted" ? "invitation_accepted" : "invitation_rejected",
            workspaceId: invitation.workspaceId.toString(),
            workspaceTitle: invitation.workspaceTitle,
            role: invitation.role,
        });
        
        return successResponse(
            `[Invitation PATCH route] Invitation ${action} successfully`,
            { action },
            200,
            200,
        );
    } catch (error) {
        console.error("[Invitation PATCH route] Error: ",error);
        return errorResponse(
            "[Invitation PATCH route] Internal Server Error",
            500,
            500,
        );
    }
}
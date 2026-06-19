import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { createNotification } from "@/lib/notifications/createNotification";
import { emitServerEvent } from "@/lib/server-realtime";
import { UserModel, WorkspaceInvitationModel, WorkSpaceModel } from "@/model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";


export async function POST(
    request: NextRequest,
    // { params }: { params: { workspaceId: string }}
){
    /**
     *  1. Auth + validate workspaceId
        2. Verify requester is workspace owner
        3. Check invitedUser is not already a member /owner
        4. Check no pending invitation already exists for this user + workspace
        5. Create WorkspaceInvitationModel document { workspaceId, invitedBy: ownerId, 
            invitedUser: userId, status: "pending"}
        6. Emit real-time notification to invitedUser's socket room:
        emitServerEvent('workspace-invitation', {
            invitationId, workspaceId, workspaceName, invitedBy: ownerName, action: "received"
        });
        7. Return successResponse("Invitation sent", 200)
     */
    try {
        await dbConnect();
        // 1. Auth + validate workspaceId
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Invitation POST route] Unauthorized user",
            401,
            401,
        );
  
        const { userId, workspaceId, role = "editor"} = await request.json();

        if(!userId) return errorResponse(
            "[Invitation POST route] UserId is required",
            400,
            400,
        );

         if(!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)){
            return errorResponse(
                "[Invitation POST route] Invalid workspaceId",
                400,
                400,
            );
        }

        const workspace = await WorkSpaceModel.findById(workspaceId);
        if(!workspace) return errorResponse(
            "[Invitation POST route] Workspace not found",
            404,
            404,
        );

        // Only the owner can send invites
        if(workspace.workspace_owner.toString() !== session.user._id){
            return errorResponse(
                "[Invitation POST route] Only the owner can invite members",
                403,
                403,
            );
        }

        // Cannot invite the owner themselves
        if(workspace.workspace_owner.toString() === userId){
            return errorResponse(
                "[Invitation POST route] Cannot invite the workspace owner",
                400,
                400,
            );
        }

        // Cannot invite someone already a member
        const alreadyMember = workspace.members?.some(
            (m) => m.userId.toString() === userId
        );
        if(alreadyMember){
            return errorResponse(
                "[Invitation POST route] User is a already a member of this workspace",
                400,
                400,
            );
        }

        // Prevent duplicate pending invites
        const existingInvite = await WorkspaceInvitationModel.findOne({
            workspaceId,
            invitedUser: userId,
            status: "pending",
        });
        if(existingInvite){
            return errorResponse(
                "[Invitation POST route] An invitation is already pending for this user",
                400,
                400,
            );
        }
        
        // Fetch owner's username for denormalisation
        const owner = await UserModel.findById(session.user._id)
            .select("username")
            .lean();
    
        // Create the invitation document
        const invitation = await WorkspaceInvitationModel.create({
            workspaceId,
            workspaceTitle: workspace.title,
            invitedBy: session.user._id,
            invitedByUsername: owner?.username ?? "Unknown",
            invitedUser: userId,
            role,
            status: "pending",
        });

        await createNotification({
            recipientId: userId,
            senderId: session.user._id,
            senderUsername: owner?.username ?? "Unknown",
            type: "invitation_received",
            workspaceId,
            workspaceTitle: workspace.title ?? "",
            invitationId: invitation._id.toString(),
            role,
        });

        return successResponse(
            "[Invitation POST route] Invitation sent successfully",
            {
                invitaionId: invitation._id,
            },
            200,
            200,
        );
    } catch (error: any) {
        // Duplicate key error from MongoDB unique index
        if(error?.code === 11000){
            return errorResponse(
                "[Invitation POST route] An invitation is already pending for this user",
                400,
                400,
            );
        }
        console.error("[Invitation POST route] Error: ",error);
        return errorResponse(
            "[Invitation POST route] Internal Server Error",
            500,
            500,
        );
    }
}

/**
 * Return all PENDING invitations for a workspace.
 * Only the owner can query this
 */

export async function GET(
    request: NextRequest,
    // { params }: { params: { workspaceId: string }}
){
    /**
     * 1. Auth
     * 2. Find all WorkspaceInvitation where invitedUser === session.user._id && status === "pending"
     * 3. Populate workspaceId (name, description) and invitedBy (username)
     * 4. Return list
     */
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Invitation GET route] Unauthorized",
            401,
            401,
        );

        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get("workspaceId");

        if(!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
            return errorResponse(
                "[Invitation GET route] Invalid workspace id",
                400,
                400,
            );
        }

        const workspace = await WorkSpaceModel.findById(workspaceId).lean();
        if(!workspace) return errorResponse(
            "[Invitation GET route] Workspace not found",
            404,
            404,
        );

        if(workspace.workspace_owner.toString() !== session.user._id){
            return errorResponse(
                "[Invitation GET route] Only the owner can view invitations",
                403,
                403,
            );
        }

        const pendingInvites = await WorkspaceInvitationModel.find({
            workspaceId,
            status: "pending",
            })
            .select("invitedUser role createdAt")
            .lean();

            // Return just the userIds for cheap client-side lookup
            const invitedUserIds = pendingInvites.map((inv) => inv.invitedUser.toString());

            return successResponse("Sent invitations fetched", { invitedUserIds }, 200, 200);
    } catch (error) {
        console.error("[Invitation GET route] Error: ",error);
        return errorResponse(
            "[Invitation GET route] Internal server error",
            500,
            500,
        );
    }
}
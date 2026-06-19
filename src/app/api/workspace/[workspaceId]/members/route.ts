/**
 * RESOURCE: Workspace Membership & Roles
 * -------------------------------------
 * Endpoint: GET /api/workspaces/[workspaceId]/members
 * Role: Retrieves the full list of collaborators (Owner + Members) for a workspace.
 * * Logic Flow:
 * 1. Auth: Validates the requester's session.
 * 2. Security (RBAC): Verifies that the requester is either the Owner or an 
 * authorized Member of the workspace.
 * 3. Data Aggregation: 
 * - Fetches the Owner's profile with a hardcoded 'owner' role.
 * - Performs a batch lookup ($in) for all Member User documents.
 * 4. Transformation: Maps internal DB roles (e.g., 'editor', 'viewer') to the 
 * returned user objects for the UI.
 * 5. Sanitization: Uses .select() to ensure only public profile fields are returned.
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { emitServerEvent } from "@/lib/server-realtime";
import { UserModel, WorkSpaceModel } from "@/model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

/**
 * GET WORKSPACE MEMBERS (GET)
 * ---------------------------
 * Role: Retrieves the full list of collaborators for a specific workspace.
 * * Logic Flow:
 * 1. Security Check: Verifies the requester is a valid member of the workspace.
 * 2. Data Population: Performs a Mongoose '.populate()' on the 'members.userId' field 
 * to fetch public profile data (username, avatarType, avatarUrl, initials).
 * 3. Sanitization: Excludes sensitive fields like 'password' or 'email' from the 
 * returned member profiles.
 * 4. Transformation: Maps the populated data into a clean 'Collaborator' array 
 * suitable for the Sidebar and Presence UI components.
 * * Performance: Uses '.lean()' to reduce overhead for this read-only operation.
 */

export async function GET(
    request: Request,
    { params }: { params: { workspaceId: string }}
) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);

        if(!session?.user._id){
            return errorResponse(
                "Unauthorized",
                401,
                401,
            );
        }

        if(!params.workspaceId || !mongoose.Types.ObjectId.isValid(params.workspaceId)){
            return errorResponse(
                "Invalid workspace id",
                400,
                400,
            );
        }

        const workspace = await WorkSpaceModel.findById(params.workspaceId).lean();

        if(!workspace){
            return errorResponse(
                "Workspace not found",
                400,
                400,
            );
        }

        const userId = session.user._id;
        const isOwner = workspace.workspace_owner.toString() === userId;

        const workspaceMember = workspace.members || [];
        const isMember = workspaceMember.some((member: any) => member.userId.toString() === userId);

        if(!isOwner && !isMember){
            return errorResponse(
                "Forbidden",
                403,
                403,
            );
        }

        // fetch owner
        const owner = await UserModel.findById(workspace.workspace_owner)
        .select("username email avatarType avatarUrl avatarInitials")
        .lean();

        const ownerWithRole = owner
        ? { ...owner, role: "owner"}
        : null;
        // fetch members 
        const memberIds = workspaceMember.map((member: any) => member.userId) || [];

        const users = memberIds.length
        ? await UserModel.find({ _id: { $in: memberIds}})
        .select("username email avatarType avatarUrl avatarInitials")
        .lean()
        : [];

        // attack role to each member
        const members = users.map((user: any) => {
            const role = workspaceMember.find(
                (member: any) => member.userId.toString() === user._id.toString()
            )?.role;

            return {
                _id: user._id,
                userId: user._id,
                username: user.username,
                email: user.email,
                avatarType: user.avatarType,
                avatarUrl: user.avatarUrl,
                avatarInitials: user.avatarInitials,
                role
            }
        });

        const data = {
                owner: ownerWithRole,
                members
            }
        return successResponse(
            "Workspace members fetched successfully",
            data,
            200,
            200
        )
    } catch (error) {
        console.warn("[WorkspaceMembers] Error fetching workspace members: ", error);
        return errorResponse(
            "Internal server error",
            500,
            500,
        );
    }
}

/**
 * ADD WORKSPACE MEMBER (POST)
 * --------------------------
 * Role: Invites a new user to a specific workspace with a defined role.
 * * Logic Flow:
 * 1. RBAC Check: Verifies that the requester is the 'workspace_owner'.
 * 2. Duplicate Prevention: Checks the 'members' array to ensure the user isn't already added.
 * 3. Persistence: Pushes a new member object { userId, role, addedAt } into the Workspace document.
 * 4. Real-time Notification: Fetches the new member's username and notifies the 
 * Socket server to update the 'Collaborators' list for all active users.
 * * Security: Prevents unauthorized users from escalating their own permissions.
 */
export async function POST(
    request:Request,
    { params }: { params: { workspaceId: string}}
) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);

        if(!session?.user._id){
            return errorResponse(
                "Unauthorized",
                401,
                401,
            );
        }
          if(!params.workspaceId || !mongoose.Types.ObjectId.isValid(params.workspaceId)){
            return errorResponse(
                "Invalid workspace id",
                400,
                400,
            );
        }

        const { userId , role = "editor" } = await request.json();
    
        if(!userId){
            return errorResponse(
                "User id is required to add member to workspace",
                400,
                400,
            );
        }

        const workspace = await WorkSpaceModel.findById(params.workspaceId);
      
        if(!workspace){
            return errorResponse(
                "Workspace not found",
                404,
                404,
            );
        }

        // only owner can add members
        if(workspace.workspace_owner.toString() !== session.user._id){
            return errorResponse(
                "Only owner can add the members",
                403,
                403,
            );
        }

        // Prevent duplicates
        const alreadyMember = workspace.members?.some(
            member => member.userId.toString() === userId
        );

        if(alreadyMember){
            return errorResponse(
                "User is already a member of the workspace",
                400,
                400,
            );
        }

        workspace.members?.push({
            userId,
            role,
            addedAt: new Date()
        });

        await workspace.save();
        const workspaceId = workspace._id;

        const addedUser = await UserModel.findById(userId)
        .select("username")
        .lean();
        await fetch(`${process.env.NEXT_PUBLIC_REALTIME_URL}/emit/workspace-members-update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                 workspaceId: workspaceId.toString(),
                 userId,
                 username: addedUser?.username,
                 action: "added" 
                }),
        });

        const payload = {
            workspaceId: workspaceId.toString(),
            userId,
            username: addedUser?.username,
            action: "added" 
        }

        await emitServerEvent('workspace-members-update', payload);

        return successResponse(
            "Member added successfully",
            200,
            200,
        );
    } catch (error) {
        console.error("[AddWorkspaceMember route] Error adding member to workspace: ", error);
        return errorResponse(
            "Internal server error",
            500,
            500,
        );
    }
}


/**
 * REMOVE WORKSPACE MEMBER (DELETE)
 * -------------------------------
 * Role: Revokes a user's access to a specific workspace.
 * * Logic Flow:
 * 1. RBAC Check: Validates that the requester is the 'workspace_owner'.
 * 2. Protection Guard: Explicitly prevents the removal of the owner to ensure 
 * the workspace does not become "orphaned."
 * 3. Array Filtering: Removes the specific userId from the 'members' list.
 * 4. DB Sync: Saves the updated Workspace document.
 * 5. Real-time Kick: Fetches the removed user's details and notifies the 
 * Socket server to trigger an immediate 'workspace-members-update' for all clients.
 * * Security: Uses mongoose '.toString()' comparisons to prevent object-reference mismatches.
 */

export async function DELETE(
    request: Request,
    {params} : { params: { workspaceId: string}}
) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);

        if(!session?.user._id){
            return errorResponse(
                "Unauthorized",
                401,
                401,
            )
        }

        const { userId } = await request.json();
          if(!params.workspaceId || !mongoose.Types.ObjectId.isValid(params.workspaceId)){
            return errorResponse(
                "Invalid workspace id",
                400,
                400,
            );
        }

        if(!userId){
            return errorResponse(
                "User id is required to remove member from workspace",
                400,
                400,
            )
        }

        const workspace = await WorkSpaceModel.findById(params.workspaceId);

        if(!workspace){
            return errorResponse(
                "Workspace not found",
                404,
                404,
            );
        }

        const isSelfRemoval = session.user._id === userId;
        const isOwnerRemoving = workspace.workspace_owner.toString() === session.user._id;

        if(!isOwnerRemoving && !isSelfRemoval){
            return errorResponse(
                "[Members DELETE route] You do not have permission to remove this member",
                403,
                403,
            );
        }

        // Prevent owner from being removed
        if(workspace.workspace_owner.toString() === userId){
            return errorResponse(
                "[Members DELETE route] The Owner cannot be removed",
                400,
                400,
            );
        }

        const isMember = workspace.members?.some(
            member => member.userId.toString() === userId
        );

        if(!isMember){
            return errorResponse(
                 "[Members DELETE route] User is not a member of the workspace",
                 400,
                 400,
            )
        }

        workspace.members = workspace.members!.filter(
            member => member.userId.toString() !== userId
        );

        await workspace.save();

         const workspaceId = workspace._id;
         const removedUser = await UserModel.findById(userId)
         .select("username")
         .lean();

        const payload = { 
                workspaceId: workspaceId.toString(),
                userId,
                username: removedUser?.username,
                action: "removed", 
        }
        await emitServerEvent("workspace-members-update", payload);

        return successResponse(
            "Member removed successfully",
            200,
            200,
        );
    } catch (error) {
        console.error("[RemoveWorkspaceMember route] error: ",error);
        return errorResponse(
            "Internal server error",
            500,
            500,
        );
    }
}
/**
 * @function hasWorkspaceAccess
 * @description Permission guard to verify if a user has the right to view/edit a workspace.
 * Checks both the 'owner' field and the 'members' array for a matching User ID.
 * * @param workspace - The workspace document retrieved from the DB.
 * @param userId - The ID of the currently authenticated user.
 * @returns boolean
 */

import { WorkSpace } from "@/model/workspace.model";

export function hasWorkspaceAccess( workspace: WorkSpace, userId: string){
    // Explicit string conversion handles Mongoose ObjectId vs String comparison issues
    const isOwner = workspace.workspace_owner.toString() === userId;
    const isMember = workspace.members?.some(member => member.userId.toString() === userId);

    return isOwner || isMember;
}
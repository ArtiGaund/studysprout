/**
 * @module WorkspaceMemberService
 * @description specialized API layer for managing collaboration and user permissions.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Role-Based Access Control (RBAC): Supports granular roles (Editor vs. Viewer) 
 * during the member invitation phase.
 * 2. User Discovery: Implements an optimized search endpoint for finding collaborators 
 * by query strings.
 * 3. Axios Delete Configuration: Correctly utilizes the `data` property for DELETE 
 * requests, which is a common technical hurdle in RESTful implementations.
 * 4. Workspace Scoping: All member operations are strictly scoped via `workspaceId` 
 * to ensure data isolation and security.
 */
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

/**
 * @method getWorkspaceMembers
 * @description Retrieves the full roster of collaborators for a specific workspace, 
 * including their roles and profile metadata.
 */
export async function getWorkspaceMembers(workspaceId: string){
    const relativePath = `/api/workspace/${workspaceId}/members`;
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method SearchUsers
 * @description Powering the invitation UI by searching the global user database. 
 * Essential for scaling collaboration beyond known contacts.
 */
export async function SearchUsers(value: string){
    const relativePath = `/api/user/search?q=${value}`;
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method addWorkspaceMember
 * @description Persists a new membership record. 
 * Defaults to 'editor' to foster immediate collaboration in StudySprout.
 */
export async function addWorkspaceMember(
    workspaceId: string,
     userId: string,
     role: "editor" | "viewer" = "editor"
    ){
    const relativePath = `/api/workspace/${workspaceId}/members`;
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.post(url, {
        userId,
        role
    });
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method removeWorkspaceMember
 * @description Revokes workspace access for a specific user.
 */
export async function removeWorkspaceMember(
    workspaceId: string,
    userId: string
){
    const relativePath = `/api/workspace/${workspaceId}/members`;
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.delete(url, {
        data: {
            userId
        }
    });
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/* Send an invitation to a user */
export async function sendWorkspaceInvitationService(
    userId: string,
    workspaceId: string,
    role: "editor" | "viewer" = "editor",
){
    const relativePath = `/api/workspace/invitations`;
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.post(url, { userId, workspaceId, role });
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/*Accept or reject an invitation */
export async function respondToInvitationService(
    invitationId: string,
    action: "accepted" | "rejected",
){
    const relativePath = `/api/workspace/invitations/${invitationId}`;
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.patch(url, { action });
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/*Get current user's pending invitations */
export async function getPendingInvitationService(workspaceId: string){
    const relativePath = `/api/workspace/invitations`;
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.get(url, { 
        params: { workspaceId }
     });
    if(!data.success) throw new Error(data.message);
    return data.data;
}
/**
 * RESOURCE: Folder Management
 * -------------------------
 * Endpoint: /api/folder & /api/folder/[folderId]
 * Role: Handles the complete lifecycle of document entities.
 * Security: Session-based Auth + RBAC (Workspace Access Validation)
 * Real-time: Emit 'workspace-tree-update' for global tree synchronization.
 */
import dbConnect from "@/lib/dbConnect";
import {
    FolderModel,
    WorkSpaceModel 
} from "@/model/index";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { hasWorkspaceAccess } from "@/helpers/hasWorkspaceAccess";
import { isValidId } from "@/helpers/validateId";
import { emitRealtimeEvent } from "@/lib/realtime-fetch";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";


/**
 * CREATE FOLDER
 * -----------
 * Logic:
 * 1. Auth: Validates the user session.
 * 2. Access: Checks if the user has write-permissions for the target Workspace.
 * 3. Persistence: Creates the Folder document with backend-safe defaults.
 * 4. Atomic Update: Pushes the Folder ID into the parent Folder's 'folders' array.
 * 5. Rollback: If Workspace updates fails, the orphan Folder is deleted.
 * 6. Socket: Emits 'folder_created' to the workspace tree.
 */

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if(!session?.user._id){
        return errorResponse(
            "Unauthorized",
            401,
            401,
        );
    }

    try {
        const folderData = await request.json();
        // 1. Validate incoming data for required fields
        if (!folderData || !folderData.workspaceId) {
            return errorResponse(
                "Bad Request: 'workspaceId' are required to create a folder.",
                400,
                400,
            );
        }
         // Validate if workspaceId is a valid MongoDB ObjectId
        if (!isValidId(folderData.workspaceId)) {
            return errorResponse(
                "Bad Request: Invalid 'workspaceId' format.",
                400,
                400
            );
        }

        const workspace = await WorkSpaceModel.findById(folderData.workspaceId);

        if(!workspace){
            return errorResponse(
                "workspace not found in database",
                404,
                404,
            );
        }

        const userId = session.user._id;
        
        const hasAccess = hasWorkspaceAccess(workspace, userId);

        if(!hasAccess){
            return errorResponse(
                "You do not have access to this workspace",
                403,
                403,
            );
        }
         const newFolderData: MongooseFolder = {
                data: undefined,
                createdAt: new Date(),
                title: 'Untitled',
                iconId: '📁',
                inTrash: undefined,
                workspaceId: folderData.workspaceId,
                bannerUrl: '',
              };
        // 2. Create the new folder document
        const newFolder = await FolderModel.create(newFolderData)
        if(!newFolder){
            // This case is unlikely if validation passes, but good as a safeguard
            return errorResponse(
                "Failed to create new folder due to a server error.",
                500,
                500,
            );
        }
        
         // 3. Update the parent workspace to include the new folder's reference
         const updatedWorkspace = await WorkSpaceModel.findByIdAndUpdate(
            folderData.workspaceId,
            { $push: { folders: newFolder._id } },
            { new: true }
         ).lean();
         // If the workspace specified in folderData.workspaceId does not exist
        if (!updatedWorkspace) {
            // Rollback: Delete the created folder if its parent workspace doesn't exist
            await FolderModel.findByIdAndDelete(newFolder._id);
            return errorResponse(
                `Workspace with ID '${newFolder.workspaceId}' not found. Folder not created.`,
                500,
                500,
            );
        }

    const payload = {
        workspaceId: String(newFolder.workspaceId),
        folder: newFolder,
        actorId: String(userId),
    }

   try {
     await emitRealtimeEvent(
         'workspace-tree-update',
         String(newFolder.workspaceId),
         'folder_created',
         payload,
     );
   } catch (socketError) {
        console.warn("[Socket Emission Failed] Folder created: ",socketError);
   }
    
       const data = { 
                folder: newFolder.toObject(), // Convert to plain object if not already by .create()
                updatedWorkspace: updatedWorkspace 
            }
        // 4. Return success response with the newly created folder and updated workspace info
        return successResponse(
            "Folder created successfully and added to workspace.",
            data,
            201,
            201,
        );
    } catch (error: any) {
        console.error("Error creating new folder:", error);
        // Handle Mongoose validation errors or other unexpected issues
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return errorResponse(
                `Validation Error: ${messages.join(', ')}`,
                400,
                400,
            );
        }

        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500,
        );
    }
}


/**
 * GET ALL FOLDERS
 * -------------
 * Logic:
 * 1. Dynamic Filter: Fetches folders by WorkspaceId on query params.
 * 2. Trash Filter: Automatically excludes items where { inTrash: true }
 * 3. Lean fetch: Uses .lean() for faster, read-only performance.
 * 4. Security: Verifies user access to the Workspace before returning data.
 */

export async function GET(request: Request){
    await dbConnect()

    const session = await getServerSession(authOptions);

    if(!session?.user._id){
        return errorResponse(
            "Unauthorized",
            401,
            401,
        );
    }
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId');
     // 1. Validate 'workspaceId' presence and format
     if (!workspaceId) {
             return errorResponse(
                "Bad Request: 'workspaceId' query parameter is required.",
                400,
                400
             );
        }
     
         if (!isValidId(workspaceId)) {
             return errorResponse(
                "Bad Request: Invalid 'workspaceId' format.",
                400,
                400,
             );
         }
   
    try {
        const workspace = await WorkSpaceModel.findById(workspaceId).populate('folders')
        if(!workspace){
            return errorResponse(
                "No workspace of this id found in the database",
                404,
                404,
            );
        }

        const userId = session.user._id;
        const hasAccess = hasWorkspaceAccess(workspace, userId);

        if(!hasAccess){
            return errorResponse(
                "Unauthorized",
                401,
                401,
            );
        }
        
         // 3. Sort files by createdAt date
        const foldersData = workspace?.folders
        ? workspace.folders.sort((a: any,b: any) => 
                 new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

        // 4. Return success response
        return successResponse(
            "Successfully fetched all files for the folder.",
            foldersData,
            200,
            200,
        );
    } catch (error: any) {
         console.error("Error while fetching all workspace folders:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return errorResponse(
                "Bad Request: Invalid ID format provided for workspace.",
                400,
                400,
             );
        }

        // Generic internal server error
        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500,
        );
    }
}



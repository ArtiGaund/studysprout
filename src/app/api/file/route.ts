/**
 * RESOURCE: File Management
 * -------------------------
 * Endpoint: /api/file & /api/file/[fileId]
 * Role: Handles the complete lifecycle of document entities.
 * Security: Session-based Auth + RBAC (Workspace Access Validation)
 * Real-time: Emit 'workspace-tree-update' for global tree synchronization.
 */
import dbConnect from "@/lib/dbConnect";
import {
    FileModel,
    FolderModel, 
    WorkSpaceModel
} from "@/model/index";
import { 
    IBlock, 
    File as MongooseFile 
} from "@/model/file.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { hasWorkspaceAccess } from "@/helpers/hasWorkspaceAccess";
import { isValidId } from "@/helpers/validateId";
import { emitRealtimeEvent } from "@/lib/realtime-fetch";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { onFileCreated } from "@/lib/activity-hooks";

/**
 * CREATE FILE
 * -----------
 * Logic:
 * 1. Auth: Validates the user session.
 * 2. Access: Checks if the user has write-permissions for the target Workspace.
 * 3. Persistence: Creates the File document with backend-safe defaults.
 * 4. Atomic Update: Pushes the File ID into the parent Folder's 'files' array.
 * 5. Rollback: If Folder updates fails, the orphan File is deleted.
 * 6. Socket: Emits 'file_created' to the workspace tree.
 */

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if(!session?.user._id){
        return errorResponse(
            "Unauthorized to create a file",
            401,
            401
        );
    }


    const userId = session.user._id;
    try {
        const fileData = await request.json();
         if(!fileData || !fileData.folderId || !fileData.workspaceId){
            return errorResponse(
                "Bad Request: 'folderId' and 'workspaceID' are required to create a file.",
                400,
                400
            );
        }
         // check if the provided folderId is a valid mongodb objectId
        if(!isValidId(fileData.folderId)){
            return errorResponse(
                "Bad Request: 'folderId' is not a valid ObjectId.",
                400,
                400,
            );
        }

        const workspace = await WorkSpaceModel.findById(fileData.workspaceId).lean();
        if(!workspace){
            return errorResponse(
                "Workspace not found in database",
                404,
                404
            );
        }

        const userId = session.user._id;

        const hasAccess = hasWorkspaceAccess(workspace, userId);

        if(!hasAccess){
            return errorResponse(
                "Unauthorized to access the workspace",
                401,
                401
            )
        }
    
        // creating a new file
        const newFileData: MongooseFile = {
            title: fileData.title || "Untitled",
            folderId: fileData.folderId,
            workspaceId: fileData.workspaceId,
           
            blocks: new Map<string,IBlock>,
            blockOrder: [],
            // safe backend defaults
            iconId: "📄",
            bannerUrl: "",
            inTrash: undefined,
            createdAt: new Date(),
            lastUpdated: new Date(),
            contentBinary: null,
            contentLastModified: new Date(),
        }
        const newFile = await FileModel.create(newFileData);
        
        if(!newFile){
            return errorResponse(
                "Failed to create new file, please try again later.",
                500,
                500,
            );
        }
        
        //    update the parent folder to include the new file's reference 
        const updatedFolder = await FolderModel.findByIdAndUpdate(
            fileData.folderId,
            { 
                $push: {
                    files: newFile._id,
                }
            },
            { new: true }
        ).lean(); 

        // If the folder specified in fileData.folderId does not exist
        if(!updatedFolder){
            // Rollback: Delete the created file if its parent folder does'nt exist
            await FileModel.findByIdAndDelete(newFile._id)
            return errorResponse(
                `Folder with ID '${fileData.folderId}' not found. File not created.`,
                404,
                404,
            )
        }
        const payload = {
            workspaceId: String(newFile.workspaceId),
            folderId: String(newFile.folderId),
            file: newFile,
            actorId: String(userId),
        }
       try {
         await emitRealtimeEvent(
             'workspace-tree-update',
             String(newFile.workspaceId),
             'file_created',
             payload
         );
       } catch (socketError) {
        console.error("[Socket Emission Failed] File Create: ",socketError);
       }

        onFileCreated(
            String(newFile.workspaceId),
            String(newFile.folderId),
            String(newFile._id),
            String(userId),
            newFile.title || "Untitled"
        );
        
        const data = {
            file: newFile.toObject()
        }

        return successResponse(
            "File created successfully and added to folder.",
            data,
            201,
            201
        );
      
    } catch (error: any) {
         console.error("Error creating new file:", error);
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
            500
        );
    }
}

/**
 * GET ALL FILES
 * -------------
 * Logic:
 * 1. Dynamic Filter: Fetches files by WorkspaceId Or FolderId based on query params.
 * 2. Trash Filter: Automatically excludes items where { inTrash: true }
 * 3. Lean fetch: Uses .lean() for faster, read-only performance.
 * 4. Security: Verifies user access to the Workspace before returning data.
 */

export async function GET(request: Request){
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);

    if(!session?.user._id){
        return errorResponse(
            "Unauthorized to get all files",
            401,
            401,
        )
    }
    
    const workspaceId = searchParams.get("workspaceId");
    const folderId = searchParams.get("folderId");

    if(!workspaceId && !folderId){
        return errorResponse(
            "WorkspaceId or FolderId is required",
            400,
            400
        );
    }

    if(workspaceId && !isValidId(workspaceId)){
        return errorResponse(
            "Invalid workspaceId",
            400,
            400
        );
    }

    if(folderId && !isValidId(folderId)){
        return errorResponse(
            "Invalid folderId",
            400,
            400
        );
    }
   
    try {
       
        const filter: any = {
            inTrash: { $ne: true }  //ignore trashed files
        };

        if(workspaceId){
            filter.workspaceId = workspaceId;
        }

        if(folderId){
            filter.folderId = folderId;
        }

        const files = await FileModel.find(filter)
        .sort({ createdAt: 1 })
        .lean();


        if(workspaceId){
            const workspace = await WorkSpaceModel.findById(workspaceId).lean();

            if(!workspace){
                return errorResponse(
                    "Workspace not found",
                    404,
                    404,
                );
            }
            const hasAccess = hasWorkspaceAccess(workspace, session.user._id);

            if(!hasAccess){
                return errorResponse(
                    "Unauthorized",
                    401,
                    401,
                );
            }
        }
        return successResponse(
            "Successfully fetched all files",
            files,
            200,
            200
        );
    } catch (error: any) {
         console.error("Error while fetching all folder files:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return errorResponse(
                "Bad Request: Invalid ID format provided for folder.",
                400,
                400,
             );
        }

        // Generic internal server error
        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500
        );
    }
}


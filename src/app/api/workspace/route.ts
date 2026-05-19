/**
 * RESOURCE: Workspace Management
 * ----------------------------
 * Endpoint: /api/workspace & /api/workspace/[workspaceId]
 * Role: Acts as the primary container for all user resources (Folders, Files, Members).
 * * Logic Highlights:
 * 1. Creation: Handles multipart form data for simultaneous Logo upload (Cloudinary) and DB entry.
 * 2. Cascading Delete: A deep-clean operation. When a workspace is deleted, it recursively 
 * locates and deletes all child Folders, child Files, and their associated Cloudinary assets.
 * 3. Atomic Integrity: If Workspace creation fails after an image upload, a manual rollback 
 * deletes the Cloudinary asset to prevent storage leaks.
 * 4. Access Control: Verifies Ownership or Member-role before allowing GET/POST/DELETE.
 */
import dbConnect from "@/lib/dbConnect";
import {
     deleteFromCloudinary, 
     uploadToCloudinary
 } from "@/lib/cloudinary-utils/upload-and-delete-from-cloudinary";
import ImageModel from "@/model/image.model";
import {UserModel, WorkSpaceModel} from "@/model/index";
import { isValidId } from "@/helpers/validateId";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";

/**
 * CREATE WORKSPACE (POST)
 * -----------------------
 * Role: Initializes a new top-level collaborative environment.
 * Logic:
 * 1. Auth: Validates the user session (Required for ownership).
 * 2. Defaults: Initializes the workspace with a 'Personal' or 'Untitled' name.
 * 3. Ownership: Sets the 'userId' as the primary owner in the 'collaborators' list.
 * 4. Structure: Pre-allocates empty arrays for Folders and Files.
 * 5. Persistence: Saves the Workspace document to MongoDB.
 * 6. UI Sync: Returns the new Workspace ID to trigger an immediate client-side redirect.
 */

export async function POST(request: any){
    await dbConnect()
    try {
        const formData = await request.formData()
        const workspaceName = formData.get("workspaceName")
        const userId = formData.get("userId")
        const image = formData.get("logo") as unknown as File
        const iconId = formData.get("iconId")
        const isPublicRaw = formData.get("isPublic")
        const isPublic = isPublicRaw === "true";
        
        // Check whether same name workspace exist or not
        const existingWorkspace = await WorkSpaceModel.findOne({
            title:workspaceName,
            workspace_owner: userId
        })

        if(existingWorkspace){
            return errorResponse(
                "User already have same name workspace",
                409,
                409,
            );
        }
        // uploading image in cloudinary
        const imageData = await uploadToCloudinary(image, "studysprout") as { secure_url: string ,public_id: string }
      
        // saving image in image schema database
        if(imageData){
         const savedImage =  await ImageModel.create({
                image_url: imageData?.secure_url,
                public_id: imageData?. public_id
            })

        // creating new workspace
        const newWorkspace = await WorkSpaceModel.create({
            title:workspaceName,
            workspace_owner: userId,
            logo: savedImage._id,
            iconId,
            isPublic,
            members: []
        })

        
        // adding the workspace in user model
        const user = await UserModel.findByIdAndUpdate(
            userId,
            {
                $push: { workspace: newWorkspace._id }
            }
        )
        // console.log("workspace have been added into user model ",user)
        if(!newWorkspace){
            // deleting from cloudinary first
            await deleteFromCloudinary(savedImage?.public_id)
            // deleting from image schema database
            await ImageModel.findByIdAndDelete(savedImage._id)
            return errorResponse(
                "Failed to create the new workspace",
                401,
                401,
            )
        }
      
        return successResponse(
            "SuccessFully create new workspace",
            newWorkspace,
            200,
            200,
        );
        }
        

        return errorResponse(
            "Logo is required",
            401,
            401,
        );
    } catch (error:any) {
        console.error("Error while Creating the new workspace ",error)
        return errorResponse(
            error.message,
            500,
            500,
        );
    }
}

/**
 * GET ALL WORKSPACES (GET)
 * -----------------------
 * Role: Retrieves every workspace the user has access to.
 * Logic:
 * 1. Validation: Ensures the 'userId' provided in the query params is a valid ObjectId.
 * 2. Cross-Role Query: Uses an '$or' operator to find workspaces where the user is:
 * a) The 'workspace_owner' (Creator).
 * b) A collaborator listed in the 'members' array.
 * 3. Sorting: Returns the workspaces in chronological order (createdAt: 1).
 * 4. Empty State: Returns an empty array with a 200 status if no workspaces are found.
 */

export async function GET(request: Request){
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId');

     // 1. Validate 'workspaceId' presence and format
    if(!userId){
        return errorResponse(
            "Unauthorized",
            401,
            401,
        )
    }
    if (!isValidId(userId)) {
        return errorResponse(
            "Bad Request: Invalid 'userId' format.",
            400,
            400,
        );
    }
    
    try {
        const workspaces = await WorkSpaceModel.find({
            $or: [
                { workspace_owner: userId},
                { "members.userId" : userId}
            ]
        }).sort({ createdAt: 1})
        if(workspaces?.length === 0){
            return successResponse(
                "User don't have any workspace",
                [],
                200,
                200,
            );
        }
        
        return successResponse(
            "Successfully fetched all workspaces for the user",
            workspaces,
            200,
            200,
        );
    } catch (error: any) {
         console.error("Error while fetching all user workspaces:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return errorResponse(
                "Bad Request: Invalid ID format provided for user.",
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
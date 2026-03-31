/**
 * GET WORKSPACE API
 * -----------------
 * Role: Retrieves all workspaces associated with a specific user.
 * Logic: Perform a "Member or Owner" check to ensure full accessibility.
 */
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import{ WorkSpaceModel} from "@/model/index";

export async function GET( request: Request ){
    await dbConnect()

    // 1. Extract User Identity from Query Parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if(!userId){
        return errorResponse(
            "User Id is required",
            400,
            400,
        );
    }
    try {
        /**
         * 2. Perform Complex Query
         * Finds workspaces where the user is either:
         * A) The primary owner (workspace_owner)
         * B) A member of the collaboration team (members.userId)
         */
        const workspaces = await WorkSpaceModel.find({ 
            $or: [
                { workspace_owner: userId },
                { "members.userId": userId },
            ]
         }).lean();
        
        // 3. Return success with lean data for frontend performance
        return successResponse(
            "Workspaces retrieved successfully",
            workspaces,
            200,
            200
        )
        
    } catch (error) {
        console.error("Error while finding the workspace under the current user ",error)
        return errorResponse(
            "Internal Server error while finding the workspace under the current user",
            500,
            500,
        );
    }
}

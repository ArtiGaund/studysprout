import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { InboxItemModel } from "@/model";

export async function GET(){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session?.user._id){
            return errorResponse(
                "[Inbox Count GET route] Unauthorized to fetch inbox count",
                401,
                401,
            );
        }
        const count = await InboxItemModel.countDocuments({ userId: session.user._id });

        return successResponse(
            "[Inbox Count GET route] Inbox count fetched successfully",
            { count },
            200,
            200,
        );
    } catch (error: any) {
        console.warn(error.message ?? "[Inbox Count GET route] Failed to fetch inbox count");
        return errorResponse(
            error.message ?? "[Inbox Count GET route] Failed to fetch inbox count",
            500,
            500,
        );
    }
}
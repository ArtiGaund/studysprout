import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { getWorkspaceUsage } from "@/lib/flashcard/flashcard-usage";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";


export async function GET(
    _req: NextRequest,
    { params }: { params: { workspaceId: string }}
){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Workspace Usage GET route] Unauthorized",
            401,
            401,
        );

        const usage = await getWorkspaceUsage(params.workspaceId);
        return successResponse(
            "[Workspace Usage GET route] Usage fetched",
            usage,
            200,
            200,
        );
    } catch (error) {
        console.error("[Workspace Usage GET route] Failed: ",error);
        return errorResponse(
            "[Workspace Usage GET route] Internal server error",
            500,
            500,
        );
    }
}
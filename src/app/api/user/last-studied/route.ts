import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { UserModel } from "@/model";

export async function PATCH(request: NextRequest){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user) return errorResponse(
            "[Last Studied PATCH route] Unauthorized",
            401,
            401,
        );

        const body = await request.json();
        console.log("[Users Last Studied PATCH route] body: ",body);
        const { 
            setId,
            setTitle,
            cardIndex,
            totalCards,
            resourceType,
            workspaceId,
            folderId,
        } = body;

       const user =  await UserModel.findByIdAndUpdate(session.user._id, {
            lastStudied: {
                setId,
                setTitle,
                cardIndex,
                totalCards,
                resourceType,
                workspaceId,
                folderId: folderId ?? null,
                studiedAt: new Date(),
            }
        });
    
        console.log("[Users Last Studied PATCH route] user: ",user);

        return successResponse(
            "[Last Studied PATCH route] Successfully updated last studied",
            {},
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Last Studied PATCH route] Failed to update last studied: ",error.message);
        return errorResponse(
            error.message ?? "[Last Studied PATCH route] Internal Server Error",
            500,
            500,
        );
    }
}

export async function GET(request: NextRequest){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user) return errorResponse(
            "[Last Studied GET route] Unauthorized",
            401,
            401,
        );

        const user = await UserModel.findById(session.user._id)
            .select("lastStudied")
            .lean();

        return successResponse(
            "[Last Studied GET route] Last Studied Fetched",
            {
                lastStudied: user?.lastStudied ?? null,
            },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Last Studied GET route] Failed to fetch Last studied: ",error.message);
        return errorResponse(
            error.message ?? "[Last Studied GET route] Internal Server Error",
            500,
            500,
        );
    }
}
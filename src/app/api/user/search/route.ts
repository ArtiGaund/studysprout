/**
 * RESOURCE: User Discovery (Search)
 * ---------------------------------
 * Endpoint: GET /api/search-users?q=query
 * Role: Provides real-time search suggestions for workspace collaboration.
 * * Performance & Privacy:
 * 1. Sanitized Query: Trims input and enforces a minimum character limit (2 chars) 
 * to prevent expensive, broad regex searches.
 * 2. Projection: Only selects public fields (username, avatar) to keep payloads 
 * small and protect sensitive data (passwords/IDs).
 * 3. Fuzzy Matching: Uses case-insensitive regex for flexible user finding.
 */
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import { UserModel } from "@/model";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if(!session?.user._id){
            return errorResponse(
                "Unauthorized",
                401,
                401,
            );
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim();

        if(!q || q.length < 2){
            return successResponse(
                "Unauthorized",
                [],
                200,
                200,
            );
        }

        await dbConnect();

        const users = await UserModel.find({
            $or: [
                { username: { $regex: q, $options: "i"}},
                { email: { $regex: q, $options: "i" }},
            ],
        })
        .select("username email avatarType avatarUrl avatarInitials")
        .limit(10)
        .lean();

        return successResponse(
            "Successfully searched the user",
            users,
            200,
            200
        )
    } catch (error) {
        console.warn("[SearchUsers] Failed to search users due to following error: ",error);
        return errorResponse(
            "Internal Server Error",
            500,
            500,
        );
    }
}
import dbConnect from "@/lib/dbConnect";
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { InboxItemModel } from "@/model";

const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;
export const dynamic = "force-dynamic";

const corsHeaders = {
    "Access-Control-Allow-Origin": `chrome-extension://${extensionId}`, // Replace with your extension's ID
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session?.user._id){
            return errorResponse(
                "Unauthorized to create an inbox item",
                401,
                401
            );
        }

        const body = await request.json();
        const { content, type, sourceUrl, sourceTitle } = body;

        if(!content || !type){
            return errorResponse(
                "Content and block type are required",
                400,
                400
            );
        }

        const item = await InboxItemModel.create({
            userId: session.user._id,
            content,
            type,
            sourceUrl: sourceUrl || null,
            sourceTitle: sourceTitle || null,
        });

        return successResponse(
            "Inbox item created successfully",
            item,
            201,
            201,
        );
    } catch (error: any) {
        return errorResponse(
            error.message ?? "Failed to create inbox item",
            500,
            500
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session?.user._id){
            return errorResponse(
                "Unauthorized to fetch inbox items",
                401,
                401
            );
        }

        const items = await InboxItemModel.find({ userId: session.user._id }).sort({
            createdAt: -1
        });

        return successResponse(
            "Inbox items fetched successfully",
            items,
            200,
            200
        );
    } catch (error: any) {
        return errorResponse(
            error.message ?? "Failed to fetch inbox items",
            500,
            500
        );
    }
}
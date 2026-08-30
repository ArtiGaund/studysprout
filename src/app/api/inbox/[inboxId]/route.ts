import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { isValidId } from "@/helpers/validateId";
import { InboxItemModel } from "@/model";

export const dynamic = "force-dynamic";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { inboxId: string } }
){
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if(!session?.user._id){
            return errorResponse(
                "Unauthorized to delete an inbox item",
                401,
                401
            );
        }

        const { inboxId } = params;
        if(!inboxId){
            return errorResponse(
                "Inbox ID is required to delete an inbox item",
                400,
                400 
            );
        }

        if(!isValidId(inboxId)){
            return errorResponse(
                "Invalid inbox ID",
                400,
                400
            );
        }

        const deletedItem = await InboxItemModel.findOneAndDelete({
            _id: inboxId,
            userId: session.user._id,
        });

        if(!deletedItem){
            return errorResponse(
                "Inbox item not found or you do not have permission to delete it",
                404,
                404
            );
        }

        return successResponse(
            "Inbox item deleted successfully",
            deletedItem,
            200,
            200
        );
    } catch (error: any) {
        return errorResponse(
            error.message ?? "Failed to delete inbox item",
            500,
            500
        );
    }
}
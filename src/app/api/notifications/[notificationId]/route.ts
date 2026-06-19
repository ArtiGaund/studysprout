import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { NotificationModel } from "@/model";
import mongoose from "mongoose";

// id: "mark-all" -> bulk read, else single notification id
export async function PATCH(
    request: NextRequest,
    { params }: { params: { notificationId: string }}
){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[NotificationId PATCH route] Unauthorized",
            401,
            401,
        );

        const userId = session.user._id;
        const { notificationId } = params;
        if(notificationId === "mark-all"){
            await NotificationModel.updateMany(
                {recipientId: userId, read: false },
                { $set: { read: true }},
            );
            return successResponse(
                "[NotificationId PATCH route] All notification marked as read",
                {},
                200,
                200,
            );
        }

        if(!mongoose.Types.ObjectId.isValid(notificationId)){
            return errorResponse(
                "[NotificationId PATCH route] Invalid notificationId",
                400,
                400,
            );
        }
        const notification = await NotificationModel.findOne({
            _id: notificationId,
            recipientId: userId,
        });
 
        if(!notification) return errorResponse(
            "[NotificationId PATCH route] Notification not found",
            404,
            404,
        );

        notification.read = true;
        await notification.save();

        return successResponse(
            "[NotificationId PATCH route] Notification marked as read",
            { _id: notificationId },
            200,
            200,
        );
    } catch (error) {
        console.error("[NotificationId PATCH route] Error: ",error);
        return errorResponse(
            "[NotificationId PATCH route] Internal Server error",
            500,
            500,
        );
    }
}
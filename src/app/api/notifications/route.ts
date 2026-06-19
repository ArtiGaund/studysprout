import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { NotificationModel } from "@/model";

// Fetch all notifications for current user
export async function GET(){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Notification GET route] Unauthorized",
            401,
            401,
        );

        const userId = session.user._id;

        // Invitaion: always fetch ALL pending (regardless of read status)
        // Activity (accepted / rejected): fetch all unread + last 10 read
        const [ invitations, unread, recentRead] = await Promise.all([
            // 1. Pending invitations directed at this user
            NotificationModel.find({
                recipientId: userId,
                type: "invitation_received",
                read: false,
            })
                .sort({ createdAt: -1 })
                .lean(),
            // 2. unread activity
            NotificationModel.find({
                recipientId: userId,
                type: { $in: [ "invitation_accepted", "invitation_rejected" ]},
                read: false,
            })
                .sort({ createdAt: -1 })
                .lean(),
            // 3. last 10 read activity notifications
            NotificationModel.find({
                recipientId: userId,
                type: { $in: [ "invitations_accepted", "invitation_rejected" ]},
                read: true,
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);

        return successResponse(
            "[Notification GET route] Notifications fetched",
            { invitations, unread, recentRead },
            200,
            200,
        );
    } catch (error) {
        console.error("[Notification GET route] Error: ",error);
        return errorResponse(
            "[Notification GET route] Internal Server Error",
            500,
            500,
        );
    }
}
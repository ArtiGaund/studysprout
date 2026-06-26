import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { sendFeedbackEmail } from '@/lib/sendFeedbackEmail';
import { FeedbackModel } from "@/model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function POST(request:Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Feedback POST route] Unauthorized",
            401,
            401,
        );
        
        const { userEmail, feedbacks } = await request.json();
        if(!userEmail || !feedbacks.length) return errorResponse(
            "[Feedback POST route] Email and atleast one feedback entry are required",
                400,
                400,
            );
        
        // 1. Store all feedback types
        const feedbackDocs = feedbacks.map((entry: { type: string; message: string }) => ({
            userId: session.user._id,
            userEmail: userEmail,
            type: entry.type,
            message: entry.message,
        }));
        
        await FeedbackModel.insertMany(feedbackDocs);
        
        const sendFeedback = await sendFeedbackEmail(userEmail, feedbacks);
        if(!sendFeedback.success){
            console.warn("[Feedback POST route] DB saved but email failed: ",sendFeedback.message);
        }

        return successResponse(
            "[Feedback POST route] Feedback submitted successfully",
            {},
            200,
            200,
        );
    } catch (error) {
        console.error("Error sending feedback:", error);
        return errorResponse(
            "[Feedback POST route] Failed to submit feedback",
            500,
            500,
        );
    }
}
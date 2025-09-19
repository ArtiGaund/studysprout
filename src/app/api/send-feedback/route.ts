import dbConnect from "@/lib/dbConnect";
import { sendFeedbackEmail } from '@/lib/sendFeedbackEmail';

export async function POST(request:Request) {
    await dbConnect();
    const { userEmail, feedbacks } = await request.json();

    try {
        const sendFeedback = await sendFeedbackEmail(userEmail, feedbacks);
        console.log("Feedback sent route: ", sendFeedback);
        if(!sendFeedback.success){
            return Response.json({
                statusCode: 400,
                message: "Error sending feedback",
                success: false
            })
        }

        return Response.json({ 
            statusCode: 200,
            message: "Successfully sent feedback",
            success: true
         });
    } catch (error) {
        console.error("Error sending feedback:", error);
        return Response.json({
            statusCode: 500,
            message: "Error sending feedback",
            success: false
        })
    }
}
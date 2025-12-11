import config from "@/config/config";
import { ApiResponse } from "@/types/api.interface";
import nodemailer from "nodemailer";

type FeebackEntry = {
    type: string;
    message: string;
}

export async function sendFeedbackEmail(
    email: string,
    feedbacks: FeebackEntry[]
):Promise<ApiResponse<any>>{
    const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        auth: {
          user: config.BREVO_SMTP_USER,
          pass: config.BREVO_SMTP_PASS,
        }
    });

    const feedbackHtml = feedbacks
    .map((entry) => 
        `<p><strong>${entry.type}:</strong></p>
    <p>${entry.message}</p><hr/>`
    )
    .join("");
    const mailOptions = {
    from: `"Studysprout Feedback" <${config.OWNER_EMAIL}>`,
    to: config.OWNER_EMAIL,
    subject: "User Feedback",
    html: `<p><strong>From user:</strong> ${email}</p>${feedbackHtml}`,
    replyTo: email
};

    try {
        const mail = await transporter.sendMail(mailOptions);
        if(!mail){
            return {
                statusCode: 500,
                message: "Failed to send the feedback email",
                success: false
            };
        }
        return {
            statusCode: 200,
            message: "Feedback email sent successfully",
            success: true,
            data: "",
        };
    } catch (error) {
        console.error("Error sending feedback email: ",error);
        return {
             statusCode: 500,
            message: "Failed to send the feedback email",
            success: false
        };
    }
    }

import { resend } from "@/lib/resend";
import VerificationEmail from "../../emails/VertificationEmail";
import { ApiError, ApiResponse } from "@/types/api.interface";

// sending verification email
export async function sendVerificationEmail(
    email: string,
    username: string,
    verifycode: string
): Promise<ApiResponse >{
    try {
        const data = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: email,
            subject: 'StudySprout message | Verification code',
            react: VerificationEmail({ username, otp: verifycode}),
        });

        return {
            statusCode: 200,
            message: "Verification email sent successfully",
            success: true,
        }
    } catch (emailError) {
        console.error("Error in sending verification email ",emailError)
        return{
            statusCode: 500,
            message: "Failed to send the verification email",
            success: false
        }
    }
}
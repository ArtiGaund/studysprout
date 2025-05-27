// import { resend } from "@/lib/resend";
// import VerificationEmail from "../../emails/VertificationEmail";
// import { ApiError, ApiResponse } from "@/types/api.interface";

// // sending verification email
// export async function sendVerificationEmail(
//     email: string,
//     username: string,
//     verifycode: string
// ): Promise<ApiResponse >{
//     try {
//         console.log("email in send verification email ",email);
//         const data = await resend.emails.send({
//             from: 'Acme <onboarding@resend.dev>',
//             to: email,
//             subject: 'StudySprout message | Verification code',
//             react: VerificationEmail({ username, otp: verifycode}),
//         });

//         return {
//             statusCode: 200,
//             message: "Verification email sent successfully",
//             success: true,
//         }
//     } catch (emailError) {
//         console.error("Error in sending verification email ",emailError)
//         return{
//             statusCode: 500,
//             message: "Failed to send the verification email",
//             success: false
//         }
//     }
// }

import { ApiError, ApiResponse } from "@/types/api.interface";
import nodemailer from "nodemailer";
export async function sendVerificationEmail(
    email: string,
    username: string,
    verifycode: string
): Promise<ApiResponse >{
     const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });
    const mailOptions = {
    from: '"StudySprout" <artigaund2210@gmail.com>',
    to: email,
    subject: "StudySprout Verification Code",
    html: `<p>Hello <strong>${username}</strong>,</p>
           <p>Your verification code is: <strong>${verifycode}</strong></p>
           <p>This code will expire in 10 minutes.</p>`,
  };


    try {
        await transporter.sendMail(mailOptions);
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



import config from "@/config/config";
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
      user: config.BREVO_SMTP_USER,
      pass: config.BREVO_SMTP_PASS,
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

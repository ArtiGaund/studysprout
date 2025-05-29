

import { ApiError, ApiResponse } from "@/types/api.interface";
import nodemailer from "nodemailer";
export async function sendResetEmail(
    username: string,
    email: string,
    link: string
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
    subject: "Reset your password",
    html: `<p>Hello <strong>${username}</strong>,</p>
           <p>Click <a href="${link}">here</a> to reset your password. This link is valid for 15 minutes.</p>`
  };


    try {
        await transporter.sendMail(mailOptions);
        return {
            statusCode: 200,
            message: "Reset email sent successfully",
            success: true,
        }
    } catch (resetError) {
         console.error("Error in sending reset email ",resetError)
        return{
            statusCode: 500,
            message: "Failed to send the reset email",
            success: false
        }
    }
}

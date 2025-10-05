import dbConnect from "@/lib/dbConnect";
import PasswordResetTokenModel from "@/model/password-reset-token.model";
import {UserModel} from "@/model/index";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendResetEmail } from "@/lib/sendResetEmail";
import config from "@/config/config";


export async function POST( request: Request ){
    await dbConnect();
    const { email } = await request.json();

    try {
        const user = await UserModel.findOne({ email });
        if(!user){
           return Response.json({
                statusCode: 405,
                 message: "User does not exist. Please sign up",
                success: false
            })
        }

        // Remove existing token
        await PasswordResetTokenModel.deleteMany({ userId: user?._id});

       // Generate new token
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = await bcrypt.hash(rawToken, 12);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 mins

        await PasswordResetTokenModel.create({
            userId: user._id,
            tokenHash,
            expiresAt,
        });
        

        // / Send email with reset link
         const resetLink = `${config.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}&id=${user._id}`;

         const resetEmail = await sendResetEmail(user.username, user.email, resetLink);

        if(!resetEmail.success){
            return Response.json({
                statusCode: 500,
                message: "Failed to send password reset email",
                success: false
            })
        }

        return Response.json({
            statusCode: 200,
            message: "Password reset email sent",
            success: true
        })
    } catch (error) {
        console.log("Error while sending password reset email ",error);
        return Response.json({
            statusCode: 500,
            message: "Failed to send password reset email",
            success: false
        })
    }
}


/**
 * RESOURCE: Password Recovery System
 * ----------------------------------
 * Role: Provides a secure flow for forgotten passwords.
 * * Security Strategy:
 * 1. Token Isolation: Generates a raw 'one-time' token for the email link, but stores 
 * only the 'bcrypt hash' in the database (protects against DB leaks).
 * 2. TTL (Time-To-Live): Tokens automatically expire after 15 minutes.
 * 3. Single Use: Previous tokens for the same user are purged whenever a new 
 * request is made, preventing "replay" attacks.
 */
import dbConnect from "@/lib/dbConnect";
import PasswordResetTokenModel from "@/model/password-reset-token.model";
import {UserModel} from "@/model/index";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendResetEmail } from "@/lib/sendResetEmail";
import config from "@/config/config";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";


export async function POST( request: Request ){
    await dbConnect();
    const { email } = await request.json();

    try {
        const user = await UserModel.findOne({ email });
        if(!user){
           return errorResponse(
            "User does not exist. Please sign up",
            405,
            405,
           );
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
            return errorResponse(
                "Failed to send password reset email",
                500,
                500,
            );
        }

        return successResponse(
            "Password reset email sent",
            200,
            200
        );
    } catch (error) {
        console.error("Error while sending password reset email ",error);
        return errorResponse(
            "Failed to send password reset email",
            500,
            500,
        );
    }
}


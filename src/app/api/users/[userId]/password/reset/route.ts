/**
 * RESOURCE: Password Reset Completion
 * -----------------------------------
 * Role: Verifies a reset token and updates the user's password.
 * Logic:
 * 1. Token Validation: Checks for existence and expiration of the reset record.
 * 2. Hash Comparison: Uses bcrypt to compare the provided plaintext token 
 * against the stored 'tokenHash' (Security best practice).
 * 3. Secure Update: Hashes the new password with a salt round of 12 before saving.
 * 4. Cleanup: Immediately deletes the reset token record after use to prevent replay attacks.
 */
import dbConnect from "@/lib/dbConnect";
import PasswordResetTokenModel from "@/model/password-reset-token.model";
import {UserModel} from "@/model/index";
import bcrypt from "bcryptjs";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";

export async function POST(request:Request) {
    await dbConnect();
    try {
        const { token, userId, password } = await request.json();

        const resetRecord = await PasswordResetTokenModel.findOne({  userId });
        if(!resetRecord || resetRecord.expiresAt < new Date()){
            return errorResponse(
                "Token is invalid or has expired",
                400,
                400,
            );
        }

        const isValid = await bcrypt.compare(token, resetRecord.tokenHash);
        if(!isValid){
            return errorResponse(
                "Token is invalid.",
                400,
                400,
            )
        }
        const hash = await bcrypt.hash(password,12);
        
        const updatePassword = await UserModel.findByIdAndUpdate( userId, { password: hash });

        await PasswordResetTokenModel.deleteOne({ _id: resetRecord._id});

        if(!updatePassword){
            return errorResponse(
                "Failed to update password. Please try again",
                400,
                400,
            );
        }

        return successResponse(
            "Successfully updated password",
            200,
            200,
        )
    } catch (error) {
        console.log("Error while resetting password ",error)
        return errorResponse(
            "Failed to reset password. Please try again",
            500,
            500,
        );
    }
}
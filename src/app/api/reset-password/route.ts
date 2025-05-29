import dbConnect from "@/lib/dbConnect";
import PasswordResetTokenModel from "@/model/password-reset-token.model";
import UserModel from "@/model/user.model";
import bcrypt from "bcryptjs";

export async function POST(request:Request) {
    await dbConnect();
    try {
        const { token, userId, password } = await request.json();

        const resetRecord = await PasswordResetTokenModel.findOne({  userId });
        if(!resetRecord || resetRecord.expiresAt < new Date()){
            return Response.json({
                statusCode: 400,
                message: "Token is invalid or has expired",
                success: false
            })
        }

        const isValid = await bcrypt.compare(token, resetRecord.tokenHash);
        if(!isValid){
            return Response.json({
                statusCode: 400,
                message: "Token is invalid.",
                success: false
            })
        }
        const hash = await bcrypt.hash(password,12);
        
        const updatePassword = await UserModel.findByIdAndUpdate( userId, { password: hash });

        await PasswordResetTokenModel.deleteOne({ _id: resetRecord._id});

        if(!updatePassword){
            return Response.json({
                statusCode: 400,
                message: "Failed to update password. Please try again",
                success: false
            })
        }

        return Response.json({
            statusCode: 200,
            message: "Successfully updated password",
            success: true
        })
    } catch (error) {
        console.log("Error while resetting password ",error)
        return Response.json({
            statusCode: 400,
            message: "Failed to reset password. Please try again",
            success: false
        })
    }
}
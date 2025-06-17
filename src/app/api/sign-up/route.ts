import dbConnect from "@/lib/dbConnect";
import {UserModel} from "@/model/index";
import { sendVerificationEmail } from "@/helpers/SendVerificationEmail";
import bcrypt from "bcryptjs";
import { ApiError, ApiResponse } from "@/types/api.interface";
import unverifiedUserModel from "@/model/unverified-user.model";

// Temporary user store 
const TEMP_USER_STORE = new Map(); 

export async function POST(request: Request){
    await dbConnect()
    try {
        const { username, email, password } = await request.json();
        console.log("email in sign-up route ",email);
        // any of the field is missing
        if(!username || !email || !password){
            return Response.json({
                success: false,
                message: "Missing required fields",
                statusCode: 400
            })
        }

        // 1. check if user already exists and is verified
        const existingUserVerifiedByUsername = await UserModel.findOne({
            username,
            isVerified: true
        })
        if(existingUserVerifiedByUsername){
            return Response.json({
                statusCode: 400,
                message: "Username already exists",
                success: false
            })
        }

        // 2. Generate verification code
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password,10);

        // 3. Store temporarily (in unverified user store)
        await unverifiedUserModel.findOneAndUpdate(
            { email },
            {
                username,
                email,
                password: hashedPassword,
                verifyCode,
                createdAt: new Date(),
            },
            { upsert: true, new: true }
        );

        // 4.send verification email
        const emailResponse = await sendVerificationEmail(email, username, verifyCode)
        if(!emailResponse.success){
            await unverifiedUserModel.deleteOne({ email });
            return Response.json({
                statusCode: 500,
                message: "Account not created. Failed to receive verification code from email",
                success: false
            })
        }   

        return Response.json({
            success: true,
            message: "Verification code sent to email",
            statusCode: 200,
        });
       
    } catch (error) {
        console.error("Error in registering the user ",error)
        return Response.json({
            statusCode: 500,
            message: "Error in registering the user",
            success: false
        })
    }
}
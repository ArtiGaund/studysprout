import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";
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
        // const exisitingUserByEmail = await UserModel.findOne({ email })
        // // generating verify code
        // const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()
        // if(exisitingUserByEmail){
        //     // existing user is verified
        //     if(exisitingUserByEmail.isVerified){
        //         return Response.json({
        //             statusCode: 400,
        //             message: "User already exist with this email.",
        //             success: false
        //        })
        //      }else{
        //          // existing user is there but not verified
        //          const hashedPassword = await bcrypt.hash(password,10);
        //          // overwriting the password only
        //          exisitingUserByEmail.password = hashedPassword
        //          exisitingUserByEmail.verifyCode = verifyCode
        //          exisitingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000)

        //          await exisitingUserByEmail.save()
        //      }
        // }else{
        //     // user came for the first time bz email doesn't exist in database
        //     const hashedPassword = await bcrypt.hash(password,10)
        //     // setting expiry date for verification code for 1 hour
        //     const expiryDate = new Date()
        //     expiryDate.setHours(expiryDate.getHours() + 1)
        //     // saving user in database
        //     const newUser = new UserModel({
        //         username,
        //         email,
        //         password: hashedPassword,
        //         verifyCode,
        //         verifyCodeExpiry: expiryDate
        //     })

        //     await newUser.save()
        // }
        
        // // sending verification email to the user
        // const emailResponse = await sendVerificationEmail(email, username, verifyCode)
        // // console.log("Email Response ",emailResponse)
        // if(!emailResponse.success){
        //     return Response.json({
        //         statusCode: 400,
        //         message: emailResponse.message,
        //         success: false,
        //     })
        // }
        // // email send successfully
        // return Response.json({
        //     statusCode: 200,
        //     message: "User registered successfully, please check your email to verify your account",
        //     success: true
        // })
    } catch (error) {
        console.error("Error in registering the user ",error)
        return Response.json({
            statusCode: 500,
            message: "Error in registering the user",
            success: false
        })
    }
}
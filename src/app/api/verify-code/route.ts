import dbConnect from "@/lib/dbConnect";
import unverifiedUserModel from "@/model/unverified-user.model";
import {UserModel} from "@/model/index";

export async function POST( request: Request){
    await dbConnect()
    try {
        const { username, code } = await request.json()
        console.log("code in verify code ", code);
        // decoding values from url (space is converted into %20%)
        const decodedUsername = decodeURIComponent(username)
        const tempUser = await unverifiedUserModel.findOne({ username: decodedUsername })
        
        // const user = await UserModel.findOne({ username: decodedUsername })
        if(!tempUser){
            return Response.json({
                statusCode: 400,
                message: "Verification session expired or invalid.",
                success: false
            })
        }

        if(tempUser.verifyCode !== code){
            return Response.json({
        statusCode: 400,
        message: "Invalid verification code.",
        success: false,
      });
        }
        const expiryDate = new Date()
        expiryDate.setHours(expiryDate.getHours() + 1)

        const user = await UserModel.create({
            username: tempUser.username,
            email: tempUser.email,
            password: tempUser.password,
            isVerified: true,
            verifyCode: tempUser.verifyCode,
            verifyCodeExpiry: expiryDate,
        });

         await unverifiedUserModel.deleteOne({ email: tempUser.email });
        await user.save();
        
        return Response.json({
            statusCode: 200,
            message: "User registered successfully, please login to continue",
            success: true
        })
    } catch (error) {
        console.error("Error while verifying user ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while verifying user",
            success: false,
        })
    }
}
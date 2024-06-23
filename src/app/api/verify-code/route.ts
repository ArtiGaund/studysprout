import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";

export async function POST( request: Request){
    await dbConnect()
    try {
        const { username, code } = await request.json()
        // decoding values from url (space is converted into %20%)
        const decodedUsername = decodeURIComponent(username)
        const user = await UserModel.findOne({ username: decodedUsername })
        if(!user){
            return Response.json({
                statusCode: 400,
                message: "User not found in database",
                success: false
            })
        }

        const isCodeValid = user.verifyCode === code
        const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date()

        if(isCodeValid && isCodeNotExpired){
            user.isVerified = true
            await user.save()
            return Response.json({
                statusCode: 200,
                message: "Account is verified successfully",
                success: true,
            })
        }else if(!isCodeNotExpired){
            return Response.json({
                statusCode: 400,
                message: "Verification code has been expired. Please signup again to request a new code",
                success: false
            })
        }else{
            return Response.json({
                statusCode: 400,
                message: "Verification code is not correct",
                success: false,
            })
        }
    } catch (error) {
        console.error("Error while verifying user ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while verifying user",
            success: false,
        })
    }
}
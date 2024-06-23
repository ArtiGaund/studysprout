import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";
import { z } from "zod";

// Schema for username validation
import { usernameValidation } from "@/schemas/signUpSchema";

// creating query Schema => to check any object or variable
const UsernameQuerySchema = z.object({
    username: usernameValidation
})

// will get the username from the url => /api/check-username-unique?username=one
export async function GET( request: Request ){
    await dbConnect()
    try {
        // getting the url
        const { searchParams } = new URL(request.url)
        const queryParams = {
            username: searchParams.get('username')
        }
        // validating username with zod
        const validateUsername = UsernameQuerySchema.safeParse(queryParams)
        if(!validateUsername.success){
            const usernameErrors = validateUsername.error.format().username?._errors || [0]
            return Response.json({
                statusCode: 400,
                message: usernameErrors?.length > 0 ? usernameErrors.join(',') : "Invalid query parameters",
                success: false
            })
        }

        const { username } = validateUsername.data
        const existingVerifiedUser = await UserModel.findOne({ username, isVerified: true})
        if(existingVerifiedUser){
            return Response.json({
                statusCode: 400,
                message: "Username already exist",
                success: false
            })
        }
        return Response.json({
            statusCode: 200,
            message: "Username is unique",
            success: true
        })
    } catch (error) {
        console.error("Error while checking username is unique ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while checking username is unique",
            success: false
        })
    }
} 
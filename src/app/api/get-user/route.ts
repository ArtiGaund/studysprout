import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user.model";


export async function GET(request: Request ) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
        userId: searchParams.get('userId')
    }
    if(!queryParams){
         return Response.json({
            statusCode: 401,
             message: "Not login",
            success: false
        })
    }
    const userId = queryParams.userId
    try {
                    
        const user = await UserModel.findById({
            _id: userId
        })
        if(!user){
            return Response.json({
                statusCode: 400,
                message: "No user present",
                success: false
            })
        }
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched public url",
            success: true,
            data: user
        })
    } catch (error) {
        console.log("Error while fetching user from the database ", error)
        return Response.json({
            statusCode: 500,
            message: "Error while fetching image from the database",
            success: false
        })
    }
}
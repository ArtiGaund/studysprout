import dbConnect from "@/lib/dbConnect";
import FolderModel from "@/model/folder.model";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const { _id, iconId } = await request.json()
        console.log("Id of folder ",_id)
        console.log("icon id of folder ",iconId)

        const folder = await FolderModel.findByIdAndUpdate( _id, {
            iconId
        })
        if(!folder){
            return Response.json({
                statusCode: 400,
                message: "Failed to update the folder",
                success: false
            })
        }
        return Response.json({
            statusCode: 200,
            message: "Successfully updated the folder",
            success: true
        })
    } catch (error) {
        console.log("Error while updating the folder ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while updating the folder",
            success: false
        })
    }
}
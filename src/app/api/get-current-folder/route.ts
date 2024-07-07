import dbConnect from "@/lib/dbConnect"
import FolderModel from "@/model/folder.model"

export async function GET(request: Request) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
        folderId: searchParams.get('folderId')
    }
    if(!queryParams){
         return Response.json({
            statusCode: 401,
             message: "No folder id present",
            success: false
        })
    }
    const folderId = queryParams.folderId
    try {
        const folder = await FolderModel.findById({
            _id: folderId
        })
        if(!folder){
            return Response.json({
                statusCode: 401,
                 message: "No folder from this id present",
                success: false
            })
        }
        return Response.json({
            statusCode: 200,
             message: "Successfully fetched current folder",
             data: folder,
            success: true
        })
    } catch (error) {
        console.log("Error while fetching current folder ",error)
        return Response.json({
            statusCode: 500,
             message: "Error while fetching current folder",
            success: false
        })
    }
}
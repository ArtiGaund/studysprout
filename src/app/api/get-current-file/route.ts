import dbConnect from "@/lib/dbConnect"
import FileModel from "@/model/file.model"

export async function GET(request: Request) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
        fileId: searchParams.get('fileId')
    }
    if(!queryParams){
         return Response.json({
            statusCode: 401,
             message: "No file id present",
            success: false
        })
    }
    const fileId = queryParams.fileId
    try {
        const file = await FileModel.findById({
            _id: fileId
        })
        if(!file){
            return Response.json({
                statusCode: 401,
                 message: "No file from this id present",
                success: false
            })
        }
        return Response.json({
            statusCode: 200,
             message: "Successfully fetched current file",
             data: file,
            success: true
        })
    } catch (error) {
        console.log("Error while fetching current file ",error)
        return Response.json({
            statusCode: 500,
             message: "Error while fetching current file",
            success: false
        })
    }
}
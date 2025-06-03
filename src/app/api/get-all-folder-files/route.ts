import dbConnect from "@/lib/dbConnect";
import FolderModel from "@/model/folder.model";


export async function GET(request: Request){
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const queryParams = {
            folderId: searchParams.get('folderId')
    }
    if(!queryParams){
             return Response.json({
                statusCode: 405,
                 message: "No folder id present",
                success: false
            })
    }
    const folderId = queryParams.folderId;
    try {
        const folder = await FolderModel.findById(folderId);
        if(!folder){
            return Response.json({
                statusCode: 401,
                 message: "No folder of this id found in the database",
                success: false
            })
        }
        const fileData = folder.files?.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched all the files for the folder",
            data: fileData,
            success: true
        })
    } catch (error) {
        console.log("Error while get all folder files ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while get all folder files",
            success: false
        })
    }
}
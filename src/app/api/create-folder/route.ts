import dbConnect from "@/lib/dbConnect";
import FolderModel from "@/model/folder.model";
import WorkSpaceModel from "@/model/workspace.model";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const folderData = await request.json();
        const newFolder = await FolderModel.create(folderData)
        if(!newFolder){
            return Response.json({
                statusCode: 400,
                message: "Failed to create new folder, please try again later.",
                success: false
            })
        }
        // console.log("Folder data in create folder ",newFolder)
        // adding folder to the workspace
        const workspaceId = newFolder.workspaceId
        // console.log("Workspace id ",workspaceId)
        const workspace = await WorkSpaceModel.findById(workspaceId)
        if(!workspace){
            const deletingFolder = await FolderModel.findByIdAndDelete(newFolder._id)
            return Response.json({
                statusCode: 400,
                message: "Workspace id is required",
                success: false
            })
        }
        // console.log("Workspace in create folder route ",workspace)
        workspace.folders?.push(newFolder)
        // saving data in workspace
        await workspace.save()

        // console.log("Added folder in workspace ",workspace)
        return Response.json({
            statusCode: 200,
            message: "Successfully created new Folder and added in workspace",
            data: { folder: newFolder, updatedWorkspace: workspace },
            success: true
        })
    } catch (error) {
        console.log("Error while creating new folder in workspace ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while creating new folder in workspace",
            success: false
        })
    }
}

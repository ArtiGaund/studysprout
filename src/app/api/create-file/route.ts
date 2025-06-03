import dbConnect from "@/lib/dbConnect";
import FileModel from "@/model/file.model";
import FolderModel from "@/model/folder.model";
import WorkSpaceModel from "@/model/workspace.model";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const fileData = await request.json();

        // creating a new file
        const newFile = await FileModel.create(fileData)
        if(!newFile){
            return Response.json({
                statusCode: 400,
                message: "Failed to create new file, please try again later.",
                success: false
            })
        }
        
        // find the folder and update it with the new file
        const folderId = newFile.folderId
        const folder = await FolderModel.findById(folderId)
        if(!folder){
           await FileModel.findByIdAndDelete(newFile._id)
            // const deletingFolder = await FolderModel.findByIdAndDelete(newFolder._id)
            return Response.json({
                statusCode: 400,
                message: "Folder id is required",
                success: false
            })
        }

        // push the new file into the folder's files array
        folder.files?.push(newFile)

       // save the updated folder
       await folder.save()

        const workspaceId = folder.workspaceId
        const workspace = await WorkSpaceModel.findById(workspaceId)

        // console.log("Workspace in create file ",workspace)

        if(!workspace){
            return Response.json({
                statusCode: 400,
                message: "Workspace id not found",
                success: false
            })
        }

        // find the index of the updated folder in the workspace
        const updatedFolderIndex = workspace.folders?.findIndex(
            f => f._id?.toString() == folder._id.toString()
        )

        // console.log("Updated folder index ",updatedFolderIndex)
        if(updatedFolderIndex === -1){
            return Response.json({
                statusCode: 400,
                message: "Folder not found in workspace",
                success: false,
            })
        }

        // replace the old folder with the updated one
        if(workspace.folders && updatedFolderIndex !== undefined){
            workspace.folders[updatedFolderIndex] = folder
            
            // save updated workspace
            await workspace.save()

            // console.log("folder data in workspace ",workspace.folders[updatedFolderIndex])
            return Response.json({
                statusCode: 200,
                message: "Successfully created new Folder and added in workspace",
                data: { file: newFile, updatedFolder: folder, updatedWorkspace: workspace},
                success: true
            })
        }

         
        return Response.json({
            statusCode: 400,
            message: "Failed to update the workspace",
            success: false
        })

        // console.log("Added folder in workspace ",workspace)
      
    } catch (error) {
        console.log("Error while creating new file in folder ",error)
        return Response.json({
            statusCode: 500,
            message: "rror while creating new file in folder",
            success: false
        })
    }
}
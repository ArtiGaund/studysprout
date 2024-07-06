import dbConnect from "@/lib/dbConnect";
import FileModel from "@/model/file.model";
import FolderModel from "@/model/folder.model";
import WorkSpaceModel from "@/model/workspace.model";
import mongoose from "mongoose";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const updatedData = await request.json();
           
            const { _id, ...updates } = updatedData;
            if(!_id){
                return Response.json({
                    statusCode: 401,
                    message: "Folder id is required",
                    success: false
                })
            }
            const fileId = new mongoose.Types.ObjectId(_id);
            // updating file
            const file = await FileModel.findByIdAndUpdate(
                fileId,
                updates,
                { new: true }
            )

            if(!file){
                return Response.json({
                    statusCode: 405,
                    message: "Failed to update data in folder",
                    success: false
                })
            }
            // Update folder
        const folder = await FolderModel.findOneAndUpdate(
            { "files._id": fileId },
            {
                $set: {
                    "files.$.title": updates.title,
                    "files.$.iconId": updates.iconId,
                    "files.$.data": updates.data,
                    "files.$.banner": updates.banner,
                    "files.$.inTrash": updates.inTrash
                }
            },
            { new: true }
        );
            if(!folder){
                return Response.json({
                    statusCode: 405,
                    message: "Folder to update data in folder",
                    success: false
                })
            }   

           

             // Update workspace
        const workspace = await WorkSpaceModel.findOneAndUpdate(
            { "folders._id": folder._id },
            {
                $set: {
                    "folders.$.title": folder.title,
                    "folders.$.files": folder.files
                }
            },
            { new: true }
        );

            if(!workspace){
                return Response.json({
                    statusCode: 405,
                    message: "Failed to update folder data in workspace",
                    success: false
                })
            }
            
            // I am saving data in folder later because if saved before and failed to update the workspace, 
            // then it won't save the updated value for folder as well. otherwise there will be inconsistency in code
            // folder collection will be updated but workspace didn't

            // save file
            await file.save()

             // save updated folder
             await folder.save()

            //  save updated workspace 
            await workspace.save()

            return Response.json({
                statusCode: 200,
                message: "Updated data in folder sucessfully. ",
                success: true,
                data: { file, folder, workspace }
            })
    } catch (error) {
        console.log("Error while updating the folder ",error);
        return Response.json({
            statusCode: 505,
            message: "Error while updating the folder",
            success: false
        })
    }
}
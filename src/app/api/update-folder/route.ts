import dbConnect from "@/lib/dbConnect";
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
            const folderId = new mongoose.Types.ObjectId(_id);
            // updating folder
            const folder = await FolderModel.findByIdAndUpdate(
                folderId,
                updates,
                { new: true }
            )
            if(!folder){
                return Response.json({
                    statusCode: 405,
                    message: "Failed to update data in folder",
                    success: false
                })
            }   

           

            // update folder data workspace in workspace

            const workspace = await WorkSpaceModel.findOneAndUpdate(
                { "folders._id" : folderId },
                {
                    $set: {
                         "folders.$.title": updates.title, 
                         "folders.$.iconId": updates.iconId,
                         "folders.$.inTrash": updates.inTrash,
                         "folders.$.data": updates.data,
                         "folders.$.bannerUrl": updates.bannerUrl,
                    } 
                },
                { new: true }
            )

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

             // save updated folder
             await folder.save()

            //  save updated workspace 
            await workspace.save()

            return Response.json({
                statusCode: 200,
                message: "Updated data in folder sucessfully. ",
                success: true,
                data: { folder, workspace }
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
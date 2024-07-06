import dbConnect from "@/lib/dbConnect";
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
                    message: "Workspace id is required",
                    success: false
                })
            }
            const workspaceId = new mongoose.Types.ObjectId(_id);

           
            // updating folder
            const workspace = await WorkSpaceModel.findByIdAndUpdate(
                workspaceId,
                updates,
                { new: true }
            )
            if(!workspace){
                return Response.json({
                    statusCode: 405,
                    message: "Failed to update data in workspace",
                    success: false
                })
            }   

            //  save updated workspace 
            await workspace.save()

            return Response.json({
                statusCode: 200,
                message: "Updated data in workspace sucessfully. ",
                success: true,
                data: workspace
            })
    } catch (error) {
        console.log("Error while updating the workspace ",error);
        return Response.json({
            statusCode: 505,
            message: "Error while updating the workspace",
            success: false
        })
    }
}
import dbConnect from "@/lib/dbConnect";
import { deleteImageFromCloud, uploadImage } from "@/lib/upload-image";
import ImageModel from "@/model/image.model";
import WorkSpaceModel from "@/model/workspace.model";
import mongoose from "mongoose";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const formData = await request.formData()
        const _id = formData.get("_id") as string
        const newLogo = formData.get("newLogo") as File

        if(!_id){
            return Response.json({
                statusCode: 401,
                message: "Workspace id is required",
                success: false
            })
        }

        const workspaceId = new mongoose.Types.ObjectId(_id)
        const updates: any ={}
         // if new logo is uploaded for workspace
         if(newLogo){
            // find the workspace to get the logo image id
            const workspace = await WorkSpaceModel.findById(workspaceId)
            // collecting logo image id
            const oldLogoId = workspace?.logo?._id
            const oldLogo = await ImageModel.findById(oldLogoId)
            // logo is present in the workspace, then delete it

            if(oldLogo){
                // deleting the old logo from cloudinary
                await deleteImageFromCloud(oldLogo.public_id)

                // delete the old logo from database
                await ImageModel.findByIdAndDelete(oldLogoId)
            }

            // uploading the new logo to cloudinary
            const imageData = await uploadImage(newLogo, "studysprout") as { secure_url: string ,public_id: string }
            if(!imageData){
                return Response.json({
                    statusCode: 405,
                    message: "Failed to upload new logo on cloudinary",
                    success: false
                })
            }
            const savedImage = await ImageModel.create({
                image_url: imageData?.secure_url,
                public_id: imageData?. public_id
            })
            if(!savedImage){
                return Response.json({
                    statusCode: 405,
                    message: "Failed to save new logo on database",
                    success: false
                })
            }
            updates.logo = savedImage._id
        }

        const workspace = await WorkSpaceModel.findByIdAndUpdate(
            workspaceId,
            updates,
            { new: true}
        )

        if(!workspace){
            return Response.json({
                statusCode: 405,
                message: "Failed to update the logo for the workspace",
                success: false
            })
        }

        await workspace.save()

        return Response.json({
            statusCode: 200,
            message: "Successfully updated the workspace logo",
            success: true,
            data: workspace
        })

    } catch (error) {
        console.log("Error while updating the workspace logo ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while updating the workspace logo",
            success: false
        })
    }

}
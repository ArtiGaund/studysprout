import dbConnect from "@/lib/dbConnect";
import { deleteImageFromCloud, uploadImage } from "@/lib/upload-image";
import FolderModel from "@/model/folder.model";
import ImageModel from "@/model/image.model";
import WorkSpaceModel from "@/model/workspace.model";
import mongoose from "mongoose";

export async function POST(request: Request) {
    await dbConnect()
    try {
        const formData = await request.formData()
        const _id = formData.get("id") as string
        const newBanner = formData.get("banner") as File

        // if id is not present, file is not there
        if(!_id){
            return Response.json({
                statusCode: 401,
                message: "Folder id is required",
                success: false
            })
        }

        // search of file using id
        const folderId = new mongoose.Types.ObjectId(_id)
        const folder = await FolderModel.findById(folderId)

        // if folder is not present in server
        if(!folder){
            return Response.json({
                statusCode: 401,
                message: "folder is not present in server",
                success: false
            })
        }
        const oldBannerId = folder.bannerUrl
        // if banner is already present in the folder, delete the banner from cloudinary, 
        // and delete the banner from Image collection and remove it from the folder
        if(oldBannerId){
            const oldBanner = await ImageModel.findById(oldBannerId)
            // delete the old banner from cloudinary as well as from image model
            if(oldBanner){
                const deleteFromCloud = await deleteImageFromCloud(oldBanner.public_id)
                if(!deleteFromCloud){
                    return Response.json({
                        statusCode: 405,
                        message: "Failed to delete old banner from cloudinary",
                        success: false
                    })
                }
                const deleteBanner = await ImageModel.findByIdAndDelete(oldBannerId)
                if(!deleteBanner){
                    return Response.json({
                        statusCode: 405,
                        message: "Failed to delete old banner from database",
                        success: false
                    })
                }
            }
        }
        // uploading new banner to cloudinary
        const bannerImage = await uploadImage(newBanner, "studysprout") as { secure_url: string, public_id: string}

        if(!bannerImage){
            return Response.json({
                statusCode: 405,
                message: "Failed to upload new banner on cloudinary",
                success: false
            })
        }

        // saving the banner image in image model
        const savedBannerImage = await ImageModel.create({
            image_url: bannerImage?.secure_url,
            public_id: bannerImage?.public_id
        })

        // failed to upload image in database then delete the image from cloudinary
        if(!savedBannerImage){
            await deleteImageFromCloud(bannerImage.public_id)
            return Response.json({
                statusCode: 405,
                message: "Failed to upload new banner on database",
                success:false
            })
        }

        folder.bannerUrl = savedBannerImage?._id?.toString()

       
        // update the workspace
        const workspace = await WorkSpaceModel.findOneAndUpdate(
            { "folders._id": folder._id },
            {
                $set: {
                    "folders.$.bannerUrl": folder.bannerUrl
                }
            }
        )

        if(!workspace){
            return Response.json({
                statusCode: 405,
                message: "Failed to update banner in workspace",
                success: false
            })
        }

        //  save the folder
        await folder.save()

        // save the workspace
        await workspace.save()

        return Response.json({
            statusCode: 200,
            message: "Successfully uploaded banner for the file",
            success: true,
            data: { folder, workspace }
        })
    } catch (error) {
        console.log("Error while uploading the banner for file ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while uploading the banner for file",
            success: false
        })
    }
}
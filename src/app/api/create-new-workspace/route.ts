
import dbConnect from "@/lib/dbConnect";
import { deleteImageFromCloud, uploadImage } from "@/lib/upload-image";
import ImageModel from "@/model/image.model";
import UserModel from "@/model/user.model";
import WorkSpaceModel from "@/model/workspace.model";




export async function POST(request: any){
    await dbConnect()
    try {
        const formData = await request.formData()
        console.log("Form data ",formData)
        const workspaceName = formData.get("workspaceName")
        const userId = formData.get("userId")
        const image = formData.get("logo") as unknown as File
        console.log("workspaceName in route",workspaceName)
        
        // Check whether same name workspace exist or not
        const existingWorkspace = await WorkSpaceModel.findOne({
            workspaceName,
            workspace_owner: userId
        })

        if(existingWorkspace){
            return Response.json({
                statusCode: 409,
                message: "User already have same name workspace",
                success: false
            })
        }
        // uploading image in cloudinary
        const imageData = await uploadImage(image, "studysprout") as { secure_url: string ,public_id: string }
        
        // console.log("image Data",imageData)

        

        // saving image in image schema database
        if(imageData){
         const savedImage =  await ImageModel.create({
                image_url: imageData?.secure_url,
                public_id: imageData?. public_id
            })

        // console.log("saved image id ",savedImage._id)
        // creating new workspace
        const newWorkspace = await WorkSpaceModel.create({
            workspaceName,
            workspace_owner: userId,
            logo: savedImage._id
        })

        
        // adding the workspace in user model
        const user = await UserModel.findByIdAndUpdate(
            userId,
            {
                $push: { workspace: newWorkspace._id }
            }
        )
        // console.log("workspace have been added into user model ",user)
        if(!newWorkspace){
            // deleting from cloudinary first
            const deleteImageFromCloudinary = await deleteImageFromCloud(savedImage?.public_id)
            console.log("Deleted image from cloudinary ",deleteImageFromCloudinary)
            // deleting from image schema database
            const deleteImage = await ImageModel.findByIdAndDelete(savedImage._id)
            console.log("Deleted image from image schema database ",deleteImage)
            if(deleteImageFromCloudinary && deleteImage){
                console.log("Deleted image from cloudinary and from image schema database")
            }
            return Response.json({
                statusCode: 401,
                message:"Failed to create the new workspace",
                success: false
            })
        }
      
        console.log("Workspace in create new workspace ",newWorkspace)
        return Response.json({
            statusCode: 200,
            message: "SuccessFully create new workspace",
            success: true,
            data: newWorkspace
        })
        }
        

        return Response.json({
            statusCode: 401,
            message:"Logo is required",
            success: false
        })        
        
    } catch (error:any) {
        console.log("Error while Creating the new workspace ",error)
        return Response.json({
            statusCode: 500,
            message: error.message,
            success: false
        })
    }
}
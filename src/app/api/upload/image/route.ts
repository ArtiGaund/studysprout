/**
 * RESOURCE: Image Upload for BlockNote Editor
 * -------------------------------------------
 * Endpoint: /api/upload/image
 * 
 * ROLE: Handles image uploads from the BlockNote editor.
 * BlockNote calls this when a user inserts an image block.
 * Returns the Cloudinary URL which BlockNote stores in the block's props.url.
 * 
 * HOW BLOCKNOTE IMAGES WORK:
 * BlockNote does not store image bytes in the block data.
 * It stores a URL string in props.url. The image lives in cloudinary. MongoDB stores the URL,
 * not the binary.
 * 
 */
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { uploadToCloudinary } from "@/lib/cloudinary-utils/upload-and-delete-from-cloudinary";

export const runtime = "nodejs";

export async function POST(request: NextRequest){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) return errorResponse(
            "Unauthorized",
            401,
            401,
        );

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if(!file) return errorResponse(
            "No File provided",
            400,
            400,
        );

        // Only allow image types
        if(!file.type.startsWith("image/")){
            return errorResponse(
                "Only image files are allowed",
                400,
                400,
            );
        }

        // 5MB limit
        if(file.size > 5 * 1024 * 1024){
            return errorResponse(
                "Image must be under 5MB",
                400,
                400
            );
        }

        const result: any = await uploadToCloudinary(file, "studysprout-images");

        return successResponse(
            "Image uploaded",
            {
                url: result.secure_url,
            },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Image upload], ",error);
        return errorResponse(
            error.message,
            500,
            500,
        );
    }
}
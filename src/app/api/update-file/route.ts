import dbConnect from "@/lib/dbConnect";
import {FileModel, FolderModel, WorkSpaceModel} from "@/model/index";
import { getAggregatedPlainText } from "@/utils/flashcardTextExtractor";
import mongoose from "mongoose";

// threshold for plaintext  generation (5 seconds)
const THROTTLE_THRESHOLD_MS = 5000;

export async function POST(request: Request) {
    await dbConnect()
    try {
        const updatedData = await request.json();
           
            const { _id, ...updates } = updatedData;
            // console.log("updated data ",updatedData);
            // 1. Validate File ID
            if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
                return Response.json({
                    statusCode: 400, // Bad Request
                    message: "Bad Request: File ID is required and must be a valid ObjectId.",
                    success: false
                }, { status: 400 });
            }
            const fileId = new mongoose.Types.ObjectId(_id);
            // 2. Find the original document
            let file = await FileModel.findById(fileId);



            if(!file){
                return Response.json({
                statusCode: 404, // Not Found
                message: "File not found in the database.",
                success: false
            }, { status: 404 });
            }

            // --- START AI OPTIMISATION & THROTTLING LOGIC ---

            // Get the current time for comparison and logging
            const currentTime = Date.now();

            // convert the Mongoose Data field to a timestamp
            const lastGeneratedTimestamp = file.plainTextLastGenerated 
            ? new Date(file.plainTextLastGenerated).getTime()
            : 0;

            // check 1: Does the file data exist in the update payload ?
            if(updates.data){
                // check 2: Is the plain text stale (need regeneration) ?
                if(currentTime - lastGeneratedTimestamp > THROTTLE_THRESHOLD_MS){

                    // run the heavy conversion process
                    const newPlainText = getAggregatedPlainText([updates.data as string]);

                    // update the dedicated fields in the updates payload
                    updates.plainTextContent = newPlainText;
                    updates.plainTextLastGenerated = new Date().toISOString();

                    console.log(`[FileUpdate] Plaintext generated and scheduled for update (Throttle).`);
                }else{
                    console.log(`[FileUpdate] Plaintext generation skipped (Throttle active).`);

                    // Ensure the payload doesn't accidentally contain stale/empty plaintext fields
                    // that might overwrite the existing ones if they weren't explicitly passed.
                    delete updates.plainTextContent;
                    delete updates.plainTextLastGenerated;
                }
            }

            // --- END AI OPTIMISATION & THROTTLING LOGIC ---

            // 3. Apply updates directly to the Mongoose Document instance
            // This ensures Mongoose runs validations and proper type casting before the final save.
            Object.assign(file, updates);

            // 4. Await the save operation
            const savedFile = await file.save();
        
             return Response.json({
                statusCode: 200,
                message: "File updated successfully.",
                success: true,
                data: { file: savedFile.toObject({ getters: true, virtuals: true }) } 
            }, { status: 200 });
    } catch (error: any) {
        console.error("Error while updating the file:", error);

        // Handle specific Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return Response.json({
                statusCode: 400,
                message: `Validation Error: ${messages.join(', ')}`,
                success: false
            }, { status: 400 });
        }
        // Handle CastError for invalid ObjectId if it wasn't caught earlier
        if (error.name === 'CastError' && error.path === '_id') {
             return Response.json({
                statusCode: 400,
                message: "Bad Request: Invalid file ID format provided.",
                success: false
            }, { status: 400 });
        }

        return Response.json({
            statusCode: 500, // Internal Server Error
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}
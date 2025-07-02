import mongoose, { Schema, Document, ObjectId, Types } from "mongoose";
import { WorkSpace } from "./workspace.model";
// import { File, FileSchema } from "./file.model";

// import dbConnect from "@/lib/dbConnect";

export interface Folder{
    _id?: string;
    createdAt: Date,
    title: string,
    iconId?: string,
    data?: string | undefined,
    inTrash?: string | undefined,
    bannerUrl?: string,
    workspaceId?: string,
    files?: Types.ObjectId[],
}



export const FolderSchema: Schema<Folder> = new Schema({
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    title:{
        type: String,
        required: [true, "Title is required"]
    },
    iconId:{
        type: String,
    },
    data:{
        type: String,
    },
    inTrash: {
        type: String,
    },
    bannerUrl:{
        type: String,
    },
    workspaceId:{
        type: String
    },
   files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "File"
    }]
})



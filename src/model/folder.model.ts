import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { WorkSpace } from "./workspace.model";
import { File, FileSchema } from "./file.model";
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
    files?: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }]
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
    files: [ FileSchema ]
})

// const FolderModel = (mongoose.models.Folder as mongoose.Model<Folder>) || (mongoose.model<Folder>("Folder", FolderSchema))
if (mongoose.models.Folder) {
  delete mongoose.models.Folder;
}
const FolderModel = mongoose.model<Folder>("Folder", FolderSchema);

export default FolderModel;
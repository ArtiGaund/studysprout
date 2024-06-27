import mongoose, { Schema, Document } from "mongoose";
import { WorkSpace } from "./workspace.model";
import { Folder } from "./folder.model";
import { ObjectId } from "mongoose";

export interface File{
    _id?: ObjectId,
    title: string,
    iconId?: string,
    data?: string,
    inTrash?: string,
    bannerUrl?: string,
    workspaceId?: WorkSpace,
    folderId?: Folder,
}

export const FileSchema: Schema<File> = new Schema({
    title:{
        type: String,
        required: [true, "Title is required"],
    },
    iconId:{
        type: String,
        // required: [true, "Title is required"],
        // unique: true
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
        type: Schema.Types.ObjectId,
        ref: "Workspace"
    },
    folderId: {
        type: Schema.Types.ObjectId,
        ref: "Folder"
    }
},
{
    timestamps: true
})

const FileModel = (mongoose.models.File as mongoose.Model<File>) || (mongoose.model<File>("File", FileSchema))

export default FileModel
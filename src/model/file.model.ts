import mongoose, { Schema, Document } from "mongoose";
import { WorkSpace } from "./workspace.model";
import { Folder } from "./folder.model";

export interface File {
    _id?: string;
    title: string;
    iconId?: string;
    data?: any; //store actual JSON
    inTrash?: string;
    bannerUrl?: string;
    workspaceId?: string;
    folderId?: string; 
    createdAt: Date;
    lastUpdated: Date;
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
    data: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
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
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }

}
)

// const FileModel = (mongoose.models.File as mongoose.Model<File>) || (mongoose.model<File>("File", FileSchema))
if (mongoose.models.File) {
  delete mongoose.models.File;
}
const FileModel = mongoose.model<File>('File', FileSchema);

export default FileModel
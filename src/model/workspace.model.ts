import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { User } from "./user.model";
import { Image } from "./image.model";
import { Folder, FolderSchema } from "./folder.model";

export interface WorkSpace{
    _id?: string,
    workspace_owner: User,
    title?: string,
    iconId?: string,
    data?: string,
    inTrash?: string,
    logo?: Image | undefined,
    bannerUrl?: string,
    folders?: Folder[],
}

export const WorkspaceSchema: Schema<WorkSpace> = new Schema({
    workspace_owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title:{
        type: String,
        required: [true, "workspace name is required"],
        unique: true
    },
    iconId:{
        type: String,
        // unique: true,
         // required: [true, "Workspace icon is required"],
    },
    data:{
        type: String,
    },
    inTrash: {
        type: String,
    },
    logo:{
        type:  Schema.Types.ObjectId,
        ref: "Image"
    },
    bannerUrl:{
        type: String,
    },
    folders: [ FolderSchema ],
},
{
    timestamps: true
})

const WorkSpaceModel = (mongoose.models.WorkSpace as mongoose.Model<WorkSpace>) || (mongoose.model<WorkSpace>("WorkSpace", WorkspaceSchema))

export default WorkSpaceModel
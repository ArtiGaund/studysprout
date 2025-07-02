import mongoose, { Schema, Document } from 'mongoose';
import { WorkSpace, WorkspaceSchema } from './workspace.model';
import { Folder, FolderSchema } from './folder.model';
import { File, FileSchema } from './file.model';
import { Types } from "mongoose";

// creating User interface
export interface User{
    username: string;
    email: string;
    password: string;
    verifyCode?: string;
    verifyCodeExpiry?: Date;
    isVerified: boolean;
    workspace?: Types.ObjectId[];
}

export const UserSchema: Schema<User> = new Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        trim: true,
        unique: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g, 
        'Please use a valid email address']
    },
    password:{
       type: String,
       required: [true, "Password is required"],
    },
    verifyCode: {
        type: String,
        required: false,
    },
    verifyCodeExpiry: {
        type: Date,
        required: false,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
   workspace: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkSpace"
        }]

},{
    timestamps: true
})

// exporting models -> check if it already created or not, if not then create it else create it


// export default UserModel
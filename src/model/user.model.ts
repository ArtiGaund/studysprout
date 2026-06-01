/**
 * @module UserModel
 * @description The foundational Data Schema for StudySprout Users. 
 * Manages identity, authentication state, and workspace relationships.
 * * * DATA DESIGN HIGHLIGHTS:
 * 1. Email Regex Validation: Implements a strict RFC 5322 compliant regex for robust server-side email verification.
 * 2. Profile Customization: Supports a hybrid Avatar system (Image-based via Cloudinary/OAuth vs. Initial-based).
 * 3. Relational Mapping: Uses an array of ObjectIds to establish a One-to-Many relationship with Workspaces.
 * 4. Verification Flow: Includes fields for `verifyCode` and `isVerified` to support secure signup/onboarding.
 */
import mongoose, { Schema } from 'mongoose';
import { Types } from "mongoose";

// --- Typescript Interface ---
export interface User{
    username: string;
    email: string;
    password: string;
    verifyCode?: string;
    verifyCodeExpiry?: Date;
    isVerified: boolean;
    workspace?: Types.ObjectId[];

    avatarType: "image" | "initial";
    avatarUrl?: string; //cloudinary / OAuth image
    avatarInitials: string;
    lastStudied?: {
        setId: string;
        setTitle: string;
        cardIndex: number;
        totalCards: number;
        resourceType: "Workspace" | "Folder" | "File";
        workspaceId: string;
        folderId?: string;
        studiedAt: Date;
    };
}

// --- Mongoose Schema Definition ---
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
        }],
    avatarType: {
        type: String,
        enum: [ "image", "initial"],
        default: "initial",
    },
    avatarUrl: {
        type: String,
        default: null,
    },
    avatarInitials: {
        type: String,
        required: true,
    },
    lastStudied: {
        setId: {
            type: String,
        },
        setTitle: {
            type: String,
        },
        cardIndex: {
            type: Number,
            default: 0,
        },
        totalCards: {
            type: Number,
        },
        resourceType: {
            type: String,
            enum: [ "Workspace", "Folder", "File"],
        },
        workspaceId: {
            type: String,
        },
        folderId:{
            type: String,
            default: null,
        },
        studiedAt: {
            type: Date,
            default: Date.now,
        },
    },
},{
    timestamps: true
})

// exporting models -> check if it already created or not, if not then create it else create it


// export default UserModel
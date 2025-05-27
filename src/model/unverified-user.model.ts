import mongoose from "mongoose";

export interface UnverifiedUser{
    username: string;
    email: string;
    password: string;
    verifyCode: string;
    verifyCodeExpiry: Date;
}

const UnverifiedUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    verifyCode: {
        type: String,
        required: true,
    },
    verifyCodeExpiry: {
        type: Date,
        default: Date.now(), 
        expires: 600, //TTL: 10 minutes;
    },  
})

export default (mongoose.models.UnverifiedUser as mongoose.Model<UnverifiedUser>) || (mongoose.model<UnverifiedUser>("UnverifiedUser", UnverifiedUserSchema))   
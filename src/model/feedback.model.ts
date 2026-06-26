import { Schema, Types } from "mongoose";

export type FeedbackType = "Bug Report" | "Feature Request" | "Complement";

export interface Feedback{
    userId: Types.ObjectId | string;
    userEmail: string;
    type: FeedbackType;
    message: string;
    // Only relevant for Complement - controls testimonal visibility
    // isApproval: boolean;
    createdAt: Date;
}

export const FeedbackSchema = new Schema<Feedback>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: [ "Bug Report", "Feature Request", "Complement"],
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        // // Complements start unapproved - you manually approve from DB or an admin pannel
        // isApproval: {

        // }
    },
    { timestamps: true }
);


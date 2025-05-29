import mongoose,{ Schema} from "mongoose";

export interface PasswordResetToken {
    userId: mongoose.Schema.Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
}

const PasswordResetTokenSchema: Schema<PasswordResetToken> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    tokenHash: {
        type: String,
        required: true,
    },
    expiresAt: {
        type:Date,
        required: true,
    },
})

const PasswordResetTokenModel = (mongoose.models.PasswordResetToken as mongoose.Model<PasswordResetToken>) || (mongoose.model<PasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema))

export default PasswordResetTokenModel
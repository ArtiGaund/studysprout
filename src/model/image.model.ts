import mongoose, { Schema, Document } from "mongoose";

export interface Image extends Document{
    image_url: string,
    public_id: string,
}

export const ImageSchema: Schema<Image> = new Schema({
    image_url:{
        type: String,
        required: [ true, "Image url is required "]
    },
    public_id: {
        type: String,
        required: [ true, "Public id is required "]
    }
},{
    timestamps: true
})

const ImageModel = (mongoose.models.Image as mongoose.Model<Image>) || (mongoose.model<Image>("Image", ImageSchema))

export default ImageModel
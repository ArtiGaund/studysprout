/**
 * Mongoose Model Registry
 * 
 * Centralizes all models to prevent recompilation issues in Next.js
 * 
 * Usage:
 *  import { FlashcardModel } from "@/model/index";
 */
import mongoose from "mongoose";

// Import all your individual schema files
import { User, UserSchema } from "./user.model";
import { File, FileSchema } from "./file.model";
import { Folder, FolderSchema } from "./folder.model";
import { WorkSpace, WorkspaceSchema } from "./workspace.model";
import { Image, ImageSchema } from "./image.model";
import { Flashcard, FlashcardSchema } from "./flashcard.model";
import { FlashcardSet, FlashcardSetSchema } from "./flashcardset.model";

// Avoid model overwrite errors during hot reload
const UserModel = 
(mongoose.models.User as mongoose.Model<User>) || (mongoose.model<User>("User", UserSchema))
const FolderModel = 
(mongoose.models.Folder as mongoose.Model<Folder>) || mongoose.model<Folder>("Folder", FolderSchema);
const FileModel =
 (mongoose.models.File as mongoose.Model<File>) || mongoose.model<File>("File", FileSchema);
const WorkSpaceModel = 
(mongoose.models.WorkSpace as mongoose.Model<WorkSpace>) || mongoose.model<WorkSpace>("WorkSpace", WorkspaceSchema);
const ImageModel = 
(mongoose.models.Image as mongoose.Model<Image>) || mongoose.model<Image>("Image", ImageSchema);
const FlashcardModel = 
(mongoose.models.Flashcard as mongoose.Model<Flashcard>) || mongoose.model<Flashcard>("Flashcard", FlashcardSchema);
const FlashcardSetModel =
(mongoose.models.FlashcardSet as mongoose.Model<FlashcardSet>) || mongoose.model<FlashcardSet>("FlashcardSet", FlashcardSetSchema);

export {
    UserModel,
    FolderModel,
    FileModel,
    WorkSpaceModel,
    ImageModel,
    FlashcardModel,
    FlashcardSetModel
}
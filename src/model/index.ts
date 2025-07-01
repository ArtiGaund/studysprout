import mongoose from "mongoose";

// Import all your individual schema files
import { User, UserSchema } from "./user.model";
import { File, FileSchema } from "./file.model";
import { Folder, FolderSchema } from "./folder.model";
import { WorkSpace, WorkspaceSchema } from "./workspace.model";
import { Image, ImageSchema } from "./image.model";
// import { PasswordResetToken, PasswordResetTokenSchema } from "./password-reset-token.model";
// import { UnverifiedUser, UnverifiedUserSchema } from "./unverified-user.model";

const UserModel = (mongoose.models.User as mongoose.Model<User>) || (mongoose.model<User>("User", UserSchema))
const FolderModel = (mongoose.models.Folder as mongoose.Model<Folder>) || mongoose.model<Folder>("Folder", FolderSchema);
const FileModel = (mongoose.models.File as mongoose.Model<File>) || mongoose.model<File>("File", FileSchema);
const WorkSpaceModel = (mongoose.models.WorkSpace as mongoose.Model<WorkSpace>) || mongoose.model<WorkSpace>("WorkSpace", WorkspaceSchema);
const ImageModel = (mongoose.models.Image as mongoose.Model<Image>) || mongoose.model<Image>("Image", ImageSchema);
// const PasswordResetTokenModel = (mongoose.models.PasswordResetToken as mongoose.Model<PasswordResetToken>) || mongoose.model<PasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);
// const UnverifiedUserModel = (mongoose.models.UnverifiedUser as mongoose.Model<UnverifiedUser>) || mongoose.model<UnverifiedUser>("UnverifiedUser", UnverifiedUserSchema);

export {
    UserModel,
    FolderModel,
    FileModel,
    WorkSpaceModel,
    ImageModel,
    // PasswordResetTokenModel,
    // UnverifiedUserModel
}
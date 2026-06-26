/**
 * @module ModelRegistry
 * @description Centralized Mongoose model factory for the StudySprout ecosystem.
 * * * ARCHITECTURAL SIGNIFICANCE:
 * 1. Hot-Reload Resilience: Implements a "Check-or-Create" pattern to prevent Mongoose 
 * OverwriteModelErrors during Next.js development (Fast Refresh).
 * 2. Type-Safe Exports: Ensures all exported models carry the correct TypeScript 
 * interfaces (User, Folder, File, etc.) for full IDE intellisense.
 * 3. Singleton Pattern: Ensures that only one instance of each model exists in the 
 * Node.js process, optimizing memory and connection overhead.
 */
import mongoose from "mongoose";

// Schema & Interface Imports
import { User, UserSchema } from "./user.model";
import { 
    File,
     FileSchema, 
 } from "./file.model";
import { Folder, FolderSchema } from "./folder.model";
import { WorkSpace, WorkspaceSchema } from "./workspace.model";
import { Image, ImageSchema } from "./image.model";
import { Flashcard, FlashcardSchema } from "./flashcard.model";
import { FlashcardSet, FlashcardSetSchema } from "./flashcardset.model";
import { FlashcardProgressSchema, IFlashcardProgress } from "./flashcard-progress.model";
import { StudyGoal, StudyGoalSchema } from "./study-goal.model";
import { IActivityEvent, ActivityEventSchema } from "./activity-event.model";
import { UserProgress, UserProgressSchema } from "./user-progress.model";
import { WorkspaceInvitation, WorkspaceInvitationSchema } from "./workspace-invitation-model";
import { Notification, NotificationSchema } from "./notification.model";
import { Feedback, FeedbackSchema } from "./feedback.model";

/**
 * @section Singleton Model Initialization
 * Pattern: (Existing Model) || (New Compiled Model)
 * This is essential for Next.js because global variables (like mongoose.models) 
 * persist across hot-reloads, but the code defining them may re-run.
 */

const UserModel = 
    (mongoose.models.User as mongoose.Model<User>) || 
    (mongoose.model<User>("User", UserSchema));
const FolderModel = 
    (mongoose.models.Folder as mongoose.Model<Folder>) || 
    mongoose.model<Folder>("Folder", FolderSchema);
const FileModel =
    (mongoose.models.File as mongoose.Model<File>) || 
    mongoose.model<File>("File", FileSchema);
const WorkSpaceModel = 
    (mongoose.models.WorkSpace as mongoose.Model<WorkSpace>) || 
    mongoose.model<WorkSpace>("WorkSpace", WorkspaceSchema);
const ImageModel = 
    (mongoose.models.Image as mongoose.Model<Image>) || 
    mongoose.model<Image>("Image", ImageSchema);
const FlashcardModel = 
    (mongoose.models.Flashcard as mongoose.Model<Flashcard>) || 
    mongoose.model<Flashcard>("Flashcard", FlashcardSchema);
const FlashcardSetModel =
    (mongoose.models.FlashcardSet as mongoose.Model<FlashcardSet>) || 
    mongoose.model<FlashcardSet>("FlashcardSet", FlashcardSetSchema);
const FlashcardProgressModel = 
    (mongoose.models.FlashcardProgress as mongoose.Model<IFlashcardProgress>) || 
    mongoose.model<IFlashcardProgress>("FlashcardProgress", FlashcardProgressSchema);
const StudyGoalModel = 
    (mongoose.models.StudyGoal as mongoose.Model<StudyGoal>) || 
    mongoose.model<StudyGoal>("StudyGoal", StudyGoalSchema);
const ActivityEventModel = 
    (mongoose.models.IActivityEvent as mongoose.Model<IActivityEvent>) ||
    mongoose.model<IActivityEvent>("IActivityEvent", ActivityEventSchema);
const UserProgressModel = 
    (mongoose.models.UserProgress as mongoose.Model<UserProgress>) || 
    mongoose.model<UserProgress>("UserProgress", UserProgressSchema);
const WorkspaceInvitationModel =
    (mongoose.models.WorkspaceInvitation as mongoose.Model<WorkspaceInvitation>) ||
    mongoose.model<WorkspaceInvitation>("WorkspaceInvitation", WorkspaceInvitationSchema);
const NotificationModel = 
    (mongoose.models.Notification as mongoose.Model<Notification>) || 
    mongoose.model<Notification>("Notification", NotificationSchema);
const FeedbackModel =
    (mongoose.models.Feedback as mongoose.Model<Feedback>) ||
    mongoose.model<Feedback>("Feedback", FeedbackSchema );

export {
    UserModel,
    FolderModel,
    FileModel,
    WorkSpaceModel,
    ImageModel,
    FlashcardModel,
    FlashcardSetModel,
    FlashcardProgressModel,
    StudyGoalModel,
    ActivityEventModel,
    UserProgressModel,
    WorkspaceInvitationModel,
    NotificationModel,
    FeedbackModel,
}
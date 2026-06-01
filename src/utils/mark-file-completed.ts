import { UserProgressModel } from "@/model";

export async function markFileCompleted(
    userId: string,
    fileId: string,
    folderId: string,
    workspaceId: string,
    minutesSpent?: number,
    completedViaFlashcards = false,
): Promise<void>{
    try {
        await UserProgressModel.findOneAndUpdate(
            { userId, fileId },
            {
                $setOnInsert: {
                    userId,
                    fileId,
                    folderId,
                    workspaceId,
                    completedAt: new Date(),
                    minutesSpent,
                    completedViaFlashcards,
                },
            },
            {
                upsert: true,
                new: true,
            }
        );
    } catch (error) {
        console.error("[MarkfileCompleted] Failed: ",error);
    }
}
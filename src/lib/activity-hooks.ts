import { createEvent } from "@/utils/create-event";
import { Types } from "mongoose";
import { emitActivityCreated } from "./realtime-emitter";


function toObjectId(value: string | undefined, field: string): Types.ObjectId{
    if(!value || !Types.ObjectId.isValid(value)){
        throw new Error(`[activity-hooks] Invalid ObjectId for field "${field}: ${value}`);
    }
    return new Types.ObjectId(value);
}

function toOptionalObjectId(value: string | undefined, field: string): Types.ObjectId | undefined{
    if(!value) return undefined;
    if(!Types.ObjectId.isValid(value)){
        console.warn(`[activity-hook] Skipping invalid optional ObjectId for field "${field}: ${value}"`);
        return undefined;
    }
    return new Types.ObjectId(value);
}

export async function onFolderCreated(
    workspaceId: string,
    folderId: string,
    userId: string,
    title: string,
){
   await createEvent({
        workspaceId: toObjectId(workspaceId, "workspaceId"),
        folderId: toObjectId(folderId, "folderId"),
        userId:  toObjectId(userId, "userId"),
        type: "FOLDER_CREATED",
        description: `Created ${title} folder.`,
        metadata: {
            folderTitle: title,
        },
    });
    await emitActivityCreated(workspaceId,{
         type: 'FOLDER_CREATED',
        description: `Created ${title} folder.`,
        metadata: {
            folderTitle: title,
        },
    }).catch(() => {});
}

export async function onFolderDelete(
    workspaceId: string,
    folderId: string,
    userId: string,
    title: string,
){
   await createEvent({
        workspaceId: toObjectId(workspaceId, "workspaceId"),
        folderId: toObjectId(folderId, "folderId"),
        userId: toObjectId(userId, "userId"),
        type: "FOLDER_DELETED",
        description: `Deleted ${title} folder.`,
        metadata: {
            folderTitle: title,
        }
    });
    await emitActivityCreated(workspaceId,{
        type: "FOLDER_DELETED",
        description: `Deleted ${title} folder.`,
        metadata: {
            folderTitle: title,
        }
    }).catch(() => {});
}

// 1. File created (in /api/file)
export async function onFileCreated(
    workspaceId: string,
    folderId: string,
    fileId: string,
    userId: string,
    title: string,
){
   await createEvent({
        workspaceId:toObjectId(workspaceId, "workspaceId"),
        folderId: toObjectId(folderId, "folderId"),
        fileId: toObjectId(fileId, "fileId"),
        userId: toObjectId(userId, "userId"),
        type: "FILE_CREATED",
        description: `Created ${title} file.`,
        metadata: {
            fileTitle: title
        },
    });

    await emitActivityCreated(workspaceId,{
        type: "FILE_CREATED",
        description: `Created ${title} file.`,
        metadata: {
            fileTitle: title,
        }
    }).catch(() => {});
}

// 2. File saved / updated
export async function onFileUpdated(
    workspaceId: string,
    folderId: string,
    fileId: string,
    userId: string,
    title: string,
){
   await createEvent({
        workspaceId: toObjectId(workspaceId, "workspaceId"),
        folderId: toObjectId(folderId, "folderId"),
        fileId: toObjectId(fileId, "fileId"),
        userId: toObjectId(userId, "userId"),
        type: "FILE_UPDATED",
        description: `Updated project architecture in  ${title}`,
        metadata: {
            fileTitle: title
        },
    });

    await emitActivityCreated(workspaceId,{
        type: "FILE_UPDATED",
        description: `Updated ${title}`,
        metadata: { fileTitle: title },
    }).catch(() => {});
}

// 3. FlashcardSet generated (/api/flashcard-set)
export async function onFlashcardSetGenerated(
   workspaceId: string,
   userId: string,
   setTitle: string,
   cardCount: number,
   source?: {
        fileId?: string,
        fileTitle?: string,
        folderId?: string,
        folderTitle?: string,
   }
){
    let description = `Generated "${setTitle}" (${cardCount} cards)`;
    if(source?.fileTitle){
        description += ` for file ${source.fileTitle}`;
    }else if(source?.folderTitle){
        description += ` for folder ${source.folderTitle}`;
    }else{
        description += ` for this workspace`;
    }

    await createEvent({
        workspaceId: toObjectId(workspaceId, "workspaceId"),
        userId: toObjectId(userId, "userId"),
        folderId: source?.folderId 
            ? toObjectId(source.folderId, "folderId")
            : undefined,
        fileId: source?.fileId
            ? toObjectId(source.fileId, "fileId")
            : undefined,
        type: "FLASHCARD_SET_GENERATED",
        description,
        metadata: {
            setTitle,
            cardCount,
            fileTitle: source?.fileTitle,
            folderTitle: source?.folderTitle,
        }
    });

    await emitActivityCreated(workspaceId,{
        type: "FLASHCARD_SET_GENERATED",
        description,
        metadata: {
            setTitle,
            cardCount,
        },
    }).catch(() => {});
}
export async function onFlashcardSetDeleted(
    workspaceId: string,
    userId: string,
    setTitle: string,
    cardCount: number,
){
    await createEvent({
        workspaceId: toObjectId(workspaceId, "workspaceId"),
        userId: toObjectId(userId, "userId"),
        type: "FLASHCARD_SET_DELETED",
        description: `Deleted flashcard set "${setTitle}" (${cardCount} cards)`,
        metadata: {
            setTitle,
            cardCount,
        }
    });

    await emitActivityCreated(workspaceId,{
        type: "FLASHCARD_SET_DELETED",
        description: `Deleted flashcard set "${setTitle}"`,
        metadata: {
            setTitle,
            cardCount,
        },
    }).catch(() => {});
}

// 4. AI Synthesis completed ( in concept-graph-builder or synthesis worker)
export async function onSynthesisCompleted(
    workspaceId: string,
    userId: string,
    nodeCount: number,
    sourceTitle: string,
    options?: {
        folderId?: string,
    }
){
    await createEvent({
        workspaceId: toObjectId(workspaceId, "workspaceId"),
        folderId: options?.folderId
            ? toObjectId(options.folderId, "folderId")
            : undefined,
        userId:toObjectId(userId, "userId"),
        type: "SYNTHESIS_COMPLETED",
        description: `Synthesized ${nodeCount} nodes from ${sourceTitle}`,
        metadata: {
            nodeCount,
            fileTitle: sourceTitle,
        },
    });

    await emitActivityCreated(workspaceId,{
        type: "SYNTHESIS_COMPLETED",
        description: `Synthesized ${nodeCount} nodes from ${sourceTitle}`,
        metadata: { nodeCount },
    }).catch(() => {});
}

// 5. File Archived / moved to trash (in /api/file/[fileId])
export async function onFileArchived(
    workspaceId: string,
    userId: string,
    fileCount: number,
    folderId?: string,
) {
    await createEvent({
        workspaceId: toObjectId(workspaceId, "workspaceId"),
        userId: toObjectId(userId, "userId"),
        folderId: folderId
            ? toObjectId(folderId, "folderId")
            : undefined,
        type: "FILE_ARCHIVED",
        description: `Archived ${fileCount} reference file${fileCount > 1 ? "s" : ""}`,
        metadata: {
            fileCount,
        },
    });

    await emitActivityCreated(workspaceId,{
        type: "FILE_ARCHIVED",
        description: `Archived ${fileCount} reference file${fileCount > 1 ? "s" : ""}`,
        metadata: { fileCount },
    }).catch(() => {});
}

// 6. New Connection group created (relationship graph)
export async function onConnectionCreated(
    workspaceId: string,
    userId: string,
    folderId?: string,
){
    await createEvent({
        workspaceId: toObjectId(workspaceId, "workspaceId"),
        userId: toObjectId(userId, "userId"),
        folderId: folderId
            ? toObjectId(folderId, "folderId")
            : undefined,
        type: "CONNECTION_CREATED",
        description: `Created new connection group`,
        metadata: {},
    });
}

export async function onMemberJoined(
    workspaceId: string,
    userId: string,
    memberName: string,
    memberEmail: string,
){
    await createEvent({
        workspaceId:toObjectId(workspaceId, "workspaceId"),
        userId: toObjectId(userId, "userId"),
        folderId: undefined,
        fileId: undefined,
        type: "MEMBER_JOINED",
        description: `${memberName} joined the workspace`,
        metadata: {
            memberName,
            memberEmail,
        }
    });

    await emitActivityCreated(workspaceId,{
        type: "MEMBER_JOINED",
        description: `${memberName} joined the workspace`,
        metadata: {
            memberName,
            memberEmail,
        }
    }).catch(() => {});
}

export async function onMemberRemoved(
    workspaceId: string,
    userId: string,
    memberName: string,
    memberEmail: string
){
    await createEvent({
        workspaceId: toObjectId(workspaceId, "workspaceId"),
        userId: toObjectId(userId, "userId"),
        folderId: undefined,
        fileId: undefined,
        type: "MEMBER_REMOVED",
        description: `${memberName} was removed from workspace`,
        metadata: {
            memberName,
            memberEmail,
        }
    });

    await emitActivityCreated(workspaceId,{
        type: "MEMBER_REMOVED",
        description: `${memberName} was removed from workspace`,
        metadata: {
            memberName,
            memberEmail,
        }
    }).catch(() => {});
}


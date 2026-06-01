import { createEvent } from "@/utils/create-event";
import mongoose from "mongoose";

export async function onFolderCreated(
    workspaceId: string,
    folderId: string,
    userId: string,
    title: string,
){
    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        folderId: new mongoose.Types.ObjectId(folderId),
        userId:  new mongoose.Types.ObjectId(userId),
        type: "FOLDER_CREATED",
        description: `Created ${title} folder.`,
        metadata: {
            folderTitle: title,
        },
    });
}

export async function onFolderDelete(
    workspaceId: string,
    folderId: string,
    userId: string,
    title: string,
){
    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        folderId: new mongoose.Types.ObjectId(folderId),
        userId: new mongoose.Types.ObjectId(userId),
        type: "FOLDER_DELETED",
        description: `Deleted ${title} folder.`,
        metadata: {
            folderTitle: title,
        }
    });
}

// 1. File created (in /api/file)
export async function onFileCreated(
    workspaceId: string,
    folderId: string,
    fileId: string,
    userId: string,
    title: string,
){
    createEvent({
        workspaceId:new mongoose.Types.ObjectId(workspaceId),
        folderId: new mongoose.Types.ObjectId(folderId),
        fileId: new mongoose.Types.ObjectId(fileId),
        userId: new mongoose.Types.ObjectId(userId),
        type: "FILE_CREATED",
        description: `Created ${title} file.`,
        metadata: {
            fileTitle: title
        },
    });
}

// 2. File saved / updated
export async function onFileUpdated(
    workspaceId: string,
    folderId: string,
    fileId: string,
    userId: string,
    title: string,
){
    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        folderId: new mongoose.Types.ObjectId(folderId),
        fileId: new mongoose.Types.ObjectId(fileId),
        userId: new mongoose.Types.ObjectId(userId),
        type: "FILE_UPDATED",
        description: `Updated project architecture in  ${title}`,
        metadata: {
            fileTitle: title
        },
    });
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

    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        userId: new mongoose.Types.ObjectId(userId),
        folderId: source?.folderId 
            ? new mongoose.Types.ObjectId(source.folderId)
            : undefined,
        fileId: source?.fileId
            ? new mongoose.Types.ObjectId(source.fileId)
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
}
export async function onFlashcardSetDeleted(
    workspaceId: string,
    userId: string,
    setTitle: string,
    cardCount: number,
){
    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        userId: new mongoose.Types.ObjectId(userId),
        type: "FLASHCARD_SET_DELETED",
        description: `Deleted flashcard set "${setTitle}" (${cardCount} cards)`,
        metadata: {
            setTitle,
            cardCount,
        }
    });
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
    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        folderId: options?.folderId
            ? new mongoose.Types.ObjectId(options.folderId)
            : undefined,
        userId:new mongoose.Types.ObjectId(userId),
        type: "SYNTHESIS_COMPLETED",
        description: `Synthesized ${nodeCount} nodes from ${sourceTitle}`,
        metadata: {
            nodeCount,
            fileTitle: sourceTitle,
        },
    });
}

// 5. File Archived / moved to trash (in /api/file/[fileId])
export async function onFileArchived(
    workspaceId: string,
    userId: string,
    fileCount: number,
    folderId?: string,
) {
    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        userId: new mongoose.Types.ObjectId(userId),
        folderId: folderId
            ? new mongoose.Types.ObjectId(folderId)
            : undefined,
        type: "FILE_ARCHIVED",
        description: `Archived ${fileCount} reference file${fileCount > 1 ? "s" : ""}`,
        metadata: {
            fileCount,
        },
    });
}

// 6. New Connection group created (relationship graph)
export async function onConnectionCreated(
    workspaceId: string,
    userId: string,
    folderId?: string,
){
    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        userId: new mongoose.Types.ObjectId(userId),
        folderId: folderId
            ? new mongoose.Types.ObjectId(folderId)
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
    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        userId: new mongoose.Types.ObjectId(userId),
        folderId: undefined,
        fileId: undefined,
        type: "MEMBER_JOINED",
        description: `${memberName} joined the workspace`,
        metadata: {
            memberName,
            memberEmail,
        }
    });
}

export async function onMemberRemoved(
    workspaceId: string,
    userId: string,
    memberName: string,
    memberEmail: string
){
    createEvent({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        userId: new mongoose.Types.ObjectId(userId),
        folderId: undefined,
        fileId: undefined,
        type: "MEMBER_REMOVED",
        description: `${memberName} was removed from workspace`,
        metadata: {
            memberName,
            memberEmail,
        }
    });
}
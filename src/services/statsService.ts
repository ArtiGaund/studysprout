import axios from "axios";
import { BlobOptions } from "buffer";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

export interface FolderStats{
    readingTimeMinutes: number;
    readingTimeHours: number;
    fileCount: number;
    masteredCount: number;
    totalCards: number;
    masteryPercent: number;
    recallRate: number;
    totalReviewed: number;
    flashcardCoverage: "none" | "folder_set" | "partial" | "full";
    hasProgress: boolean;
    filesWithFlashcards: number;
}

export interface WorkspaceStats{
    readingTimeMinutes: number;
    readingTimeHours: number;
    fileCount: number;
    masteredCount: number;
    totalCards: number;
    masteryPercent: number;
    recallRate: number | null;
    totalReviewed: number;
    flashcardCoverage: "none" | "workspace_set" | "partial" | "full";
    hasAnyFlashcards: boolean;
    hasWorkspaceLevelSet: boolean;
    hasProgress: boolean;
    foldersWithFlashcards: number;
    filesWithFlashcards: number;
    folderCount: number;
    velocityPercent: number;
}

export async function getFolderStatsService(folderId: string): Promise<{
    success: boolean;
    data?: FolderStats;
    message?: string;
}>{
    try {
        const relativePath = `/api/folder/${folderId}/stats`;
        const url = `${BASE_URL}${relativePath}`;

        const { data } = await axios.get(url);
        if(!data.success) return {
            success: false,
            message: data.message,
        }

        return {
            success: true,
            data: data.data as FolderStats
        }
    } catch (error: any) {
        console.error("[StatsService] get Folder stats service failed: ",error.message);
        return {
            success: false,
           message: error.response?.data?.message || error.message || "Failed to fetch folder stats",
        }
    }
}

export async function getWorkspaceStatsService(workspaceId: string): Promise<{
    success: boolean;
    data?: WorkspaceStats;
    message?: string;
}>{
     try {
        const relativePath = `/api/workspace/${workspaceId}/stats`;
        const url = `${BASE_URL}${relativePath}`;

        const { data } = await axios.get(url);
        if(!data.success) return {
            success: false,
            message: data.message,
        }

        return {
            success: true,
            data: data.data as WorkspaceStats
        }
    } catch (error: any) {
        console.error("[StatsService] get Workspace stats service failed: ",error.message);
        return {
            success: false,
           message: error.response?.data?.message || error.message || "Failed to fetch workspace stats",
        }
    }
}
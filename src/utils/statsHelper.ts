import { FolderStats, WorkspaceStats } from "@/services/statsService";

export function formatPercent(value: number | null | undefined): string{
    if(value === null || value === undefined) return "-";
    return `${value}%`;
}

export function formatHours(hours: number, minutes: number): string{
    if(hours >= 1) return `${hours}h`;
    if(minutes > 0) return `${minutes}m`;
    return "-";
}

export function getFolderMasterySubtext(stats: FolderStats | null): string{
    if(!stats) return "";

    switch(stats.flashcardCoverage){
        case "none":
            return "Generate flashcards to track mastery";
        
        case "folder_set":
            // One set covers the whole folder
            return stats.hasProgress
                ? `${stats.masteredCount} of ${stats.totalCards} cards mastered`
                : "Start reviewing to see mastery";

        case "partial":
            // some files have sets, some don't
            return stats.hasProgress
                ? `${stats.filesWithFlashcards} of ${stats.fileCount} files covered · ${stats.masteredCount} mastered.`
                : `${stats.filesWithFlashcards} of ${stats.fileCount} files have flashcards.`;

        case "full":
            // Every file has its own set
            return stats.hasProgress
                ? `${stats.masteredCount} of ${stats.totalCards} cards mastered`
                : "All files covered · Start reviewing";

        default:
            return "";
    }
}

export function getFolderRecallSubtext(stats: FolderStats | null): string{
    if(!stats) return "";

    if(stats.flashcardCoverage === "none") return "No flashcards yet.";
    if(!stats.hasProgress) return "Review cards to see recall rate";

    if(stats.recallRate! >= 80) return "High retention";
    if(stats.recallRate! >= 60) return "Good retention";
    if(stats.recallRate! >= 40) return "Need more review";
    return "Struggling - review more often";
}

export function getWorkspaceMasteredSubtext(stats: WorkspaceStats | null): string{
    if(!stats) return "";

    switch(stats.flashcardCoverage){
        case "none":
            return "Generate flashcards to track progress.";

        case "workspace_set":
            return stats.hasProgress
                ? `of ${stats.totalCards} total cards`
                : "Start reviewing to see mastery";

        case "partial": {
            // Mix of folder/file sets - show what's covered
            const parts: string[] = [];
            if(stats.foldersWithFlashcards > 0){
                parts.push(`${stats.foldersWithFlashcards} of ${stats.folderCount} folders covered.`);
            }
            if(stats.filesWithFlashcards > 0 && stats.foldersWithFlashcards === 0){
                parts.push(`${stats.filesWithFlashcards} files covered`);
            }
            if(!stats.hasProgress) parts.push("Start reviewing");
            return parts.join(" · ");
        }

        case "full":
            return stats.hasProgress
                ? stats.masteredCount > 100
                    ? "Top 5% of researchers"
                    : `of ${stats.totalCards} total cards`
                : "All folders covered · Start reviewing";
                
        default:
            return "";
    }
}

export function getWorkspaceRecallSubtext(stats: WorkspaceStats | null): string{
    if(!stats) return "";

    if(stats.flashcardCoverage === "none") return "No flashcards yet";
    if(!stats.hasProgress) return "Review cards to see recall rate";
    return `${stats.totalReviewed} cards reviewed`; 
}
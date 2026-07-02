/**
 * @module registerWorkspaceEvents
 * @description Centralized event registry for Socket.io. Synchronizes the local Redux 
 * store with remote changes emitted by other workspace members.
 * * CRITICAL PATTERNS:
 * 1. Listener Idempotency: Explicitly calls `socket.off()` before `socket.on()` to prevent 
 * memory leaks and duplicate execution in React's strict mode.
 * 2. Actor Filtering: Uses `payload.senderSocketId` to ensure the user who triggered 
 * the event doesn't process their own update twice (preventing "echo" bugs).
 * 3. Remote Editing Lock: Manages "Presence" state for collaborative title editing, 
 * showing/hiding remote cursors and typing indicators.
 * 4. Data Transformation: Pipes raw network objects through `transformFolder` and 
 * `transformFile` before they reach the Redux reducers.
 */

import { MARK_ACTIVITY_STALE } from "@/store/slices/activitySlice";
import { ADD_FILE, DELETE_FILE, UPDATE_FILE } from "@/store/slices/fileSlice";
import { 
    MARK_FLASHCARD_SETS_STALE, 
    removeSet, 
    updateSingleSet 
} from "@/store/slices/flashcardSetSlice";
import { ADD_FOLDER, DELETE_FOLDER, UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { setRemoteEditing, updateRemoteTitle } from "@/store/slices/uiSlice";
import { SET_PRESENCE } from "@/store/slices/workspacePresenceSlice";
import { AppDispatch } from "@/store/store";
import { WorkspaceMember } from "@/types/workspace-member.type";
import { transformFile, transformFolder } from "@/utils/data-transformers";

import { Socket } from "socket.io-client";

type WorkspaceEventHandlers = {
    /** Members panel - invite/remote */
    onMembersUpdate?: (data: {
        workspaceId: string;
        userId: string;
        username: string;
        action: "added" | "removed";
        member?: WorkspaceMember;
    }) => void;

    /** PDF upload progress bar */
    onPDFProgress?: (data: { 
        folderId: string; 
        progress: number
    }) => void;

    /** Revision sidebar - refresh flashcard set list */
    onFlashcardSetCreated?: (resourceId: string) => void;

    /**Flashcard set viewer - refresh cards after full regeneration */
    onFlashcardSetRegeneration?: (setId: string) => void;

    /** Flashcard set viewer - refresh single card after card regeneration */
    onCardRegeneration?: (setId: string, cardId: string) => void;
    onUsageUpdated?: () => void;

    /**
     * AI generation progress bar - fired repeatedly whila a flashcard set is being generated.
     * Emitted by the realtime server's /emit/progress-update route as 'gen_status_update',
     * carrying { resourceId, progress, totalCards, workspaceId }
     */
    onGenerationProgress?:(data: {
        resourceId: string;
        workspaceId: string;
        progress: number;
        totalCards: number;
    }) => void;

    /**
     * Fired once when a generation job finishes (server emits this directly from the socket
     * generation handler, not through workspace:tree:update).
     */
    onGenerationCompleted?: (data: { resourceId: string}) => void;

    /**
     * Distinct "fully completed and ready to view" signal for a flashcard set, separate from
     * onGenerationCompleted - kept separate since the server emits them as two distinct events
     * for 2 different UI concerns (progress UI vs the revision sidebar's set list)
     */
    onFlashcardSetCompleted?: (data: { resourceId: string }) => void;

    /**
     * Workspace-wide lock map - which resources currently have an active generation lock held 
     * by any member. Derive the "Generate" button's disabled/locked state across all connected
     * clients.
     */
    onWorkspaceLocksUpdate?: (locks: Record<string, any>) => void;
}; 

export function registerWorkspaceEvents(
    socket: Socket,
     dispatch: AppDispatch,
     currentUserId: string,
     handlers?: WorkspaceEventHandlers,
){ 
    // clear previous listener to avoid duplicates and stale closures
    socket.off("presence:update");
    socket.off("members:update");
    socket.off("workspace:tree:update");
    socket.off("pdf:progressing:update");
    socket.off("flashcard_set_created");
    socket.off("flashcard_set_deleted");
    socket.off("gen_status_update");
    socket.off("gen_completed");
    socket.off("flashcard_set_completed");
    socket.off("workspace_locks_update");
    
    // ---- Presence ----

    /** * @event presence:update
     * Updates the list of active users in the workspace header.
     */
    socket.on("presence:update", ({ workspaceId, users}) => {
        dispatch(SET_PRESENCE({ workspaceId, users}));
    });

    /** * @event workspace:tree:update
     * The primary engine for collaborative file-system changes.
     */
    socket.on("members:update", (payload) => {
        handlers?.onMembersUpdate?.(payload);
    });
        
    // ---- Flashcard Set Direct Events ----

    /**
     * @event flashcard_set_created
     * Emitted via /emit/set-created after generation complete in any API route.
     * Tells the revision sidebar to refetch its set list
     */
    socket.on("flashcard_set_created", ({ resourceId }) => {
        handlers?.onFlashcardSetCreated?.(resourceId);
    });

    /**
     * @event flashcard_set_deleted
     * Emitted via /emit/set-deleted after deletion in any API route.
     * Removes the set from Redux immediately for all members.
     */
    socket.on("flashcard_set_deleted", ({ setId }) => {
        dispatch(removeSet({ setId }));
    });

    // ---- Generation Progress / Locks ----

    /**
     * @event gen_status_update
     * Emitted directly by the realtime server's /emit/progress-update route. Fires repeatedly
     * while a flashcard set is generating, carrying live progress/card counts.
     */
    socket.on("gen_status_update", (state) => {
        handlers?.onGenerationProgress?.(state);
    });

    /**
     * @event gen_completed
     * Fired once when a generation job finishes. Emitted directly from the socket server's
     * generation-completion handler.
     */
    socket.on("gen_completed", ({ resourceId }) => {
        handlers?.onGenerationCompleted?.({ resourceId });
    });

    /**
     * @event flashcard_set_completed
     * Distinct from gen_completed - signals the flashcard set viewer/sidebar specifically that
     * the set is now fully ready to be opened.
     */
    socket.on("flashcard_set_completed", ({ resourceId }) => {
        handlers?.onFlashcardSetCompleted?.({ resourceId });
    });

    /**
     * @event workspace_locks_update
     * Broadcasts the current map of active generation locks for the workspace, so every
     * connected member's UI reflects which resources are mid-generation.
     */
    socket.on("workspace_locks_update", (locks) => {
        handlers?.onWorkspaceLocksUpdate?.(locks);
    });

    // ---- workspace:tree:update ----

    /**
     * @event workspace:tree:update
     * The primary collaborative sync event. Carries a `type` and `payload`.
     * All structural changes (folder, file, PDF, flashcard, activity) come through here.
     * 
     * The server uses `.except(sendSocketId)` so the actor never processes their own event-
     * Redux was already updated optimistically on their side.
     */
    socket.on("workspace:tree:update", ({
        type,
        payload
    }) => {
        // 1. Ego-Filter: If I am the sender, ignore to avoid redundant state updates.
        if(socket.id === payload.senderSocketId) return;
        switch(type){
            // --- Folder Operations ---
            case "folder_created":{
                const raw = payload.folder || payload.data?.folder;
                if(!raw){
                    console.error("[Socket-events] folder-created missing folder data: ",payload);
                    break;
                }
                const folder = transformFolder(raw);
                dispatch(ADD_FOLDER({
                    workspaceId: payload.workspaceId,
                    folder,
                }));
                break;
            }
            case "folder_deleted":
                dispatch(DELETE_FOLDER({
                    workspaceId: payload.workspaceId,
                    folderId: payload.folderId
                }));
                break;
            case "folder_trashed":
            case "folder_restored":
            case "folder_updated":{
                const raw = payload.folder || payload.updates;
                if(!raw) break;
                const updates = transformFolder(payload.updates);
                dispatch(UPDATE_FOLDER({
                    workspaceId: payload.workspaceId,
                    id: payload.folderId,
                    updates,
                }));

                 // Release remote editing locks on successful update
                dispatch(setRemoteEditing({
                    itemId: payload.folderId,
                    data: null
                }));
                break;
            }
            // --- File Operations ---
            case "file_created":{
                const raw = payload.file || payload.data?.file || payload.updates;
                if(!raw) break;
                const file = transformFile(raw);
                if(file){
                    dispatch(ADD_FILE({
                        folderId: payload.folderId,
                        file,
                    }));
                }
                break;
            }
            case "file_deleted":
                dispatch(DELETE_FILE({
                    folderId: payload.folderId,
                    fileId: payload.fileId,
                }));
                break;
            case "file_trashed":
            case "file_restored":
            case "file_updated":{
                const raw = payload.file || payload.data?.file || payload.updates;
                if(!raw) break;
                const updates = transformFile(raw);
                dispatch(UPDATE_FILE({
                    folderId: payload.folderId,
                    id: payload.fileId,
                    updates: {
                        ...updates,
                        inTrash: raw.inTrash
                    }
                }));

                // Clear any remote lock for this specific item
                dispatch(setRemoteEditing({
                    itemId: payload.fileId,
                    data: null
                }));
                break;
            }
            // --- File Statistics ---
            case "file_stats_updated":
                // Reading time changed after another member edited a file
                dispatch(UPDATE_FILE({
                    folderId: payload.folderId,
                    id: payload.fileId,
                    updates: {
                        readingTimeMinutes: payload.readingTimeMinutes
                    } as any,
                }));
                break;
            
            // --- Collaborative Editing (Multiplayer) ---
            case "presence:remote-editing-start":
                // Marks an item as "being edited" by another user (disables local editing)
                dispatch(setRemoteEditing({
                    itemId: payload.itemId,
                    data: payload,
                }));
                break;
            case "presence:remote-editing-typing":
                // Updates the "UI ghost" title as another user types in real-time
                dispatch(updateRemoteTitle({
                    itemId: payload.itemId,
                    tempTitle: payload.tempTitle,
                }));
                break;
            case "presence:remote-editing-stop":
                // Releases the lock so other users can now edit
                dispatch(setRemoteEditing({
                    itemId: payload.itemId,
                    data: null,
                }));
                break;

                // ---PDF BACKGROUNG PROCESSING ---
            case "pdf_processing":
                // Route progress to the UI handler 
                handlers?.onPDFProgress?.({
                    folderId: payload.folderId,
                    progress: payload.progress,
                });
                break;
            case "pdf_file_created":{
                const file = transformFile(payload);
                if(file){
                    dispatch(ADD_FILE({
                        folderId: payload.folderId,
                        file,
                    }));

                    // Increament the counter in the Folder Object
                    dispatch(UPDATE_FOLDER({
                        workspaceId: payload.workspaceId,
                        id: payload.folderId,
                        updates: {
                            currentFileCount: payload.currentFileCount,
                        } as any
                    }));
                }
                break;
            }
            case "pdf_folder_completed":
                // Update the folder icon/status in Redux
                dispatch(UPDATE_FOLDER({
                    workspaceId: payload.workspaceId,
                    id: payload.folderId,
                    updates: {
                        iconId: "📁",
                        progress: 100,
                        status: "completed",
                    } as any,
                }));
                // Remove progress bar after 3 seconds
                setTimeout(() => {
                    dispatch(UPDATE_FOLDER({
                        workspaceId: payload.workspaceId,
                        id: payload.folderId,
                        updates: {
                            progress: undefined,
                            totalFiles: 0,
                            currentFileCount: 0,
                        } as any,
                    }));
                },3000)
                break;

            case "pdf_folder_error": 
                dispatch(UPDATE_FOLDER({
                    workspaceId: payload.workspaceId,
                    id: payload.folderId,
                    updates: {
                        iconId: "⚠️",
                        status: "error",
                    } as any
                }));
                break;

            case "pdf_total_files_update":
                dispatch(UPDATE_FOLDER({
                    workspaceId: payload.workspaceId,
                    id: payload.folderId,
                    updates: {
                        totalFiles: payload.totalFileCount,
                    } as any
                }));
                break;

            // ---- Flashcard Set Sync ----
            case "flashcard_set_updated":
                // Another member renamed a flashcard set - update title in Redux instantly
                dispatch(updateSingleSet({
                    _id: payload.setId,
                    title: payload.updates?.title,
                } as any));
                break;

            case "flashcard_set_outdated":
                // File content changed - mark matching sets as outdated
                // so the yellow "Regenerate Set" button appears for all members
                dispatch(MARK_FLASHCARD_SETS_STALE());
                break;

            case "flashcard_set_regenerated":
                // Full set regenerated - cards have changed, viewer must refetch
                dispatch(MARK_FLASHCARD_SETS_STALE());
                handlers?.onFlashcardSetRegeneration?.(payload.setId);
                break;

            case "flashcard_card_regenerated":
                // Single card regenerated - viewer must refetch cards for this set
                dispatch(MARK_FLASHCARD_SETS_STALE());
                handlers?.onCardRegeneration?.(payload.setId, payload.cardId);
                break;

            // ---- Activity Feed ----

            case "activity_created":
                // a new activity was logged - mark stale so RecentActivity refetches 
                dispatch(MARK_ACTIVITY_STALE());
                break;

            case "usage_updated":
                handlers?.onUsageUpdated?.();
                break;

            // ---- Unknown ----
            default: 
                console.warn("[socket-events] unhandled workspace:tree:update type: ",type, payload);
                break;           
            }
        });
}
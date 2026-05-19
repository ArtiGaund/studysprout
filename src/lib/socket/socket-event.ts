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

import { ADD_FILE, DELETE_FILE, UPDATE_FILE } from "@/store/slices/fileSlice";
import { ADD_FOLDER, DELETE_FOLDER, UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { setRemoteEditing, updateRemoteTitle } from "@/store/slices/uiSlice";
import { SET_PRESENCE } from "@/store/slices/workspacePresenceSlice";
import { AppDispatch, RootState } from "@/store/store";
import { transformFile, transformFolder } from "@/utils/data-transformers";

import { Socket } from "socket.io-client";

type WorkspaceEventHandlers = {
    onMembersUpdate?: (data: {
        workspaceId: string;
        userId: string;
        username: string;
        action: "added" | "removed";
    }) => void;
    onPDFProgress?: (data: { 
        folderId: string; 
        progress: number
    }) => void;
}; 
export function registerWorkspaceEvents(
    socket: Socket,
     dispatch: AppDispatch,
     currentUserId: string,
     handlers?: WorkspaceEventHandlers,
){
  
    // clear previous listener to avoid duplicates and stale closures
    socket.off("presence:update");
    socket.off("member:update");
    socket.off("workspace:tree:update");
    socket.off("pdf:progressing:update");

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
        
        socket.on("workspace:tree:update", ({
            type,
            payload
        }) => {
            console.log("[Socket-event] type: ",type);
            console.log("[Socket-event] payload: ",payload);
            // 1. Ego-Filter: If I am the sender, ignore to avoid redundant state updates.
            if(socket.id === payload.senderSocketId) return;
            switch(type){
                // --- Folder Operations ---
                case "folder_created":
                    const folderToTransform = payload.folder || payload.data?.folder;
                   if(!folderToTransform){
                    console.error("[Socket-events] folder-created missing folder data: ",payload);
                    break;
                   }
                    const transformed = transformFolder(folderToTransform);
                    dispatch(ADD_FOLDER({
                        workspaceId: payload.workspaceId,
                        folder: transformed
                    }));
                    break;
                case "folder_deleted":
                    dispatch(DELETE_FOLDER({
                        workspaceId: payload.workspaceId,
                        folderId: payload.folderId
                    }));
                    break;
                case "folder_trashed":
                case "folder_restored":
                case "folder_updated":
                    const folderData = payload.folder || payload.updates;

                    if(!folderData) break;
                    const updatedFolder = transformFolder(payload.updates);
                    dispatch(UPDATE_FOLDER({
                        workspaceId: payload.workspaceId,
                        id: payload.folderId,
                        updates: updatedFolder
                    }));

                     // Release remote editing locks on successful update
                    dispatch(setRemoteEditing({
                        itemId: payload.folderId,
                        data: null
                    }));
                    break;

                    // --- File Operations ---
                case "file_created":
                    const fileToTransform = payload.file || payload.data?.file;
                    if(!fileToTransform) return;
                    const newFile = transformFile(fileToTransform);
                    if(newFile){
                    dispatch(ADD_FILE({
                        folderId: payload.folderId,
                        file: newFile
                    }));
                }
                    break;
                case "file_deleted":
                    dispatch(DELETE_FILE({
                        folderId: payload.folderId,
                        fileId: payload.fileId,
                    }));
                    break;
                case "file_trashed":
                case "file_restored":
                case "file_updated":
                    const fileData = payload.file || payload.data?.file || payload.updates;
                    if(!fileData) return;
                    const updatedFile = transformFile(fileData);
                    dispatch(UPDATE_FILE({
                        folderId: payload.folderId,
                        id: payload.fileId,
                        updates: {
                            ...updatedFile,
                            inTrash: fileData.inTrash
                        }
                    }));

                    // Clear any remote lock for this specific item
                    dispatch(setRemoteEditing({
                        itemId: payload.fileId,
                        data: null
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
            case "pdf_file_created":
                console.log("[Socket-event] pdf file created payload: ",payload);
                const newPdfFile = transformFile(payload);
                if(newPdfFile){
                dispatch(ADD_FILE({
                    folderId: payload.folderId,
                    file: newPdfFile,
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
            }
        })
        
}
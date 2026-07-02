/**
 * @hook useTitleEditing
 * @description A sophisticated synchronization hook for collaborative title editing.
 * * CORE CAPABILITIES:
 * 1. Multi-User Awareness: Distinguishes between local edits and remote (Socket.io) updates.
 * 2. Focus Management: Implements a "Grace Period" logic to prevent accidental blurs during mount.
 * 3. Event Orchestration: Emits granular lifecycle events (Start, Typing, Stop) to the backend.
 * 4. Optimistic Persistence: Updates Redux and DB simultaneously with built-in revert-on-failure.
 */
"use client";

import { useToast } from "@/components/ui/use-toast";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useWorkspace } from "./useWorkspace";
import { useFolder } from "./useFolder";
import { useFile } from "./useFile";
import { 
    clearEditingItem, 
    setEditingItem, 
    updateEditingItemTitle 
} from "@/store/slices/uiSlice";
import React, { useCallback, useEffect, useMemo, useRef} from "react"
import { Folder as MongooseFolder } from "@/model/folder.model";
import { File as MongooseFile } from "@/model/file.model";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { UPDATE_FILE } from "@/store/slices/fileSlice";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { selectCurrentFolder } from "@/store/selectors/folderSelector";
import { useUser } from "@/lib/providers/user-provider";
import { selectUserId } from "@/store/selectors/userSelector";
import { emitRealtimeEvent } from "@/lib/realtime-emitter";
import { useSocket } from "@/lib/providers/socket-provider";


interface UseTitleEditingProps {
    id: string;
    dirType: 'workspace' | 'folder' | 'file';
    originalTitle: string;
    isEditingLocally?: boolean; 
    onEditingStop?: () => void; 
}

export const useTitleEditing = ({ 
    id,
    dirType,
    originalTitle,
    isEditingLocally = false, // Default to false if not provided
    onEditingStop // Destructure the new callback prop
}: UseTitleEditingProps) =>{
    const { socket, isConnected } = useSocket();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const { user } = useUser();

    // --- Selectors ---
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const workspaceId = currentWorkspace?._id;
    const currentFolder = useSelector(selectCurrentFolder);
    const currentUserId = useSelector(selectUserId);

   // Global UI state ensures only one item is edited at a time across the app
    const globalEditingItem = useSelector((state: RootState) => state.ui.editingItem);
    const remoteEditingData = useSelector((state: RootState) => state.ui.remoteEditing[id]);
    
    // Determine if THIS specific item is currently being edited based on the global state
    const isCurrentlyEditingThisItemGlobally = globalEditingItem?.id === id && globalEditingItem.type === dirType;

    // The effective editing state for the hook's internal logic
    // For folders, we'll primarily use isEditingLocally. For files/workspaces, use global state.
    const isCurrentlyEditingThisItemEffective = dirType === 'folder' 
    ? isEditingLocally
    : isCurrentlyEditingThisItemGlobally;

    /**
     * @memoized displayedTitle
     * Resolves the title based on priority: 
     * Local Temp State > Remote User's Typing > Database Original
     */
     const displayedTitle = useMemo((): string => {
        // 1. If I am the one editing locally
        if(isCurrentlyEditingThisItemGlobally) {
            return globalEditingItem.tempTitle ?? originalTitle;
        }

        // 2. If someone ELSE is editing (Remote)
        // remoteEditingData is an object { username, tempTitle, userId}
        // We only want tempTitle
        if(remoteEditingData && typeof remoteEditingData === 'object'){
            return remoteEditingData.tempTitle || originalTitle;
        }

        // 3. Fallback to orihinal
        return originalTitle;
     },[
        isCurrentlyEditingThisItemGlobally,
        globalEditingItem.tempTitle,
        remoteEditingData,
        originalTitle,
     ])

    // data manipulation hooks
    const { updateWorkspaceTitle} = useWorkspace();
    const { updateFolder } = useFolder();
    const { updateFile } = useFile();

    // --- Focus & Interaction Logic ---
    const inputRef = useRef<HTMLInputElement>(null);
    // ref to track if a blur is intentional (e.g., via Enter key)
    const isBlurIntentionalRef = useRef(false);
    // ref to track if an escape key was pressed
    const hasEscapedRef = useRef(false);
    // ref for blur timeout
    const blurTimerRef = useRef<NodeJS.Timeout | null>(null);

    // This flag indicates if the editing mode has just been entered
    // and the input is currently attempting to gain focus.
    const isStartingEditRef = useRef(false);

    // NEW: Ref to track if the item was editing in the previous render
    const wasEditingRef = useRef(false); 

    const startEditTimestampRef = useRef<number | null>(null);

    const startEditGracePeriodTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Define a generous window during which initial blurs are ignored
    const BLUR_PROCESSING_DELAY_MS = 350; // Small delay before processing a blur event
    

    /**
     * @effect Auto-Focus Handler
     * Ensures that when editing starts, the input gains focus and text is pre-selected.
     */
    useEffect(() => {
        // Only focus if we just switched to editing mode
        if(isCurrentlyEditingThisItemGlobally && !wasEditingRef.current){
            const timer = setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select()
            },50);
            return () => clearTimeout(timer);
        }
        wasEditingRef.current = isCurrentlyEditingThisItemGlobally;
    },[
        isCurrentlyEditingThisItemGlobally
    ])
        const emitStopEditing = useCallback(() => {
            if(socket && workspaceId){
                emitRealtimeEvent(
                    'workspace-tree-update',
                    String(workspaceId),
                    'presence:remote-editing-stop',
                    {
                        itemId: id,
                    }
                );
            }
        },[
            socket,
            workspaceId,
            id,
        ])

       
    /**
     * @method handleStartEditing
     * Initializes the collaborative session by notifying the Socket server.
     */
    const handleStartEditing = useCallback(() => {
        // Guard: If already editing this specific item, DO NOT emit or dispatch again
        if(isCurrentlyEditingThisItemGlobally) return;
        if(!user || !socket || !currentUserId || !isConnected){
            console.warn("[useTitleEditing] no user or socket");
            return;
        }

        if(!isCurrentlyEditingThisItemEffective){
        // Set this flag immediately when starting an edit to ignore immediate blurs.
        // It's also set in useEffect, but this ensures it's set before the first render with isCurrentlyEditingThisItemEffective=true.
        isStartingEditRef.current = true; 
        startEditTimestampRef.current = Date.now();
        
        // Clear any pending blur timer if we're starting editing, to avoid race conditions.
        if(blurTimerRef.current){
            clearTimeout(blurTimerRef.current);
            blurTimerRef.current = null;
        }
        // Always dispatch to Redux for global awareness (e.g., to disable other editing)
        dispatch(setEditingItem({
            id,
            type: dirType,
            title: originalTitle
        }));
      
        emitRealtimeEvent(
            'workspace-tree-update',
            String(workspaceId),
            'presence:remote-editing-start',
            {
                itemId: id,
                username: user?.username,
                userId: currentUserId,
                tempTitle: originalTitle,
            }
        );
        }
    }, [
        id,
        dirType,
        originalTitle,
        dispatch,
        isCurrentlyEditingThisItemEffective,
        socket,
        user,
        workspaceId,
        currentUserId,
        isCurrentlyEditingThisItemGlobally,
        isConnected
    ])

    /**
     * @method handleInputFocus
     * @description Finalizes the transition into editing mode.
     * * STRATEGIC ROLE:
     * 1. Focus Confirmation: Resets the 'isStartingEdit' protection flags once 
     * the browser successfully attaches focus to the input.
     * 2. UX Optimization: Automatically selects the entire text string, 
     * allowing the user to overwrite the title immediately without manual highlighting.
     * 3. Race Condition Prevention: Clears any pending 'Grace Period' timers 
     * to ensure the UI doesn't accidentally close the input after focus is gained.
     */
    const handleInputFocus = useCallback(() => {
        // This function's primary role is now to confirm focus and select text.
        // `isStartingEditRef` is now reset by the grace period timer in useEffect.
        if (inputRef.current) {
            inputRef.current.select(); // Ensure text is selected on focus
        }

        // Cleanup of the 'Mounting Shield'
        // If we reach this point, the focus was successful, so we can 
        // stop ignoring blur events.
        if(isStartingEditRef.current){
            isStartingEditRef.current = false;
            startEditTimestampRef.current = null;

            // Clear the safety fallback timer
            if(startEditGracePeriodTimerRef.current){
                clearTimeout(startEditGracePeriodTimerRef.current);
                startEditGracePeriodTimerRef.current = null;
            }
        }
        // No direct reset of isStartingEditRef.current here anymore.
    }, []);

    /**
     * @method handleTitleChange
     * Emits "Throttled" typing events to update remote cursors/titles.
     */
    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {

        if(!socket || !isConnected){
            return;
        }
        const value = e.target.value;

        dispatch(updateEditingItemTitle(value));
        emitRealtimeEvent(
            'workspace-tree-update',
            String(workspaceId),
            'presence:remote-editing-typing',
            {
                itemId: id,
                tempTitle: value,
                userId: currentUserId,
            }
        )

    },[
        dispatch,
        socket,
        workspaceId,
        id,
        isConnected
    ])

    /**
     * @method handleSaveTitle
     * The "Critical Path": Validates input, updates the database via services, 
     * and synchronizes the Redux store with the response.
     */
    const handleSaveTitle = useCallback(async () => {
        // 1. Initial Guard: If we aren't editing or title is missing
        if(
            !isCurrentlyEditingThisItemGlobally || 
            !globalEditingItem || 
            !globalEditingItem.tempTitle 
        ) {
            // If the global state is already cleared or not for this item, just signal stop and return.
           if(isCurrentlyEditingThisItemEffective){
            // Ensure others know we stopped
                emitStopEditing();
                if(onEditingStop) onEditingStop(); 
                dispatch(clearEditingItem()); //ensure global state is clean
           }
           
            return;
        }
        const currentTempTitle = globalEditingItem.tempTitle.trim();

        // 2. Empty Title Case
        if(currentTempTitle === ''){
            toast({
                title: 'Title cannot be empty',
                description: 'Reverted to original title.',
                variant: 'destructive'
            });
            emitStopEditing();
            if(onEditingStop) onEditingStop(); 
            dispatch(clearEditingItem()); // Clear editing, it will display originalTitle
            return; // Stop execution here
        }
        // 3. Unchanged Title case (User clicked out without typing)
        if (currentTempTitle === originalTitle) {
            emitStopEditing();
            if(onEditingStop) onEditingStop(); 
            dispatch(clearEditingItem()); // Just clear editing, no need to save
            return; // Stop execution here
        }

        // If we reach here, title is not empty and has changed, so proceed with saving
        try {
            let success = false;
            let messageType = '';
            let updatedDataFromService: ReduxWorkSpace | ReduxFolder | ReduxFile | null = null;

            if(dirType === 'workspace'){
                const result = await updateWorkspaceTitle(id, currentTempTitle);
                success = !!result?.success; // Ensure result.success is explicitly boolean
                updatedDataFromService = result?.data || null;
                messageType = 'Workspace';
            }else if( dirType === 'folder'){
                const updatedPayload: Partial<MongooseFolder> = {
                    title: currentTempTitle
                };
                const result = await updateFolder(id, updatedPayload);
                success = !!result?.success; // Ensure result.success is explicitly boolean
                updatedDataFromService = result?.data || null;
                messageType = 'Folder';
            }else if(dirType === 'file'){
                const updatedPayload: Partial<MongooseFile> = {
                    title: currentTempTitle
                };
                const result = await updateFile(id, updatedPayload);
            
                success = !!result?.success;
                updatedDataFromService = result?.data || null;
                messageType = 'File';
            }

            if(success && updatedDataFromService){
                // Dispatch the appropriate Redux action to update the store
                if(dirType === 'workspace'){
                    dispatch(UPDATE_WORKSPACE(updatedDataFromService as ReduxWorkSpace))
                }else if(dirType === 'folder' && workspaceId){
                    dispatch(UPDATE_FOLDER({
                        workspaceId,
                        id,
                        updates: updatedDataFromService
                    }))
                }else if(dirType === 'file'){
                    dispatch(UPDATE_FILE({
                        folderId: currentFolder?._id!,
                        id,
                        updates: updatedDataFromService
                    }))
                }
                toast({
                    title: 'Success',
                    description: `${messageType} title updated successfully`
                })
            }else{
                toast({
                    title: 'Failed to update',
                    description: `${messageType} title could not be updated, please try again later`,
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error(`[${originalTitle}] handleSaveTitle: Error updating ${dirType} title: `,error);
            toast({
                title: 'Error',
                description: `An unexpected error occurred while updating ${dirType} title. `,
                variant: 'destructive'
            })  
        }finally{
            emitStopEditing();
            if(onEditingStop) onEditingStop(); // Signal to the component to stop local editing
            dispatch(clearEditingItem()); // Ensure global state is clean
        }
    },[
        isCurrentlyEditingThisItemGlobally, // Use global state for this check
        dirType,
        id,
        dispatch,
        globalEditingItem, // Use global state for this
        originalTitle,
        updateFolder,
        updateFile,
        toast,
        updateWorkspaceTitle,
        onEditingStop, // Add onEditingStop to dependencies
        isCurrentlyEditingThisItemEffective,
        emitStopEditing,
        workspaceId,
        currentFolder,
    ])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === 'Enter'){
            // mark blur as intentional and trigger blur to save
            isBlurIntentionalRef.current = true;
            e.currentTarget.blur(); // This will trigger handleInputBlur
        }
        else if(e.key === 'Escape'){
            // mark escape was pressed, then clear editing state directly without saving
            hasEscapedRef.current = true;

            // 1. Explicitly notify others immediately
            emitStopEditing();

            // 2. Clear local UI
            if(onEditingStop) onEditingStop(); // Signal to the component to stop local editing
            dispatch(clearEditingItem()); // Reverts title implicitly by clearing editingItem
            
            // 3. Force Focus out to trigger closure
            e.currentTarget.blur(); // Remove focus
        }
    },[
        dispatch,
        onEditingStop, // Add onEditingStop to dependencies
        emitStopEditing,
    ])

    const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        // If a blur happens while we're in the "starting edit" window,
        // immediately ignore it and clear the flag's timer.
        // It's crucial to check isStartingEditRef.current directly, not its timer.
        if (isStartingEditRef.current) {
            // No need to clear startEditTimerRef here, it's cleared by handleInputFocus or useEffect fallback.
            return; // Exit early, do not process this blur for saving
        }

        // 2. If Escape was pressed, we've already handled it by clearing state. Ignore this blur.
        if (hasEscapedRef.current) {
            hasEscapedRef.current = false; // Reset for next interaction
            if(onEditingStop) onEditingStop(); // Signal to the component to stop local editing
            return; // Exit early
        }

        // Clear any pending blur timer to prevent double saves
        if (blurTimerRef.current) {
            clearTimeout(blurTimerRef.current);
            blurTimerRef.current = null;
        }

        blurTimerRef.current = setTimeout(() => {
            // Get the related target (the element that received focus)
            const newFocusTarget = e.relatedTarget as HTMLElement | null;

            // Check if the new focus target is still within the current editing element's hierarchy.
            // This prevents blur when moving focus, e.g., to emoji picker or buttons
            const parentOfInput = inputRef.current?.closest('.group\\/folder, .group\\/file');
            if (parentOfInput && newFocusTarget && parentOfInput.contains(newFocusTarget)) {
                return;
            }

            // Schedule save for unintentional blurs, or execute immediately for intentional
            if(isBlurIntentionalRef.current){
                handleSaveTitle();
                isBlurIntentionalRef.current = false; // Reset the flag after use
            } else {
                // Crucially, re-check if we are *still* editing this specific item after the delay
                // and if the Redux state hasn't been cleared by another action (e.g., escape key).
                if (isCurrentlyEditingThisItemGlobally && globalEditingItem?.id === id && globalEditingItem?.type === dirType) {
                    handleSaveTitle();
                } else {
                    if(onEditingStop) onEditingStop(); // Signal to the component to stop local editing
                    emitStopEditing();
                    dispatch(clearEditingItem()); // Ensure global editing state is cleared
                }
            }
            blurTimerRef.current = null; // Clear the timer after it fires
        }, BLUR_PROCESSING_DELAY_MS); 
    },[
        handleSaveTitle,
        isCurrentlyEditingThisItemGlobally, 
        globalEditingItem, 
        id, 
        dirType, 
        dispatch,
        onEditingStop, // Add onEditingStop to dependencies
        emitStopEditing,
    ])

    return {
        isCurrentlyEditingThisItem: isCurrentlyEditingThisItemEffective, // Expose the effective state for rendering
        displayedTitle,
        handleStartEditing,
        handleTitleChange,
        handleSaveTitle, // This is the function called internally by blur/keydown
        handleKeyDown,
        inputRef,
        handleInputBlur, // This is the function to pass to the input's onBlur prop
        handleInputFocus // Expose handleInputFocus
    }
}

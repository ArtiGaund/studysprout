"use client";
import { useToast } from "@/components/ui/use-toast";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useWorkspace } from "./useWorkspace";
import { useFolder } from "./useFolder";
import { useFile } from "./useFile";
import { clearEditingItem, setEditingItem, updateEditingItemTitle } from "@/store/slices/uiSlice";
import React, { useCallback, useEffect, useRef} from "react"
import { Folder as MongooseFolder } from "@/model/folder.model";
import { File as MongooseFile } from "@/model/file.model";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { UPDATE_FILE } from "@/store/slices/fileSlice";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";

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

    const dispatch = useDispatch();
    const { toast } = useToast();

    // editing item from UI state (global Redux state)
    const globalEditingItem = useSelector((state: RootState) => state.ui.editingItem);
    
    // Determine if THIS specific item is currently being edited based on the global state
    const isCurrentlyEditingThisItemGlobally = globalEditingItem?.id === id && globalEditingItem.type === dirType;

    // The effective editing state for the hook's internal logic
    // For folders, we'll primarily use isEditingLocally. For files/workspaces, use global state.
    const isCurrentlyEditingThisItemEffective = dirType === 'folder' ? isEditingLocally : isCurrentlyEditingThisItemGlobally;

    // The displayed title should come from the global editing state if this item is the one being edited globally,
    // otherwise it's the original title. We use globalEditingItem.tempTitle because the actual text input
    // is always backed by the Redux tempTitle for consistency.
    const displayedTitle = isCurrentlyEditingThisItemGlobally ? globalEditingItem.tempTitle : originalTitle;


    // data manipulation hooks
    const { updateWorkspaceTitle} = useWorkspace();
    const { updateFolder } = useFolder();
    const { updateFile } = useFile();

    // Pass the inputRef to the hook
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
    // Ref to manage the timer that resets isStartingEditRef
    const startEditTimerRef = useRef<NodeJS.Timeout | null>(null);

    // NEW: Ref to track if the item was editing in the previous render
    const wasEditingRef = useRef(false); 

    const startEditTimestampRef = useRef<number | null>(null);

    const startEditGracePeriodTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Define a generous window during which initial blurs are ignored
    const BLUR_PROCESSING_DELAY_MS = 350; // Small delay before processing a blur event
    
    useEffect(() => {
        // Only run the focus logic when editing state *changes* to true
        if (isCurrentlyEditingThisItemEffective && !wasEditingRef.current) { 
            // When we enter editing mode, set isStartingEditRef true
            isStartingEditRef.current = true;
            startEditTimestampRef.current = Date.now();

            const focusTimer = setTimeout(() => {
                // check for inputRef.current and isCurrentlyEditingThisItemEffective
                // inside the timeout to ensure the element is still mounted and we are still editing.
                if(inputRef.current && isCurrentlyEditingThisItemEffective) { 
                    inputRef.current.focus();
                    inputRef.current.select();
                }else{
                    if(isStartingEditRef.current){
                        isStartingEditRef.current = false;
                        startEditTimestampRef.current = null;
                    }
                }
            }, 0); // Use 0 delay to put it at the end of the current call stack

            // Cleanup for this specific effect run
            return () => {
                clearTimeout(focusTimer);
            }

        } else if (!isCurrentlyEditingThisItemEffective && wasEditingRef.current) { 
            // This block runs when editing state *changes* to false. Perform cleanup specific to this transition.
            // Reset all flags when not editing, but only if it *just* stopped being editing
            isBlurIntentionalRef.current = false;
            hasEscapedRef.current = false;
            isStartingEditRef.current = false; // Ensure this is reset when editing stops
            startEditTimestampRef.current = null;
            // Clear any pending blur timer if editing stops
            if(blurTimerRef.current){
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
            }
          
        } 

        // IMPORTANT: Update the ref at the very end of the effect for the next render cycle
        wasEditingRef.current = isCurrentlyEditingThisItemEffective;    

    },[ 
        isCurrentlyEditingThisItemEffective,
         originalTitle 
        ]); // Dependencies remain the same


    const handleStartEditing = useCallback(() => {
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
        }))
        }
    }, [
        id,
        dirType,
        originalTitle,
        dispatch,
        isCurrentlyEditingThisItemEffective
    ])

    // Handle input focus
    const handleInputFocus = useCallback(() => {
        // This function's primary role is now to confirm focus and select text.
        // `isStartingEditRef` is now reset by the grace period timer in useEffect.
        if (inputRef.current) {
            inputRef.current.select(); // Ensure text is selected on focus
        }
        if(isStartingEditRef.current){
            isStartingEditRef.current = false;
            startEditTimestampRef.current = null;

            if(startEditGracePeriodTimerRef.current){
                clearTimeout(startEditGracePeriodTimerRef.current);
                startEditGracePeriodTimerRef.current = null;
            }
        }
        // No direct reset of isStartingEditRef.current here anymore.
    }, []);


    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(updateEditingItemTitle(e.target.value));
    },[dispatch])

    const handleSaveTitle = useCallback(async () => {
        // Ensure we are still globally editing this item before saving
        if(!isCurrentlyEditingThisItemGlobally || !globalEditingItem || !globalEditingItem.tempTitle ) {
            // If the global state is already cleared or not for this item, just signal stop and return.
           if(isCurrentlyEditingThisItemEffective){
                 if(onEditingStop) onEditingStop(); 
             dispatch(clearEditingItem()); //ensure global state is clean
           }
           
            return;
        }
        const currentTempTitle = globalEditingItem.tempTitle.trim();

        // if title is empty
        if(currentTempTitle === ''){
            toast({
                title: 'Title cannot be empty',
                description: 'Reverted to original title.',
                variant: 'destructive'
            });
            if(onEditingStop) onEditingStop(); 
            dispatch(clearEditingItem()); // Clear editing, it will display originalTitle
            return; // Stop execution here
        }
        // Check if title is unchanged
        if (currentTempTitle === originalTitle) {
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
                }else if(dirType === 'folder'){
                    dispatch(UPDATE_FOLDER({
                        id,
                        updates: updatedDataFromService
                    }))
                }else if(dirType === 'file'){
                    dispatch(UPDATE_FILE({
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
        isCurrentlyEditingThisItemEffective
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
            if(onEditingStop) onEditingStop(); // Signal to the component to stop local editing
            dispatch(clearEditingItem()); // Reverts title implicitly by clearing editingItem
            e.currentTarget.blur(); // Remove focus
        }
    },[
        dispatch,
        onEditingStop // Add onEditingStop to dependencies
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
        onEditingStop // Add onEditingStop to dependencies
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

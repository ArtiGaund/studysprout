"use client";
import { useToast } from "@/components/ui/use-toast";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useWorkspace } from "./useWorkspace";
import { useFolder } from "./useFolder";
import { useFile } from "./useFile";
import { clearEditingItem, setEditingItem, updateEditingItemTitle } from "@/store/slices/uiSlice";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { WorkSpace as MongooseWorkspace } from "@/model/workspace.model";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { File as MongooseFile } from "@/model/file.model";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { UPDATE_FILE } from "@/store/slices/fileSlice";

interface UseTitleEditingProps {
    id: string;
    dirType: 'workspace' | 'folder' | 'file';
    originalTitle: string;
    // NEW: Optional prop for local editing state control (e.g., for folders)
    isEditingLocally?: boolean; 
    // NEW: Callback to signal when editing should stop (for local state control)
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

    // define a delay for unintentional blurs
    const BLUR_SAVE_DELAY = 150; // Increased slightly for more robustness
    const START_EDIT_WINDOW = 1200; // Increased time window to ignore initial blurs (ms)
    
    useEffect(() => {
        // NEW DEBUG LOG: Check state of refs at start of useEffect
        console.log(`[${originalTitle}] useEffect START: isCurrentlyEditingThisItemEffective: ${isCurrentlyEditingThisItemEffective}, wasEditingRef.current: ${wasEditingRef.current}, inputRef.current: ${inputRef.current ? 'present' : 'NULL'}`);

        // Only run the focus logic when editing state *changes* to true
        if (isCurrentlyEditingThisItemEffective && !wasEditingRef.current) { 
            console.log(`[${originalTitle}] useEffect: isCurrentlyEditingThisItemEffective CHANGED TO TRUE. Scheduling focus.`); 
            // When we enter editing mode, set isStartingEditRef true
            isStartingEditRef.current = true;
            
            console.log(`[${originalTitle}] useEffect: Scheduling focus. inputRef.current BEFORE setTimeout: ${inputRef.current ? 'present' : 'NULL'}`);
            const focusTimer = setTimeout(() => {
                // IMPORTANT: Add an additional check for inputRef.current and isCurrentlyEditingThisItemEffective
                // inside the timeout to ensure the element is still mounted and we are still editing.
                if(inputRef.current && isCurrentlyEditingThisItemEffective) { 
                    console.log(`[${originalTitle}] useEffect: Attempting to focus. inputRef.current INSIDE setTimeout: ${inputRef.current ? 'present' : 'NULL'}`);
                    inputRef.current.focus();
                    inputRef.current.select();
                    console.log(`[${originalTitle}] useEffect: Input focused and selected.`)
                    // isStartingEditRef will be reset by handleInputFocus, not here.
                }else{
                    console.log(`[${originalTitle}] useEffect: inputRef.current is NULL or not editing after timeout. inputRef.current: ${inputRef.current ? 'present' : 'NULL'}, isCurrentlyEditingThisItemEffective: ${isCurrentlyEditingThisItemEffective}`)
                }
            }, 0); // Use 0 delay to put it at the end of the current call stack

            // Fallback: If for some reason handleInputFocus doesn't fire,
            // reset isStartingEditRef after a longer delay to prevent indefinite blocking.
            if(startEditTimerRef.current){
                clearTimeout(startEditTimerRef.current);
            }
            startEditTimerRef.current = setTimeout(() => {
                if(isStartingEditRef.current){
                    console.log(`[${originalTitle}] useEffect: Fallback: isStartingEditRef reset after long delay.`);
                    isStartingEditRef.current = false;
                }
                startEditTimerRef.current = null;
            }, START_EDIT_WINDOW * 2); // Twice the normal window as a safety net

        } else if (!isCurrentlyEditingThisItemEffective && wasEditingRef.current) { 
            // This block runs when editing state *changes* to false. Perform cleanup specific to this transition.
            console.log(`[${originalTitle}] useEffect: isCurrentlyEditingThisItemEffective CHANGED TO FALSE. Performing cleanup.`); 
            // Reset all flags when not editing, but only if it *just* stopped being editing
            isBlurIntentionalRef.current = false;
            hasEscapedRef.current = false;
            isStartingEditRef.current = false; // Ensure this is reset when editing stops
            // Clear any pending blur timer if editing stops
            if(blurTimerRef.current){
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
            }
            // Also clear the start edit timer
            if(startEditTimerRef.current){
                clearTimeout(startEditTimerRef.current);
                startEditTimerRef.current = null;
            }
        } else if (isCurrentlyEditingThisItemEffective) { 
            // This means it's true, but was true before. Do nothing for focus re-scheduling.
            console.log(`[${originalTitle}] useEffect: isCurrentlyEditingThisItemEffective is True, but no state change (was true). Skipping focus re-schedule.`); 
        } else { 
            console.log(`[${originalTitle}] useEffect: isCurrentlyEditingThisItemEffective is False, and no state change (was false).`); 
        }

        // IMPORTANT: Update the ref at the very end of the effect for the next render cycle
        wasEditingRef.current = isCurrentlyEditingThisItemEffective; 

        // This return handles cleanup for any state change (unmount or editing state changes)
        return () => {
            if(blurTimerRef.current){
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
            }
            if(startEditTimerRef.current){
                clearTimeout(startEditTimerRef.current);
                startEditTimerRef.current = null;
            }
        };

    },[ isCurrentlyEditingThisItemEffective, originalTitle ]); // Dependencies remain the same


    const handleStartEditing = useCallback(() => {
        console.log(`[${originalTitle}] handleStartEditing: Attempt to set editing item.`);
        // Set this flag immediately when starting an edit to ignore immediate blurs.
        // It's also set in useEffect, but this ensures it's set before the first render with isCurrentlyEditingThisItemEffective=true.
        isStartingEditRef.current = true; 
        
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
    }, [
        id,
        dirType,
        originalTitle,
        dispatch
    ])

    // NEW: Handle input focus
    const handleInputFocus = useCallback(() => {
        // Reset isStartingEditRef only if it was true AND within the expected time window.
        // This ensures it's reset ONLY when focus is truly gained due to the intended edit action.
        if (isStartingEditRef.current) {
            console.log(`[${originalTitle}] handleInputFocus: Input truly focused. Resetting isStartingEditRef.`);
            isStartingEditRef.current = false;
            // Clear the fallback timer if focus succeeded
            if (startEditTimerRef.current) {
                clearTimeout(startEditTimerRef.current); 
                startEditTimerRef.current = null;
            }
        }
    }, [originalTitle]);


    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(updateEditingItemTitle(e.target.value));
    },[dispatch])

    const handleSaveTitle = useCallback(async () => {
        console.log(`[${originalTitle}] handleSaveTitle: Entering save logic.`);
        // Ensure we are still globally editing this item before saving
        if(!isCurrentlyEditingThisItemGlobally || !globalEditingItem || !globalEditingItem.tempTitle ) {
            console.log(`[${originalTitle}] handleSaveTitle: Not currently globally editing or no tempTitle. Clearing state. `)
            // If the global state is already cleared or not for this item, just signal stop and return.
            if(onEditingStop) onEditingStop(); 
            dispatch(clearEditingItem()); //ensure global state is clean
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
            console.log(`[${originalTitle}] handleSaveTitle: Title unchanged. Clearing editing item.`);
            if(onEditingStop) onEditingStop(); 
            dispatch(clearEditingItem()); // Just clear editing, no need to save
            return; // Stop execution here
        }

        // If we reach here, title is not empty and has changed, so proceed with saving
        try {
            let success = false;
            let messageType = '';
            let updatedDataFromService: MongooseWorkspace | MongooseFolder | MongooseFile| null = null;

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
                console.log(`[${originalTitle}] handleSaveTitle: updated folder result:`, result);
                success = !!result?.success; // Ensure result.success is explicitly boolean
                updatedDataFromService = result?.data || null;
                messageType = 'Folder';
            }else if(dirType === 'file'){
                const updatedPayload: Partial<MongooseFile> = {
                    title: currentTempTitle
                };
                const result = await updateFile(id, updatedPayload);
                console.log(`[${originalTitle}] handleSaveTitle: Attempting to update file with ID: ${id}, new title: ${currentTempTitle}`);
                console.log(`[${originalTitle}] handleSaveTitle: updated file result:`, result);
                
                // Add a specific check here to see the full result of updateFile
                if (result) {
                    console.log(`[${originalTitle}] handleSaveTitle: File update service call returned:`, result);
                    if (result.success) {
                        console.log(`[${originalTitle}] handleSaveTitle: File update reported success. Data:`, result.data);
                    } else {
                        console.log(`[${originalTitle}] handleSaveTitle: File update reported failure. Error:`, result.error);
                    }
                } else {
                    console.log(`[${originalTitle}] handleSaveTitle: File update service call returned undefined or null.`);
                }

                success = !!result?.success;
                updatedDataFromService = result?.data || null;
                messageType = 'File';
            }

            if(success && updatedDataFromService){
                // Dispatch the appropriate Redux action to update the store
                if(dirType === 'workspace'){
                    dispatch(UPDATE_WORKSPACE(updatedDataFromService as MongooseWorkspace))
                }else if(dirType === 'folder'){
                    dispatch(UPDATE_FOLDER(updatedDataFromService as MongooseFolder))
                }else if(dirType === 'file'){
                    dispatch(UPDATE_FILE(updatedDataFromService as MongooseFile))
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
            console.log(`[${originalTitle}] handleSaveTitle: Clearing editing item after save attempt.`);
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
        onEditingStop // Add onEditingStop to dependencies
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
            console.log(`[${originalTitle}] handleKeyDown: Clearing editing item on Escape key.`);
            if(onEditingStop) onEditingStop(); // Signal to the component to stop local editing
            dispatch(clearEditingItem()); // Reverts title implicitly by clearing editingItem
            e.currentTarget.blur(); // Remove focus
        }
    },[
        dispatch,
        originalTitle,
        onEditingStop // Add onEditingStop to dependencies
    ])

    const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        console.log(`[${originalTitle}] handleInputBlur: Event fired.`);

        // If a blur happens while we're in the "starting edit" window,
        // immediately ignore it and clear the flag's timer.
        // It's crucial to check isStartingEditRef.current directly, not its timer.
        if (isStartingEditRef.current) {
            console.log(`[${originalTitle}] handleInputBlur: Ignoring immediate blur as isStartingEditRef is true.`);
            // No need to clear startEditTimerRef here, it's cleared by handleInputFocus or useEffect fallback.
            return; // Exit early, do not process this blur for saving
        }

        // Clear any pending blur timer to prevent double saves
        if (blurTimerRef.current) {
            clearTimeout(blurTimerRef.current);
            blurTimerRef.current = null;
        }

        blurTimerRef.current = setTimeout(() => {
            console.log(`[${originalTitle}] handleInputBlur: Delayed processing started.`);

            // Get the related target (the element that received focus)
            const newFocusTarget = e.relatedTarget as HTMLElement | null;

            // Check if the new focus target is still within the current editing element's hierarchy.
            // This prevents blur when moving focus, e.g., to emoji picker or buttons
            const parentOfInput = inputRef.current?.closest('.group\\/folder, .group\\/file');
            if (parentOfInput && newFocusTarget && parentOfInput.contains(newFocusTarget)) {
                console.log(`[${originalTitle}] handleInputBlur: Focus moved within the same editing component's parent. Ignoring.`);
                return;
            }

            // Prevent saving if escape was just pressed
            if(hasEscapedRef.current){
                hasEscapedRef.current = false; // Reset for next interaction
                console.log(`[${originalTitle}] handleInputBlur: Blur due to Escape, returning.`);
                if(onEditingStop) onEditingStop(); // Signal to the component to stop local editing
                dispatch(clearEditingItem()); // Ensure global state is cleared if not already
                return;
            }

            // Schedule save for unintentional blurs, or execute immediately for intentional
            if(isBlurIntentionalRef.current){
                console.log(`[${originalTitle}] handleInputBlur: Intentional blur (Enter key), calling handleSaveTitle immediately.`);
                handleSaveTitle();
                isBlurIntentionalRef.current = false; // Reset the flag after use
            } else {
                console.log(`[${originalTitle}] handleInputBlur: Unintentional blur (click outside), attempting to save.`);
                // Crucially, re-check if we are *still* editing this specific item after the delay
                // and if the Redux state hasn't been cleared by another action (e.g., escape key).
                if (isCurrentlyEditingThisItemGlobally && globalEditingItem?.id === id && globalEditingItem?.type === dirType) {
                    handleSaveTitle();
                } else {
                    console.log(`[${originalTitle}] handleInputBlur: Delayed blur: Editing state changed or not currently editing this item, not saving.`);
                    if(onEditingStop) onEditingStop(); // Signal to the component to stop local editing
                    dispatch(clearEditingItem()); // Ensure global editing state is cleared
                }
            }
            blurTimerRef.current = null; // Clear the timer after it fires
        }, BLUR_SAVE_DELAY); 
    },[
        handleSaveTitle,
        originalTitle,
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

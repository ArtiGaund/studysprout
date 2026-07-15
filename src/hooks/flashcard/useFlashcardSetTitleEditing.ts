"use client";

import { useToast } from "@/components/ui/use-toast";
import { useSocket } from "@/lib/providers/socket-provider";
import { useUser } from "@/lib/providers/user-provider";
import { emitRealtimeEvent } from "@/lib/realtime-emitter";
import { updateFlashcardSetTitleService } from "@/services/flashcardSetServices";
import { selectUserId } from "@/store/selectors/userSelector";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { updateSingleSet } from "@/store/slices/flashcardSetSlice";
import React, { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

interface UseFlashcardSetTitleEditingProps{
    setId: string;
    originalTitle: string;
};

export function useFlashcardSetTitleEditing({
    setId,
    originalTitle,
}: UseFlashcardSetTitleEditingProps){
    const dispatch = useDispatch();
    const { toast } = useToast();

    const { socket, isConnected } = useSocket();
    const { user } = useUser();
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const workspaceId = currentWorkspace?._id;
    const currentUserId = useSelector(selectUserId);

    const [ isEditing, setIsEditing ] = useState(false);
    const [ tempTitle, setTempTitle ] = useState(originalTitle);
    const [ isSaving, setIsSaving ] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    // Prevents blur from firing a save when enter key already triggered one
    const enterSavedRef = useRef(false);

    /**
     * @method emitStopEditing
     * Notifies other workspace members that the lock on this set is released.
     * Called on save, cancel, and blur-without-save.
     */
    const emitStopEditing = useCallback(() => {
        if(socket && workspaceId){
            emitRealtimeEvent(
                'workspace-tree-update',
                String(workspaceId),
                'presence:remote-editing-stop',
                { itemId: setId }
            );
        }
    },[
        socket,
        workspaceId,
        setId,
    ]);

    const startEditing = useCallback(() => {
        if(!socket || !isConnected || !user || !currentUserId){
            console.warn("[useFlashcardSetTitleEditing] no socket/user, editing locally only");
        }

        setTempTitle(originalTitle);
        setIsEditing(true);

        // Notify others this set is now locked for editing
        if(socket && isConnected && workspaceId && user && currentUserId){
            emitRealtimeEvent(
                'workspace-tree-update',
                String(workspaceId),
                'presence:remote-editing-start',
                {
                    itemId: setId,
                    username: user.username,
                    userId: currentUserId,
                    tempTitle: originalTitle,
                }
            );
        }else{
            console.warn("[useFlashcardSetTitleEditing] no socket/user, editing locally only- remote lock not broadcast");
        }
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 30);
    },[
        originalTitle,
        socket,
        isConnected,
        user,
        currentUserId,
        workspaceId,
        setId,
    ]);

    const save = useCallback(async () => {
        const trimmed = tempTitle.trim();

        // Empty title -> revert silently
        if(!trimmed){
            setTempTitle(originalTitle);
            setIsEditing(false);
            emitStopEditing();
            return;
        }

        // Unchanged -> close without API call
        if(trimmed === originalTitle){
            setIsEditing(false);
            emitStopEditing();
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateFlashcardSetTitleService(setId, trimmed);
            if(!result.success){
                toast({
                    title: "Failed to rename",
                    description: result.message ?? "Please try again",
                    variant: "destructive",
                });
                setTempTitle(originalTitle);
                return;
            }
            dispatch(updateSingleSet({
                _id: setId,
                title: trimmed,
            } as any));
            toast({
                title: "Successfully renamed flashcard set",
                description: `Set renamed to ${trimmed}`,
            });
        } catch (error: any) {
            console.error("[useFlashcardSetTitleEditing] Save failed: ",error.message);
            setTempTitle(originalTitle);
        }finally{
            setIsSaving(false);
            setIsEditing(false);
            emitStopEditing();
        }
    },[
        tempTitle,
        originalTitle,
        setId,
        dispatch,
        toast,
        emitStopEditing,
    ]);

    // Cancel without saving 
    const cancel = useCallback(() => {
        setTempTitle(originalTitle);
        setIsEditing(false);
        emitStopEditing();
    },[ originalTitle, emitStopEditing ]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setTempTitle(value);

            // Broadcast live typing so remote viewers see the "ghost" title
            if(socket && isConnected && workspaceId){
                emitRealtimeEvent(
                    'workspace-tree-update',
                    String(workspaceId),
                    'presence:remote-editing-typing',
                    {
                        itemId: setId,
                        tempTitle: value,
                        userId: currentUserId,
                    },
                );
            }
        },
    [
        socket,
        isConnected,
        workspaceId,
        setId,
        currentUserId,
    ]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Enter"){
            e.preventDefault();
            enterSavedRef.current = true;
            save();
        }else if( e.key === "Escape"){
            cancel();
        }
    },[
        save,
        cancel,
    ]);

    const handleBlur = useCallback(() => {
        // If enter already triggered save, skip - avoids double API call
        if(enterSavedRef.current){
            enterSavedRef.current = false;
            return;
        }
        save();
    },[
        save,
    ]);

    return {
        isEditing,
        tempTitle,
        isSaving,
        inputRef,
        startEditing,
        cancel,
        handleChange,
        handleKeyDown,
        handleBlur,
    };
}
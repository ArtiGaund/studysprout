"use client";

import { useToast } from "@/components/ui/use-toast";
import { updateFlashcardSetTitleService } from "@/services/flashcardSetServices";
import { updateSingleSet } from "@/store/slices/flashcardSetSlice";
import React, { useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";

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

    const [ isEditing, setIsEditing ] = useState(false);
    const [ tempTitle, setTempTitle ] = useState(originalTitle);
    const [ isSaving, setIsSaving ] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    // Prevents blur from firing a save when enter key already triggered one
    const enterSavedRef = useRef(false);

    const startEditing = useCallback(() => {
        setTempTitle(originalTitle);
        setIsEditing(true);
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 30);
    },[
        originalTitle,
    ]);

    const save = useCallback(async () => {
        const trimmed = tempTitle.trim();

        // Empty title -> revert silently
        if(!trimmed){
            setTempTitle(originalTitle);
            setIsEditing(false);
            return;
        }

        // Unchanged -> close without API call
        if(trimmed === originalTitle){
            setIsEditing(false);
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
        }
    },[
        tempTitle,
        originalTitle,
        setId,
        dispatch,
        toast,
    ]);

    // Cancel without saving 
    const cancel = useCallback(() => {
        setTempTitle(originalTitle);
        setIsEditing(false);
    },[ originalTitle ]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => setTempTitle(e.target.value),
    []);

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
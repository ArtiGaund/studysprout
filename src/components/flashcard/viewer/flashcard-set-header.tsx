/**
 * This component is used to show the title of the flashcard set
 */
'use client';

import { useFlashcardSetTitleEditing } from "@/hooks/flashcard/useFlashcardSetTitleEditing";
import { useClickDifferentiator } from "@/hooks/useClickDifferentiator";
import { ReduxFlashcardSet } from "@/types/state.type";
import { Pencil, Trash } from "lucide-react";
import React from "react";

interface FlashcardSetHeaderProps{
    set: ReduxFlashcardSet;
    onDelete: (id: string) => void;
}
const FlashcardSetHeader: React.FC<FlashcardSetHeaderProps> = ({
    set,
    onDelete,
}) => {

    const {
        isEditing,
        tempTitle,
        isSaving,
        inputRef,
        startEditing,
        handleBlur,
        handleChange,
        handleKeyDown,
    } = useFlashcardSetTitleEditing({
        setId: set._id,
        originalTitle: set.title,
    });
    
    const { handleMouseClickInterception } = useClickDifferentiator({
        onSingleClickAction: () => {},
        onDoubleClickAction: () => {
            if(!isEditing) startEditing();
        }
    });

    return (
        <div className="group flex gap-2 items-center flex-1 min-w-0 mr-2">
             {/* Title or inline input */}
            {isEditing ? (
                <input 
                    ref={inputRef}
                    value={tempTitle}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isSaving}
                    className="text-[20px] font-medium text-white bg-zinc-900 border
                    border-purple-500/50 rounded px-1.5 py-0.5 outline-none w-full"
                />
            ) : (
                <span 
                    onClick={handleMouseClickInterception}
                    className="text-[20px] text-gray-200 cursor-pointer
                    select-none"
                >
                    {set.title}
                </span>
            )}

            {/* Hover actions: pencil + trash */}
            {!isEditing && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5
                transition-all shrink-0">   
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            startEditing();
                        }}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Rename set"
                    >
                        <Pencil size={12} className="text-gray-400 hover:text-white"/>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(set._id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 transition-colors"
                        title="Delete set"
                    >
                        <Trash size={13} className="text-gray-400 group-hover:text-red-400"/>
                    </button>
                </div>
            )}
        </div>
    )
}

export default FlashcardSetHeader;
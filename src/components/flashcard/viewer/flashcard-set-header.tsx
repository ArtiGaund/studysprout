/**
 * This component is used to show the title of the flashcard set
 */
'use client';

import TooltipComponent from "@/components/global/tooltip-component";
import { useFlashcardSetTitleEditing } from "@/hooks/flashcard/useFlashcardSetTitleEditing";
import { useClickDifferentiator } from "@/hooks/useClickDifferentiator";
import { selectUserId } from "@/store/selectors/userSelector";
import { RootState } from "@/store/store";
import { ReduxFlashcardSet } from "@/types/state.type";
import clsx from "clsx";
import { Pencil, Trash } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";

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
    
    // Collaborative lock state
    const currentUserId = useSelector(selectUserId);
    const remoteEditing = useSelector((state: RootState) => state.ui.remoteEditing[set._id]);
    const isLockedByRemote = !!(
        remoteEditing &&
        typeof remoteEditing === "object" &&
        remoteEditing.userId !== currentUserId
    );

    const displayedTitle = isLockedByRemote && remoteEditing.tempTitle
        ? remoteEditing.tempTitle
        : set.title;
    
    const { handleMouseClickInterception } = useClickDifferentiator({
        onSingleClickAction: () => {},
        onDoubleClickAction: () => {
            if(!isEditing && !isLockedByRemote) startEditing();
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
               <TooltipComponent
                    className={isLockedByRemote
                        ? "bg-cyan-400 text-cyan-950 font-bold border-none shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                        : ""
                    }
                    message={isLockedByRemote ? `${remoteEditing.username} is editing...` : ''}
               >
                     <span 
                        onClick={(e) => !isLockedByRemote && handleMouseClickInterception(e)}
                        className={clsx(
                            "text-[20px] select-none",
                            isLockedByRemote
                                ? "text-emerald-400 font-semibold italic opacity-90 cursor-not-allowed"
                                : "text-gray-200 cursor-pointer"
                        )}
                    >
                        {displayedTitle}
                    </span>
               </TooltipComponent>
            )}

            {/* Remote-editing pulse dot */}
            {isLockedByRemote && (
                <div className="ml-1 flex-shrink-0 items-center justify-center h-3 w-3
                overflow-hidden">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping inline-flex h-full w-full rounded-full
                        bg-emerald-400 opacity-75 absolute"/>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
                    </span>
                </div>
            )}
            {/* Hover actions: pencil + trash */}
            {!isEditing && !isLockedByRemote && (
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
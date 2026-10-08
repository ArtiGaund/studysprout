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
                    className="text-[lg font-semibold text-white bg-neutral-950 border border-violet-500 rounded-lg px-2 py-0.5 outline-none w-full"
                />
            ) : (
               <TooltipComponent
                    className={isLockedByRemote
                        ? "bg-cyan-950 text-cyan-200 font-mono border border-cyan-800 text-xs"
                        : ""
                    }
                    message={isLockedByRemote ? `${remoteEditing.username} is editing...` : ''}
               >
                     <span 
                        onClick={(e) => !isLockedByRemote && handleMouseClickInterception(e)}
                        className={clsx(
                            "text-lg font-semibold tracking-tight select-none truncate",
                            isLockedByRemote
                                ? "text-emerald-400 italic opacity-90 cursor-not-allowed"
                                : "text-neutral-100 cursor-pointer hover:text-white"
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
                        className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="Rename set"
                    >
                        <Pencil size={12}/>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(set._id);
                        }}
                        className="p-1 rounded-md text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete set"
                    >
                        <Trash size={13}/>
                    </button>
                </div>
            )}
        </div>
    )
}

export default FlashcardSetHeader;
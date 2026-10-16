/**
 * @component FlashcardSheet
 * @description A compact, interactive list item representing a Flashcard Set.
 * Features dynamic "Due" status calculation and optimistic UI feedback.
 * * * Key Features:
 * - Event Propagation Management: Prevents parent click events when deleting.
 * - Reactive "Due" Logic: Recalculates study urgency based on card-level metadata in Redux.
 * - Performance Optimized: Uses `useMemo` to filter through card progress arrays efficiently.
 */
'use client';

import { useFlashcardSetTitleEditing } from "@/hooks/flashcard/useFlashcardSetTitleEditing";
import { useClickDifferentiator } from "@/hooks/useClickDifferentiator";
import { selectUserId } from "@/store/selectors/userSelector";
import { RootState } from "@/store/store";
import clsx from "clsx";
import { Brain, CircleCheck, Pencil, Trash, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import TooltipComponent from "../global/tooltip-component";

// --- Types ---
export interface FlashcardSet{
    _id: string;
    title: string;
    icon?: string;
    resourceType: "Workspace" | "Folder" | "File";
    dueCount: number;
    totalCards: number;
}

const FlashcardSheet = ({
    set,
    onOpen,
    onDelete
}: {
    set:FlashcardSet;
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
}) => {
    // --- State Selection ---
    // Accesses cards directly from the slice to ensure the "Due" count reflects recent study sessions
    const cards = useSelector((state: RootState) =>
         state.flashcard.cardsBySet?.[set._id] ?? []);

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
        typeof remoteEditing === 'object' &&
        remoteEditing.userId !== currentUserId
    );

    // While locked by someone else, show what they're typing instead of the stale title
    const displayedTitle = isLockedByRemote && remoteEditing.tempTitle
        ? remoteEditing.tempTitle
        : set.title;

    const { handleMouseClickInterception } = useClickDifferentiator({
        onSingleClickAction: () => {
            if(!isEditing) onOpen(set._id);
        },
        onDoubleClickAction: () => {
            if(!isEditing) startEditing();
        }
    })

    /**
     * @memoized realDueCount
     * Business logic to determine if a set requires immediate attention.
     * Logic: If a card has no due date or a due date in the past, it's considered 'Due'.
     */
    const realDueCount = useMemo(() => {
        // Treat unknown/undefined dueCount as "all due", not "none due"
        if(cards.length === 0) return set.dueCount ?? set.totalCards;

        return cards.filter(card => {
            const dueDate = card.progress?.dueDate;
            return !dueDate || new Date(dueDate) <= new Date();
        }).length;
    },[
        cards,
        set.dueCount,
        set.totalCards,
    ]);
    
   return(
     <div
        data-editable-container
        onClick={() => !isLockedByRemote && !isEditing && onOpen(set._id)}
        className={clsx(
            "group relative flex justify-between items-center py-2 rounded-xl",
            "overflow-hidden transition-all border border-transparent font-mono",
            isLockedByRemote
                ? "bg-emerald-950/40 border-emerald-500/30 cursor-not-allowed"
                : "cursor-pointer hover:bg-[#110A10] hover:border-white/10"
        )}
        aria-label={`Study ${set.title}`}
    >
        <div className="flex gap-2 items-center flex-1 min-w-0 mr-2">
            {/* Visual Icon & Title */}
            <span>{set.icon || <Brain size={14} className="text-purple-400 shrink-0"/>}</span>

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
                    className="text-xs font-mono text-white bg-[#0A0507] border
                    border-purple-500/50 rounded px-1.5 py-0.5 outline-none w-full max-w-[130px]"
                />
            ) : (
                <TooltipComponent
                    className={isLockedByRemote
                        ? "bg-cyan-950 text-cyan-200 font-mono border border-cyan-800 text-xs"
                        : ""
                    }
                    message={isLockedByRemote ? `${remoteEditing.username} is editing...` : ""}
                >
                    <span 
                        onClick={(e) => !isLockedByRemote && handleMouseClickInterception(e)}
                        className={clsx(
                            "text-xs truncate max-w-[110px] select-none font-medium",
                            isLockedByRemote
                                ? "text-emerald-400 italic opacity-90 cursor-not-allowed"
                                : "text-gray-200 hover:text-white cursor-pointer"
                        )}
                    >
                        {displayedTitle}
                    </span>
                </TooltipComponent>
            )}

            {/* Remote-editing pulse dot */}
            {isLockedByRemote && (
                <div className="ml-2 flex-shrink-0 items-center justify-center h-3 w-3 
                overflow-hidden">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping inline-flex h-full w-full rounded-full
                        bg-emerald-400 opacity-75 absolute"/>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
                    </span>
                </div>
            )}
       
            {/* Urgency Indicators: Fire icon for due cards, Checkmark for completed */}
            {!isEditing && !isLockedByRemote && (realDueCount > 0 ? (
                <span className="text-amber-400 text-[11px] shrink-0 font-mono flex items-center
                gap-1 font-bold ml-auto">
                    <TrendingUp size={12} className="text-amber-400"/> {realDueCount} due
                </span>
            ) 
            : (
                <span className="text-emerald-400 text-[11px] shrink-0 font-mono ml-auto">
                    <CircleCheck size={13} className="text-emerald-400"/>
                </span>)
            )}

            {/* Hover actions: pencil + trash */}
            {!isEditing && !isLockedByRemote && (
                <div
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5
                    transition-all shrink-0 ml-1"
                >   
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            startEditing();
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-white
                         hover:bg-white/10 transition-colors"
                        title="Rename set"
                    >
                        <Pencil 
                            size={12}
                            // className="text-gray-400 hover:text-white"
                        />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(set._id);
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-red-400
                         hover:bg-red-500/10 transition-colors"
                        title="Delete set"
                    >
                        <Trash 
                        size={13}
                        // className="text-gray-400 group-hover:text-red-400"
                        />
                    </button>
                </div>
            )}
            
        </div>
    </div>
   )
}

export default FlashcardSheet;
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
import { RootState } from "@/store/store";
import { Brain, CircleCheck, Pencil, Trash, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";

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
        // Fallback to the set's initial count if local card data hasn't synced yet
        if(cards.length === 0) return set.dueCount;

        return cards.filter(card => {
            const dueDate = card.progress?.dueDate;
            return !dueDate || new Date(dueDate) <= new Date();
        }).length;
    },[
        cards,
        set.dueCount
    ]);
    
   return(
     <div
        onClick={() => onOpen(set._id)}
        className="group relative flex justify-between items-center py-2 cursor-pointer rounded hover:bg-white/5 overflow-visible transition-colors"
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
                    className="text-[12px] font-medium text-white bg-zinc-900 border
                    border-purple-500/50 rounded px-1.5 py-0.5 outline-none w-full max-w-[130px]"
                />
            ) : (
                <span 
                    onClick={handleMouseClickInterception}
                    className="text-[12px] text-gray-200 truncate max-w-[110px] cursor-pointer
                    select-none"
                >
                    {set.title}
                </span>
            )}
       
            {/* Urgency Indicators: Fire icon for due cards, Checkmark for completed */}
            {!isEditing && (realDueCount > 0 ? (
                <span className="text-red-400 text-[11px] shrink-0 font-extrabold flex items-center
                gap-1">
                    <TrendingUp size={12} className="text-red-400"/> {realDueCount} due
                </span>
            ) 
            : (
                <span className="text-green-400 text-[11px] shrink-0 font-extrabold">
                    <CircleCheck size={13} className="text-green-400 shrink-0"/>
                </span>)
            )}

            {/* Hover actions: pencil + trash */}
            {!isEditing && (
                <div
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5
                    transition-all shrink-0"
                >   
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            startEditing();
                        }}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Rename set"
                    >
                        <Pencil 
                            size={12}
                            className="text-gray-400 hover:text-white"
                        />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(set._id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 transition-colors"
                        title="Delete set"
                    >
                        <Trash 
                        size={13}
                        className="text-gray-400 group-hover:text-red-400"
                        />
                    </button>
                </div>
            )}
            
        </div>
    </div>
   )
}

export default FlashcardSheet;
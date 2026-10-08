/**
 * @component FlashcardProgressList
 * @description An analytics and navigation sub-component for the Spaced Repetition System (SRS).
 * It categorizes flashcards based on their 'Due Date' and visualizes study progress.
 * * * Key Logic:
 * - SRS Logic: Automatically separates cards into 'TODO' (due now or new) and 'COMPLETED' (reviewed).
 * - Reactive Progress: Uses a timed useEffect to trigger a smooth progress bar animation on mount.
 * - Optimized Selection: Leverages Redux state to fetch only the cards relevant to the specific set ID.
 * - UX/UI: Implements a 'Popover + ScrollArea' pattern to keep the main interface clean while providing deep-dive card lists.
 */

'use client';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RootState } from "@/store/store";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface FlashcardProgressListProps{
    setId: string;
    onSelect: (id:string) => void;
}
const FlashcardProgressList: React.FC<FlashcardProgressListProps> = ({
    setId,
    onSelect
}) => {
    const [progress, setProgress ] = useState(0);

    // --- State Selection ---
    // Efficiently pulls cards for this specific set from the Redux store
    const cards = useSelector((state: RootState) => state.flashcard.cardsBySet?.[setId] ?? []);

    //  --- Spaced Repetition Logic (SRS) ---
    // Determining which cards require immediate attention based on the current timestamp
    const today = new Date();
    const todo = cards.filter(card => {
        const dueDate = card.progress?.dueDate 
        ? new Date(card.progress.dueDate)
        : today
        return dueDate && dueDate <= today;
    });
    const completed = cards.filter(card => {
        const dueDate = card.progress?.dueDate
        ? new Date(card.progress.dueDate)
        : null;
        return dueDate && dueDate > today;
    });

    const total = cards.length;

    /**
     * @effect ProgressAnimation
     * Calculates completion percentage and applies a slight delay to trigger 
     * the CSS transition of the Progress component for a polished feel.
     */
    useEffect(() => {
        if(total == 0) return;
        const percent = (completed.length / total)*100;
        const timer = setTimeout(() => setProgress(percent), 100);
        return () => clearTimeout(timer);
    },[
        completed,
        total
    ])
    return (
        <div className="flex flex-col gap-3 py-3 px-1">
            <Progress value={progress} className="w-full bg-neutral-800 h-1.5"/>
            
            <div className="flex items-center justify-between text-xs font-mono">
                {/* TODO POPOVER  */}
                {/* Giving the modal to popover because scrollable area was not scrollable if added with the popover */}
                <Popover modal>
                    <PopoverTrigger
                    className="font-semibold text-amber-400 hover:text-amber-300 transition-colors tracking-wide"
                    >
                        TODO ({todo.length})
                    </PopoverTrigger>
                    <PopoverContent
                    className="w-[260px] bg-neutral-900 border-neutral-800 p-2 rounded-xl shadow-xl"
                    >
                        {todo.length === 0 && (
                            <p className="text-xs text-neutral-500 font-mono p-2">
                                No cards remaining.
                            </p>
                        )}
                        <ScrollArea 
                        className="h-[160px] w-full rounded-md"
                        >
                            <div className="p-1 space-y-1.5">
                                {todo.map((card) => {
                                    const isNew = !card.progress?.dueDate;
                                    return (
                                    <div
                                    key={card._id}
                                    onClick={() => onSelect(card._id)}
                                    className={`
                                        p-2 rounded-lg cursor-pointer text-xs border-l-2 transition-all
                                        ${isNew 
                                            ? `bg-violet-950/30 border-violet-500 hover:bg-violet-900/40 text-neutral-200` 
                                            : `bg-amber-950/20 border-amber-500 hover:bg-amber-900/30 text-neutral-200`}
                                        `}
                                    >
                                       <span className="line-clamp-2"> 
                                        {card.question.slice(0,50)}...
                                       </span>
                                    </div>
                                )})}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>

                 {/* Completed POPOVER  */}
                {/* Giving the modal to popover because scrollable area was not scrollable if added with the popover */}
                <Popover modal>
                    <PopoverTrigger
                    className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors tracking-wide"
                    >
                        COMPLETED ({completed.length})
                    </PopoverTrigger>
                    <PopoverContent
                    className="w-[260px] bg-neutral-900 border-neutral-800 p-2 rounded-xl shadow-xl"
                    >
                        {completed.length === 0 && (
                            <p className="text-xs text-neutral-500 font-mono p-2">
                                No cards completed.
                            </p>
                        )}
                        <ScrollArea 
                        className="h-[160px] w-full rounded-md"
                        >
                            <div className="p-2">
                                {completed.map((card) => (
                                    <div
                                    key={card._id}
                                    onClick={() => onSelect(card._id)}
                                    className="p-2 bg-neutral-950/50 border-l-2 border-emerald-500 hover:bg-emerald-950/20 rounded-lg cursor-pointer text-xs transition-all"
                                    >
                                        <span className="text-eutral-500 line-through line-clamp-2">
                                        {card.question.slice(0,50)}...
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default FlashcardProgressList;
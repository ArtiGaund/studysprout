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
        <div className="flex flex-col gap-3 py-3">
            <Progress value={progress} className="w-full"/>
            
            <div className="flex items-center justify-between mt-3">
                {/* TODO POPOVER  */}
                {/* Giving the modal to popover because scrollable area was not scrollable if added with the popover */}
                <Popover modal>
                    <PopoverTrigger
                    className="text-sm font-medium text-purple-300 hover:text-purple-100"
                    >
                        TODO ({todo.length})
                    </PopoverTrigger>
                    <PopoverContent
                    className="w-[250px] bg-[#1c1c1c] border-gray-700 p-2 rounded-lg"
                    >
                        {todo.length === 0 && (
                            <p className="text-xs text-gray-400">No cards remaining.</p>
                        )}
                        <ScrollArea 
                        className="h-[150px] w-full rounded-md"
                        >
                            <div className="p-2">
                                {todo.map((card) => {
                                    const isNew = !card.progress?.dueDate;
                                    return (
                                    <div
                                    key={card._id}
                                    onClick={() => onSelect(card._id)}
                                    className={`
                                        p-2 mb-1 rounded cursor-pointer text-[12px] border-l-4 transition
                                        ${isNew 
                                            ? `bg-blue-900/20 border-blue-500 hover:bg-blue-900/40` 
                                            : `bg-orange-900/20 border-orange-500 hover:bg-blue-900/40`}
                                        `}
                                    >
                                       <span className="text-gray-300"> 
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
                    className="text-sm font-medium text-purple-300 hover:text-purple-100"
                    >
                        COMPLETED ({completed.length})
                    </PopoverTrigger>
                    <PopoverContent
                    className="w-[250px] bg-[#1c1c1c] border-gray-700 p-2 rounded-lg"
                    >
                        {completed.length === 0 && (
                            <p className="text-xs text-gray-400">No cards completed.</p>
                        )}
                        <ScrollArea 
                        className="h-[150px] w-full rounded-md"
                        >
                            <div className="p-2">
                                {completed.map((card) => (
                                    <div
                                    key={card._id}
                                    onClick={() => onSelect(card._id)}
                                    className="p-2 mb-1 bg-gray-900/10 border-l-4 border-green-600 hover:bg-green-900/20 rounded cursor-pointer text-[12px]"
                                    >
                                        <span className="text-gray-400 line-through">
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
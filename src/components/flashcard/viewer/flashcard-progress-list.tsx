/**
 * This component is the bottom part of the flashcard set.
 * 
 * - It shows the progress bar to show the progress of the flashcard set.
 * - It shows the list of todo and completed flashcards list, which can be clicked to open the flashcard viewer.
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

    const cards = useSelector((state: RootState) => state.flashcard.cardsBySet?.[setId] ?? []);

    const today = new Date();
    const todo = cards.filter(card => new Date(card.dueDate)<=today);
    const completed = cards.filter(card => new Date(card.dueDate) > today);

    const total = cards.length;

    
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
                                {todo.map((card) => (
                                    <div
                                    key={card._id}
                                    onClick={() => onSelect(card._id)}
                                    className="p-2 mb-1 bg-gray-800 hover:bg-gray-700 rounded cursor-pointer text-[12px]"
                                    >
                                        {card.question.slice(0,50)}...
                                    </div>
                                ))}
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
                                    className="p-2 mb-1 bg-gray-800 hover:bg-gray-700 rounded cursor-pointer text-[12px]"
                                    >
                                        {card.question.slice(0,50)}...
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
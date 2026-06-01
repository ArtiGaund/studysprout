'use client';

import { ReduxFlashcardSet } from "@/types/state.type";
import { PlayCircle, TrendingUp } from "lucide-react";

interface MasterySetCardProps{
    currentFlashcardSet: ReduxFlashcardSet;
    onClick?: () => void;
}
export const MasterySetCard = ({
    currentFlashcardSet,
    onClick
}: MasterySetCardProps) => {

    const totalCards = currentFlashcardSet.totalCards ?? 0;
    const dueCount = currentFlashcardSet.dueCount ?? 0;
    const resourceType = currentFlashcardSet.resourceType ?? "Folder";
    return(
        <div className="bg-[#161616] border border-white/5 rounded-xl px-3 py-2.5 flex flex-col 
        gap-y-2 group hover:border-purple-500/30 transition-all cursor-pointer">
            <div className="flex justify-between items-center gap-x-2">
                <h3 className="text-[12px] font-bold text-white truncate leading-snug">
                    {currentFlashcardSet.title}
                </h3>
                <PlayCircle className="w-4 h-4 text-purple-400 group-hover:text-purple-300 
                transition-colors shrink-0" />
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[75%] 
                shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
            </div>

            <div className="text-[10px] text-zinc-500 flex flex-wrap items-center gap-x-1
            w-full min-w-0 select-none">
                <span className="shrink-0">{totalCards} Cards</span>
                <span className="text-zinc-600 font-normal"> • </span>
                <span className="capitalize shrink-0">
                    {resourceType.toLowerCase()} Synthesis
                </span>
                {dueCount > 0 && (
                    <span className="text-red-400 font-medium flex items-center gap-x-0.5
                    shrink-0 ml-auto sm:ml-0">
                        <span className="text-zinc-600 font-normal mr-0.5 hidden sm:inline"> 
                            • 
                        </span>
                        <TrendingUp size={11} className="shrink-0"/>
                        <span>{dueCount} due</span>
                    </span>
                )}
            </div>
        </div>
    )
}
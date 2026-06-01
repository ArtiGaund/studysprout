'use client';

import { Check, ChevronRight, FileText, Flame, Folder, TrendingUp } from "lucide-react";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { ReduxFlashcardSet } from "@/types/state.type";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useMemo } from "react";

interface ChildrenFlashcardSetListProps{
    resourceType: string;
    childrenFlashcardSets: ReduxFlashcardSet[];
    onSelect?: (set: ReduxFlashcardSet) => void;
}

const ChildSetRow = ({
    set,
    onSelect,
}: {
    set: ReduxFlashcardSet;
    onSelect?: (set: ReduxFlashcardSet) => void;
}) => {
    const Icon = set.resourceType === "Folder" ? Folder : FileText;

    const cards = useSelector(
        (state: RootState) => state.flashcard.cardsBySet?.[set._id] ?? []
    );

    const realDueCount = useMemo(() => {
        if(cards.length === 0) return set.dueCount;

        return cards.filter(card => {
            const dueDate = card.progress?.dueDate;
            return !dueDate || new Date(dueDate) <= new Date();
        }).length;
    },[
        cards,
        set.dueCount,
    ]);

    return (
         <div
            onClick={() => onSelect?.(set)}
            className="group flex items-center justify-between p-3 rounded-xl bg-[#1c1c1c] 
            border border-white/0 hover:border-white/5 transition-all duration-150 
            cursor-pointer"
        >
            <div className="flex items-center gap-x-3 min-w-0">
                {/* Left Icon Badge */}
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-normal
                    text-gray-400 group-hover:bg-purple-900/20 group-hover:text-purple-400 
                     transition-colors shrink-0">
                    <Icon size={16}/>
                </div>

                {/* Main Context Texts */}
                <div className="flex flex-col min-w-0">
                    <h4 className="text-[13px] font-medium text-gray-200 truncate
                    group-hover:text-white transition-colors">
                        {set.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 flex items-center gap-x-1 mt-0.5
                    min-w-0 w-full">
                        <span className="shrink-0">
                             {set.totalCards} cards
                        </span>
                       
                        {realDueCount > 0 ? (
                            <span className="font-bold flex items-center gap-x-0.5 shrink-0"> 
                            <span className="text-gray-500 font-normal mx-0.5">·</span>
                            <TrendingUp size={14} className="text-red-400 shrink-0"/>
                            <span className="text-red-400">{realDueCount} due</span>
                            </span>
                        ):( 
                            <span className="font-bold flex items-center gap-x-0.5 shrink-0">
                                <span className="text-gray-500 font-normal mx-0.5">·</span>
                                <Check size={14} className="text-green-400 shrink-0"/> 
                                <span className="text-green-400">all done</span>
                            </span>)
                        }
                    </p>
                </div>
            </div>

            {/* Chevron Entry Accent */}
            <ChevronRight 
                size={14}
                className="text-gray-600 group-hover:text-gray-400 
                group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
            />
        </div>
    )
}
export const ChildrenFlashcardSetList = ({
    resourceType,
    childrenFlashcardSets,
    onSelect,
}: ChildrenFlashcardSetListProps) => {
    const { setRevisionSidebarOpen } = useRevisionSidebar();

    if(!childrenFlashcardSets || childrenFlashcardSets.length === 0) return null;

    const visible = childrenFlashcardSets.slice(0,2);
    const hasMore = childrenFlashcardSets.length > 2;

    return (
       <div className="pt-3 border-t border-white/5 flex flex-col gap-y-1.3">
            {/* Context Header */}
            <div className="flex items-center justify-between w-full mb-2 px-1">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                    {resourceType}-Collections ({childrenFlashcardSets.length})
                </span>
                {hasMore && (
                    <button
                        onClick={() => setRevisionSidebarOpen(true)}
                        className="text-[9px] text-zinc-500 hover:text-purple-400 
                        transition-colors flex items-center gap-x-0.5 bg-transparent border-none
                        p-0 cursor-pointer"
                    >
                        View All
                        <ChevronRight size={12}/>  
                    </button>
                )}
               
            </div>

            <div className="flex flex-col gap-2">
            {/* List Wrapper */}
            {visible.map((set) => (
                <ChildSetRow 
                    key={set._id}
                    set={set}
                    onSelect={onSelect}
                />
            ))}
            </div>
       </div>
    )
}
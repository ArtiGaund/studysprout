'use client';

import { Trash } from "lucide-react";

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
   return(
     <div
    onClick={() => onOpen(set._id)}
    className="group flex justify-between items-center py-2 cursor-pointer rounded hover:bg-muted"
    >
        <div className="flex gap-2 items-center flex-1 min-w-0">
            <span>{set.icon || "🧠"}</span>
            <span className="text-[12px] text-gray-200 truncate max-w-[120px]">{set.title}</span>
            {set.dueCount > 0 ? (
                <span className="text-red-400 text-[11px] shrink-0 font-extrabold mr-4">
                    🔥 {set.dueCount} due
                </span>
            ) 
            : (
                <span className="text-green-400 text-[11px] shrink-0 font-extrabold mr-4">
                    ✓ {set.dueCount} due
                </span>
            )}
        </div>
        <Trash 
        onClick={(e) => {
                e.stopPropagation();
                onDelete(set._id);
            }}
            size={15}
            className="hover:text-white text-Neutrals/neutrals-7 transition-colors"
        />
    </div>
   )
}

export default FlashcardSheet;
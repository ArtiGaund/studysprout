'use client';

import { ReduxFile } from "@/types/state.type";
import { FileText, ListFilter, MoreVertical, Search } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const FolderFileList = (
    { 
        folderId,
        files 
    }: { 
        folderId: string;
        files: ReduxFile[];
    }) => {
    const [ isExpanded, setIsExpanded ] = useState(false);

    // Limit the initial view to 4 files
    const INIT_VISIBLE_COUNT = 4;
    const remainingCount = files.length - INIT_VISIBLE_COUNT;
    const displayFiles = isExpanded 
        ? files
        : files.slice(0, INIT_VISIBLE_COUNT); 

    return (
        <div className="flex flex-col gap-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-x-4 items-stretch sm:items-center">
                <div className="flex-1 relative">
                    <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                    />
                    <input 
                    placeholder="Search files in this folder..."
                    className="w-full bg-[#161616] border border-white/5 rounded-lg py-2 pl-10
                    pr-4 text-sm outline-none focus:border-purple-500/50"
                    />
                </div>
                <button
                className="px-4 py-2 bg-[#161616] border border-white/5 rounded-lg text-sm
                font-medium flex items-center gap-x-2"
                >   
                    <ListFilter 
                    size={16}
                    /> Filter
                </button>
            </div>

            {/* File List */}
            <div className="flex flex-col gap-y-3">
                {/* Scrollable Container */}
                <div className={twMerge(
                    "flex flex-col gap-y-3 transition-all duration-300 ease-in-out custom-scrollbar",
                    isExpanded 
                        ? "max-h-[420px] overflow-y-auto p-4 bg-black/20 rounded-xl inner-shadow-inset border border-white/5" 
                        : "max-h-none overflow-hidden"
                )}>
                    {displayFiles.map((file) => (
                        <div
                        key={file._id}
                        className={twMerge(
                            "bg-[#161616] border border-white/5 p-4 rounded-xl flex items-center",
                            "justify-between group transition-all",
                            isExpanded ? "hover:bg-[#1c1c1c] scale-[0.99] hover:scale-100" : ""
                        )}
                        >
                            <div className="flex items-center gap-x-4">
                                <div className="w-10 h-10 bg-zinc-800 rounded flex items-center
                                justify-center">
                                    <FileText 
                                    size={20}
                                    className="text-zinc-400"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white italic">
                                        {file.title}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold
                                    tracking-tight mt-1">
                                        FILE CREATED AT: {file.createdAt}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-x-3 sm:gap-x-8">
                                <div className="flex flex-col items-end gap-y-1">
                                    <span className="hidden sm:block text-[10px] text-zinc-600
                                     font-bold uppercase">
                                        Complexity
                                    </span>
                                    <div className="flex gap-x-1">
                                        <div className="w-4 h-1 bg-purple-500 rounded-full"/>
                                        <div className="w-4 h-1 bg-purple-500 rounded-full"/>
                                        <div className="w-4 h-1 bg-zinc-800 rounded-full"/>
                                    </div>
                                </div>
                                <MoreVertical 
                                size={16}
                                className="text-zinc-600 cursor-pointer"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Show More Button - Only visible if there are more than 4 files */}
                <div className="flex flex-col items-center mt-2">
                    {!isExpanded && remainingCount > 0 ? (
                    <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full py-3 border-t border-dashed border-zinc-800 text-[11px]
                    font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Show More Files ({remainingCount})
                    </button>
                ) : isExpanded ?  (
                    <button
                    onClick={() => setIsExpanded(false)}
                    className="text-[10px] text-zinc-600 hover:text-zinc-400 self-center
                    uppercase font-bold tracking-widest mt-2"
                    >
                        Show Less
                    </button>
                ) : null}

                </div>
            </div>
        </div>
    )
}
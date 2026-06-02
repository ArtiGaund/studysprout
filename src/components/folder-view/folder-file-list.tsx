'use client';

import { useClickDifferentiator } from "@/hooks/useClickDifferentiator";
import { useUser } from "@/lib/providers/user-provider";
import { ReduxFile } from "@/types/state.type";
import { ArrowDown, ArrowUp, FileText, ListFilter, MoreVertical, Pencil, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { File as MongooseFile } from "@/model/file.model";
import { useFile } from '@/hooks/useFile'
import { useToast } from '@/components/ui/use-toast'
import { MARK_ACTIVITY_STALE } from '@/store/slices/activitySlice'
import { useDispatch } from "react-redux";
import { useTitleEditing } from "@/hooks/useTitleEditing";


interface FileRowItemProps{
    file: ReduxFile;
    searchQuery: string;
    workspaceId: string;
    folderId: string;
}

const FileRowItem = ({
    file,
    searchQuery,
    workspaceId,
    folderId,
}: FileRowItemProps) => {
    const router = useRouter();
    const [ isEditingLocally, setIsEditingLocally ] = useState(false);
    const { user } = useUser();
    const { updateFile } = useFile();
    const { toast } = useToast();
    const dispatch = useDispatch();
    
    const handleEditingStop = useCallback(() => {
        setIsEditingLocally(false);
    },[]) 

    const {
        isCurrentlyEditingThisItem: isEditing,
        displayedTitle,
        handleStartEditing: handleStartEditingFromHook,
        handleKeyDown,
        handleTitleChange,
        inputRef,
        handleInputBlur,
        handleInputFocus,
    } = useTitleEditing({
        id: file._id,
        dirType: "file",
        originalTitle: file.title,
        isEditingLocally: isEditingLocally,
        onEditingStop: handleEditingStop
    })

    const startEditing = useCallback(() => {
        setIsEditingLocally(true);
        handleStartEditingFromHook();
    },[handleStartEditingFromHook]);

    const handleMoveToTrash = async(e: React.MouseEvent) => {
            e.stopPropagation();
            const username = user?.username;
            const trashValue = `Deleted by ${username}`;
            const updatedFile:Partial<MongooseFile> = {
                inTrash: trashValue
            }
            try {
                const result = await updateFile(file._id, updatedFile);
                 if(!result.success){ // Check result.success for hook's return
                    toast({
                        title: "Failed to move file to trash ",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                } else {
                    dispatch(MARK_ACTIVITY_STALE());  
                    toast({
                        title: "File moved to trash successfully",
                        description: "Keep it safe",
                        })
                }
            } catch (error) {
                console.error("Error while moving file to the trash", error)
                toast({
                    title: "Error while moving file to the trash ",
                    description: "Please try again later",
                    variant: "destructive"
                })
            }
        }

    // Integrated click interception dispatcher
    const { handleMouseClickInterception } = useClickDifferentiator({
        onSingleClickAction: () => {
            router.push(`/dashboard/${workspaceId}/${folderId}/${file._id}`);
        },
        onDoubleClickAction: () => {
            startEditing();
        }
    });

    const highlightTitle = (title: string) => {
        if(!searchQuery) return title;
        const parts = title.split(new RegExp(`(${searchQuery})`, 'gi'));
        return parts.map((part, i) => 
            part.toLowerCase() === searchQuery.toLowerCase()
                ? <span 
                    key={i}
                    className="bg-purple-500/40 text-purple-200 rounded px-1 py-0.5"
                    >
                        {part}
                    </span>
                : part
        )
    };

    return (
        <div
            onClick={handleMouseClickInterception}
            className="bg-[#161616] border border-white/5 p-4 rounded-xl flex items-center
            justify-between group transition-all hover:bg-[#1c1c1c] cursor-pointer select-none"
        >
            <div className="flex items-center gap-x-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center
                shrink-0">
                    <FileText size={20} className="text-zinc-400"/>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    {isEditing ? (
                        <input 
                            ref={inputRef}
                            value={typeof displayedTitle === "string" ? displayedTitle : file.title}
                            readOnly={false}
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()} 
                            onBlur={handleInputBlur}
                            onFocus={handleInputFocus} 
                            onChange={handleTitleChange}
                            onKeyDown={handleKeyDown}
                            className="text-sm font-bold text-white bg-zinc-900 outline-none
                            border border-purple-500/50 rounded px-2 py-0.5 w-full"
                        />
                    ) : (
                        <span className="text-sm font-bold text-white italic truncate">
                            {highlightTitle(file.title)}
                        </span>
                    )}
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight
                    mt-1">
                        FILE CREATED AT: {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-x-2 flex-shrink-0 ml-3">
                    {/* To edit the title */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            startEditing();
                        }}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-white 
                        hover:bg-zinc-700 transition-all flex sm:opacity-0 
                        sm:group-hover:opacity-100 opacity-100"
                    >
                        <Pencil size={14}/>
                    </button>
                    {/* Trash */}
                    <button
                        onClick={handleMoveToTrash}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 
                        hover:bg-red-400/10 transition-all flex sm:opacity-0 
                        sm:group-hover:opacity-100 opacity-100"
                    >
                        <Trash2 size={14}/>
                    </button>
            </div>
        </div>
    )
}

export const FolderFileList = ({ 
    workspaceId,
    folderId,
    files,
    onRename, 
}: { 
    workspaceId: string;
    folderId: string;
    files: ReduxFile[];
    onRename?: (fileId: string, newTitle: string) => void;
}) => {
    const [ isExpanded, setIsExpanded ] = useState(false);
    const [ searchQuery, setSearchQuery ] = useState("");
    const [ sortOrder, setSortOrder ] = useState<"recent" | "oldest">("recent");

    // Filter by search query
    const searchedFiles = useMemo(() => {
        return files.filter(file => 
            file.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    },[
        files,
        searchQuery,
    ]);

    // Sort by creation data
    const filteredFiles = useMemo(() => {
        const filesToSort = [ ...searchedFiles];
        filesToSort.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            if(sortOrder === "recent"){
                return dateB - dateA;
            }else{
                return dateA - dateB;
            }
        });
        return filesToSort;
    },[
        searchedFiles,
        sortOrder,
    ]);

    // Limit the initial view to 4 files
    const INIT_VISIBLE_COUNT = 4;
    const remainingCount = filteredFiles.length - INIT_VISIBLE_COUNT;
    const displayFiles = isExpanded 
        ? filteredFiles
        : filteredFiles.slice(0, INIT_VISIBLE_COUNT); 

    const toggleSort = () => {
        setSortOrder(sortOrder === "recent" ? "oldest" : "recent");
    };

    return (
        <div className="flex flex-col gap-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-x-4 items-stretch 
            sm:items-center">
                <div className="flex-1 relative">
                    <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                    />
                    <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files in this folder..."
                    className="w-full bg-[#161616] border border-white/5 rounded-lg py-2 pl-10
                    pr-4 text-sm outline-none focus:border-purple-500/50"
                    />
                </div>
                <button
                onClick={toggleSort}
                className="px-4 py-2 bg-[#161616] border border-white/5 rounded-lg text-sm
                font-medium flex items-center gap-x-2"
                >   
                    <ListFilter size={16}/>
                    {sortOrder === "recent" ? (
                        <>
                            <ArrowDown size={14}/> Recent
                        </>
                    ) : (
                        <>
                            <ArrowUp size={14}/> Oldest
                        </>
                    )} 
                </button>
            </div>

            {/*File Count or No Results  */}
            {searchQuery && (
                <div className="text-[12px] text-zinc-500">
                    {filteredFiles.length > 0 
                        ? `Found ${filteredFiles.length} file${filteredFiles.length !== 1 ? "s": ""}`
                        : `No such file exists`
                    }
                </div>
            )}

            {/* File List */}
            <div className="flex flex-col gap-y-3">
                {/* Scrollable Container */}
                <div className={twMerge(
                    "flex flex-col gap-y-3 transition-all duration-300 ease-in-out custom-scrollbar",
                    isExpanded 
                        ? "max-h-[420px] overflow-y-auto p-4 bg-black/20 rounded-xl inner-shadow-inset border border-white/5" 
                        : "max-h-none overflow-hidden"
                )}>
                    {displayFiles.length > 0 ? (
                        displayFiles.map((file) => (
                            <FileRowItem 
                                key={file._id}
                                file={file}
                                searchQuery={searchQuery}
                                workspaceId={workspaceId}
                                folderId={folderId}
                            />
                    ))
                    ): (
                        <div className="text-center py-8 text-zinc-500">
                            {searchQuery 
                                ? "No files match your search"
                                : "No files in this folder yet."
                            }
                        </div>
                    )}
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
'use client';

import { Briefcase, Pencil, PlusIcon, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useFolder } from "@/hooks/useFolder";
import { useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { useToast } from "../ui/use-toast";
import { useWorkspaceStats } from "@/hooks/useStats";
import { useCallback, useState } from "react";
import { useTitleEditing } from "@/hooks/useTitleEditing";
import { useClickDifferentiator } from "@/hooks/useClickDifferentiator";

export const SystemOverviewHeader = ({workspaceId}: { workspaceId: string}) => {
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const { createFolder } = useFolder();
    const { toast } = useToast()
    const { stats } = useWorkspaceStats(workspaceId);

    const [ isEditingLocally, setIsEditingLocally ] = useState(false);

    const handleEditingStop = useCallback(() => {
        setIsEditingLocally(false);
    },[]);

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
        id: workspaceId,
        dirType: "workspace",
        originalTitle: currentWorkspace?.title || "Workspace Dashboard",
        isEditingLocally,
        onEditingStop: handleEditingStop,
    });

    const startEditing = useCallback(() => {
        setIsEditingLocally(true);
        handleStartEditingFromHook();
    },[handleStartEditingFromHook]);

    const { handleMouseClickInterception } = useClickDifferentiator({
        onSingleClickAction: () => {},
        onDoubleClickAction: () => {
            if(!isEditing) startEditing();
        },
    });
    
    const velocityPercent = stats?.velocityPercent ?? null;
    const velocityText = velocityPercent === null 
        ? "Not enough data to calculate velocity yet"
        : velocityPercent === 0
            ? "Your research velocity is the same as last week"
            : velocityPercent > 0
                ? <p className="text-zinc-400 text-xs font-mono">
                        Your research velocity is up <span className="text-purple-400 
                        font-semibold">
                            {velocityPercent}%
                        </span> this week.
                  </p>
                : <p className="text-zinc-400 text-xs font-mono">
                        Your research is down <span className="text-red-400 font-semibold">
                            {Math.abs(velocityPercent)}$
                        </span> this week
                  </p>;

    const addFolderHandler = async () => {
        if(!currentWorkspace?._id) return;
        try {
            const folder = await createFolder(currentWorkspace?._id);
            if(!folder.success){
                toast({
                    title: "Failed to create folder",
                    description: "Please try again later",
                    variant: "destructive"
                });
            }else {
                toast({
                    title: "Successfully created folder",
                    description: "You can now add files to this folder",
                });
            }
        } catch (error) {
            console.warn("Error while creating a folder in workspace ",error);
            toast({
                title: "Failed to create folder",
                description: "Please try again later",
                variant: "destructive"
            });
        }  
    }

    return(
        <div className="flex flex-row flex-wrap justify-between items-end w-full mb-6 gap-y-4">
            {/* Left Section: Title and Subtitle */}
            <div className="flex items-start gap-x-4 min-w-0 flex-1 group">

                {/* Workspace Icon Container */}
                <div className="text-3xl sm:text-4xl text-purple-400 shrink-0 select-none flex 
                item-center justify-center bg-[#110A10] p-2.5 rounded-xl border
                 borderwhite/10 mt-1 shadow-sm">
                    {currentWorkspace?.iconId || <Briefcase size={16}/>}
                </div>

                {/* Text Column: Vertical stacked layout for Title Row + Subtitle */}
                <div className="flex flex-col min-w-0 flex-1 gap-y-1">

                    {/* Title Row containing heading, pencil and trash */}
                    <div
                        onClick={handleMouseClickInterception}
                        className="flex items-center gap-x-3 w-full min-w-0 py-1"
                    >
                        {isEditing ? (
                            <input 
                                ref={inputRef}
                                value={typeof displayedTitle === "string" ? displayedTitle : ''}
                                onChange={handleTitleChange}
                                onBlur={handleInputBlur}
                                onFocus={handleInputFocus}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                                className="text-2xl sm:text-3xl font-bold text-white bg-[#110A10]
                                outline-none border border-purple-500/50 rounded-xl px-3 py-1
                                w-full max-w-xl cursor-text focus:ring-1 focus:ring-purple-500"
                            />
                        ) : (
                            <>
                                <h1 className="text-2xl sm:text-3xl font-mono text-white 
                                tracking-tight truncate cursor-pointer max-w-max leading-none">
                                    {String(displayedTitle) || currentWorkspace?.title || "System Overview"}
                                </h1>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(!isEditing) startEditing();
                                    }}
                                    className="p-1.5 rounded-md text-zinc-500 hover:text-purple-300 hover:bg-purple-950/30 transition-all flex sm:opacity-0 sm:group-hover:opacity-100
                                    opacity-100 shrink-0 cursor-pointer border border-transparent hover:border-purple-500/20"
                                >
                                    <Pencil size={16}/>
                                </button>

                                <button
                                    className="p-1.5 rounded-md text-red-500 hover:text-red-300 hover:bg-red-950/30 transition-all flex sm:opacity-0 sm:group-hover:opacity-100
                                    opacity-100 shrink-0 cursor-pointer border border-transparent hover:border-red-500/20"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </>
                        )}
                    </div>
                    {typeof velocityText === "string"
                        ? <p className="text-zinc-500 text-xs font-mono">
                            {velocityText}
                        </p>
                        : velocityText
                    }
                </div>                
            </div>
            {/* Right Section: Action Button */}
            <div className="shrink-0 self-end">
               <Button
                    onClick={addFolderHandler}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-medium 
                    text-xs font-mono py-2 px-4 rounded-lg flex items-center gap-x-2 
                    transition-all shadow-md shadow-purple-950/40 border border-purple-400/20"
               >
                    <PlusIcon size={18} strokeWidth={3}/>
                    <span>New Folder</span>
               </Button>
            </div>
        </div>
    );
}
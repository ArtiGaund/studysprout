'use client';

import { Briefcase, Pencil, PlusIcon, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useFolder } from "@/hooks/useFolder";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { useToast } from "../ui/use-toast";
import { useWorkspaceStats } from "@/hooks/useStats";
import { useCallback, useState } from "react";
import { useTitleEditing } from "@/hooks/useTitleEditing";
import { useUser } from "@/lib/providers/user-provider";
import { useClickDifferentiator } from "@/hooks/useClickDifferentiator";

export const SystemOverviewHeader = ({workspaceId}: { workspaceId: string}) => {

    const { user } = useUser();
    const dispatch = useDispatch();
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const { createFolder } = useFolder();
    const { toast } = useToast()
    const { loading, stats } = useWorkspaceStats(workspaceId);

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
                ? <p className="text-zinc-500 text-sm font-medium">
                        Your research velocity is up <span className="text-purple-400">
                            {velocityPercent}%
                        </span> this week.
                  </p>
                : <p className="text-zinc-500 text-sm font-medium">
                        Your research is down <span className="text-red-400">
                            {Math.abs(velocityPercent)}$
                        </span> this week
                  </p>

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
                item-center justify-center bg-zinc-800/30 p-2.5 rounded-xl border
                 border-white/5 mt-1">
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
                                className="text-2xl sm:text-3xl font-bold text-white bg-zinc-900
                                outline-none border border-purple-500/50 rounded-xl px-3 py-1
                                w-full max-w-xl cursor-text"
                            />
                        ) : (
                            <>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white 
                                tracking-tight truncate cursor-pointer max-w-max leading-none">
                                    {String(displayedTitle) || currentWorkspace?.title || "System Overview"}
                                </h1>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(!isEditing) startEditing();
                                    }}
                                    className="p-1.5 rounded-md text-zinc-500 hover:text-white
                                    hover:bg-zinc-800 transition-all flex sm:opacity-0 sm:group-hover:opacity-100
                                    opacity-100 shrink-0 cursor-pointer"
                                >
                                    <Pencil size={16}/>
                                </button>

                                <button
                                    className="p-1.5 rounded-md text-red-500 hover:text-white
                                    hover:bg-red-400 transition-all flex sm:opacity-0 sm:group-hover:opacity-100
                                    opacity-100 shrink-0 cursor-pointer"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </>
                        )}
                    </div>
                    {typeof velocityText === "string"
                    ? <p className="text-zinc-500 text-sm font-medium">
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
                className="bg-[#B794F4] hover:bg-[#9F7AEA] text-black font-bold py-2 px-4
                rounded-lg flex items-center gap-x-2 transition-all shadow-lg shadow-purple-500/20"
               >
                    <PlusIcon size={18} strokeWidth={3}/>
                    <span>New Folder</span>
               </Button>
            </div>
        </div>
    )
}
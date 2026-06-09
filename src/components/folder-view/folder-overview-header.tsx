'use client';

import React, { useCallback, useState } from "react";
import { Button } from "../ui/button";
import { Folder, Pencil, PlusIcon, Trash2 } from "lucide-react";
import { ReduxFolder } from "@/types/state.type";
import { useFile } from "@/hooks/useFile";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { useToast } from "../ui/use-toast";
import { useFolder } from "@/hooks/useFolder";
import { useTitleEditing } from "@/hooks/useTitleEditing";
import { useClickDifferentiator } from "@/hooks/useClickDifferentiator";
import { useUser } from "@/lib/providers/user-provider";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { MARK_ACTIVITY_STALE } from "@/store/slices/activitySlice";

export const FolderOverviewHeader = ({ 
    folder,
    filesLength, 
}: { 
    folder: ReduxFolder;
    filesLength: number;
}) => {
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const { user } = useUser();
    const { createFile } = useFile();
    const { updateFolder } = useFolder();
    const { toast } = useToast();
    const dispatch = useDispatch();

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
        id: folder._id,
        dirType: "folder",
        originalTitle: folder.title,
        isEditingLocally,
        onEditingStop: handleEditingStop,
    });

    const startEditing = useCallback(() => {
        setIsEditingLocally(true);
        handleStartEditingFromHook();
    },[handleStartEditingFromHook]);

    const { handleMouseClickInterception } = useClickDifferentiator({
        onSingleClickAction: () => {
            return;
        },
        onDoubleClickAction: () => {
            if(!isEditing) startEditing();
        },
    });

    const addNewFile = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentWorkspace?._id) return;
    
        const payload = {
            folderId: folder._id,
            workspaceId: currentWorkspace._id.toString(),
        }
    
        try {
            const result = await createFile(payload);
            if(!result.success){
                toast({
                    title: "Failed to create file",
                    description: "Please try again later",
                    variant: "destructive"
                });
            }else{
                toast({
                    title: "Successfully created new file",
                    description: "Start working on it",
                })
            }
        } catch (error) {
            console.error("Error while creating file in folder ",error)
            toast({
                title: "Failed to create file",
                description: "Error while creating file in folder",
                variant: "destructive"
            });
        }
    };

    const moveFolderToTrash = async(e: React.MouseEvent) => {
        e.stopPropagation();
        const username = user?.username;
        const trashValue = `Deleted by ${username}`;
        const updatedFolder:Partial<MongooseFolder> = {
            inTrash: trashValue
        }
        try {
            const result = await updateFolder(folder._id, updatedFolder);
            if(!result.success){ // Check result.success for hook's return
                toast({
                    title: "Failed to move folder to trash ",
                    description: "Please try again later",
                    variant: "destructive"
                });
            } else {
                dispatch(MARK_ACTIVITY_STALE());  
                toast({
                    title: "Folder moved to trash successfully",
                    description: "Keep it safe",
                });
            }
        } catch (error) {
                console.error("Error while moving folder to the trash", error)
                toast({
                    title: "Error while moving file to the trash ",
                    description: "Please try again later",
                    variant: "destructive"
                })
        }
    }
    
    return (
        <div className="flex flex-row flex-wrap justify-between items-end w-full gap-y-4">
           <div className="flex items-center gap-x-4 min-w-0 flex-1 group">
                <div className="text-3xl sm:text-5xl shrink-0 select-none">
                    {folder.iconId || <Folder size={16}/>}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <div
                        onClick={handleMouseClickInterception}
                        className="flex items-center gap-x-3 w-full min-w-0 py-1"
                    >
                        {isEditing ? (
                            <input 
                                ref={inputRef}
                                type="text"
                                value={typeof displayedTitle === "string" ? displayedTitle : ''}
                                onChange={handleTitleChange}
                                onBlur={handleInputBlur}
                                onFocus={handleInputFocus}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                                className="text-xl sm:text-3xl font-bold text-white bg-zinc-900
                                outline-none border border-purple-500/50 rounded-xl px-3 py-1
                                w-full max-w-xl cursor-text"
                            />
                        ) : (
                            <>
                                <h1 className="text-xl sm:text-3xl font-bold text-white 
                                tracking-tight leading-none truncate cursor-pointer max-w-max">
                                    {String(folder.title) || folder.title}
                                </h1>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(!isEditing) startEditing();
                                    }}
                                    className="p-1.5 rounded-md text-zinc-500 hover:text-white
                                    hover:bg-zinc-800 transition-all flex sm:opacity-0
                                    sm:group-hover:opacity-100 opacity-100 shrink-0"
                                >
                                    <Pencil size={16}/>
                                </button>

                                <button
                                    onClick={moveFolderToTrash}
                                    className="p-1.5 rounded-md text-red-400 hover:text-white
                                    hover:bg-red-500 transition-all flex sm:opacity-0
                                    sm:group-hover:opacity-100 opacity-100 shrink-0"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </>
                        )}
                    </div>
                   
                    <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-2">
                        FOLDER • {filesLength || 0} FILES
                    </p>
                </div>
           </div>

           <Button
            onClick={addNewFile}
           className="bg-[#B794F4] hover:bg-[#9F7AEA] text-black font-bold py-2 px-4 rounded-lg
           flex items-center gap-x-2"
           >
                <PlusIcon size={18} strokeWidth={3}/>
                <span>Add Files</span>
           </Button>
        </div>
    )
}
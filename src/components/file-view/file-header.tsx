/**
 * FILE PAGE HEADER
 * ----------------
 * Displays the file title prominently at the top of the file editor.
 */

"use client";

import { useFile } from "@/hooks/useFile";
import { useUser } from "@/lib/providers/user-provider";
import { ReduxFile } from "@/types/state.type";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { useDispatch } from "react-redux";
import { useCallback, useState } from "react";
import { useTitleEditing } from "@/hooks/useTitleEditing";
import { useClickDifferentiator } from "@/hooks/useClickDifferentiator";
import { File as MongooseFile } from "@/model/file.model";
import { MARK_ACTIVITY_STALE } from "@/store/slices/activitySlice";

interface FileHeaderProps{
    currentFile: ReduxFile;
    workspaceName?: string;
    folderName?: string;
    documentMasteryPct?: number;
}

export const FileHeader = ({
    currentFile,
    workspaceName,
    folderName,
    documentMasteryPct,
}: FileHeaderProps) => {
    const { user } = useUser();
    const { updateFile } = useFile();
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
        id: currentFile._id,
        dirType: 'file',
        originalTitle: currentFile.title,
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

    const moveFolderToTrash = async(e: React.MouseEvent) => {
        e.stopPropagation();
        const username = user?.username;
        const trashValue = `Deleted by ${username}`;
        const updatedFile:Partial<MongooseFile> = {
            inTrash: trashValue
        }
        try {
            const result = await updateFile(currentFile._id, updatedFile);
            if(!result.success){ // Check result.success for hook's return
                toast({
                    title: "Failed to move file to trash ",
                    description: "Please try again later",
                    variant: "destructive"
                });
            } else {
                dispatch(MARK_ACTIVITY_STALE());  
                toast({
                    title: "File moved to trash successfully",
                    description: "Keep it safe",
                });
            }
        } catch (error) {
            console.error("Error while moving file to the trash", error)
            toast({
                title: "Error while moving file to the trash ",
                description: "Please try again later",
                variant: "destructive"
            });
        }
    }
    return(
        <div className="flex items-start justify-between gap-4 px-6 py-6 border-b border-white/10
        flex-shrink-0">

            {/* Left: Icon + Title + Meta */}
            <div className="flex items-center gap-4 min-w-0 group">
                {/* File icon- swap with emoji picker output */}
                <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/20
                flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-purple-400"/>
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
                                    {String(currentFile.title) || currentFile.title || "Untitled"}
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
                    <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mt-1">
                        FILE
                        {folderName && (
                            <>
                                <span className="mx-1.5">·</span>
                                {folderName}
                            </>
                        )}
                        {workspaceName && (
                            <>
                                <span className="mx-1.5">·</span>
                                {workspaceName}
                            </>
                        )}
                    </p>
                </div>
            </div>

        </div>
    )
}

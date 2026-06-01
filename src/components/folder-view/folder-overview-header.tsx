'use client';

import React from "react";
import { Button } from "../ui/button";
import { Folder, PlusIcon } from "lucide-react";
import { ReduxFolder } from "@/types/state.type";
import { useFile } from "@/hooks/useFile";
import { useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { useToast } from "../ui/use-toast";


export const FolderOverviewHeader = ({ 
    folder,
    filesLength, 
}: { 
    folder: ReduxFolder;
    filesLength: number;
}) => {
    const currentWorkspace = useSelector(selectCurrentWorkspace);

    const { createFile } = useFile();
    const { toast } = useToast();

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
                    })
                }else{
                    toast({
                    title: "Successfully created new file",
                    description: "Start working on it",
                })
                }
                
                
                    
            } catch (error) {
                console.log("Error while creating file in folder ",error)
                toast({
                    title: "Failed to create file",
                    description: "Error while creating file in folder",
                    variant: "destructive"
                })
            }
        };

    return (
        <div className="flex flex-row flex-wrap justify-between items-end w-full gap-y-4">
           <div className="flex items-center gap-x-4">
                <div className="text-3xl sm:text-5xl">{folder.iconId || <Folder size={16}/>}</div>
                <div className="flex flex-col">
                    <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight leading-none">
                        {folder.title}
                    </h1>
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
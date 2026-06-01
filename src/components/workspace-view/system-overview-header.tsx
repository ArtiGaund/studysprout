'use client';

import { PlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useFolder } from "@/hooks/useFolder";
import { useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { useToast } from "../ui/use-toast";
import { useWorkspaceStats } from "@/hooks/useStats";

export const SystemOverviewHeader = ({workspaceId}: { workspaceId: string}) => {

    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const { createFolder } = useFolder();
    const { toast } = useToast()
    const { loading, stats } = useWorkspaceStats(workspaceId);

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
                    })
                }
                else {
                toast({
                    title: "Successfully created folder",
                    description: "You can now add files to this folder",
                });
            }
             } catch (error) {
                console.warn("Error while creating a folder in workspace ",error)
                toast({
                    title: "Failed to create folder",
                    description: "Please try again later",
                    variant: "destructive"
                })
             }  
    }
    return(
        <div className="flex flex-row flex-wrap justify-between items-end w-full mb-6 gap-y-4">
            {/* Left Section: Title and Subtitle */}
            <div className="flex flex-col gap-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    System Overview
                </h1>
                {typeof velocityText === "string"
                    ? <p className="text-zinc-500 text-sm font-medium">
                        {velocityText}
                    </p>
                    : velocityText
                }
            </div>
            {/* Right Section: Action Button */}
            <div>
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
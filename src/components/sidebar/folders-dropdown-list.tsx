/**
 * @component FoldersDropdownList
 * @description A versatile container for managing and displaying folder structures.
 * * Architecture Highlights:
 * - Multi-context UI: Adapts styling and functionality for 'sidebar', 'workspacePage', or 'folderPage'.
 * - Performance: Utilizes memoized selector factories (`makeSelectFolders`) to isolate 
 * re-renders to specific workspace updates.
 * - Interaction Safeguards: Integrates with a `RevisionSidebar` provider to disable 
 * modifications and visual noise when the user is in "Revision Mode".
 * - Data Filtering: Purely presentational filtering of trashed entities at the selector level.
 */
"use client";

import React, { useMemo } from "react";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon } from "lucide-react";
import { useToast } from "../ui/use-toast";
import {
    Accordion,
  } from "@/components/ui/accordion"
import {  useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Dropdown from "./dropdown";
import { useFolder } from "@/hooks/useFolder";
import { ReduxFile, ReduxFolder } from "@/types/state.type";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { HoverCard, HoverCardTrigger } from "../ui/hover-card";
import DisabledHoverMessage from "../ui/disabled-hover-message";
import { makeSelectFolders, selectCurrentFolder } from "@/store/selectors/folderSelector";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
  


interface FoldersDropdownListProps{
    workspaceFolders: ReduxFolder[] | [];
    workspaceId: string; 
    usedWhere: "workspacePage" | "folderPage" | "sidebar";
    globalEditingItems?: RootState['ui']['editingItem'];
}
const FoldersDropdownList:React.FC<FoldersDropdownListProps> = ({ 
     workspaceId, 
      usedWhere, 
      globalEditingItems,
    }) => {

    // --- Redux Selectors ---
    // 1) keep track of local state folders
    // set up real time updates => when another user create an update, we want real time update system setup
    // so it can create a folder for us in our localhost (i think i don't need it bz i am not doing collaborator 
    // part)
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const currentFolder = useSelector(selectCurrentFolder);

    /** * @section Memoized State Management
     * Using factory selectors prevents this component from re-rendering when 
     * folders in *other* workspaces are updated.
     */
    const selectFolders = useMemo(makeSelectFolders,[]);
    const EMPTY_FOLDER: ReduxFolder[] = [];
    const folders = useSelector( (state: RootState) =>
    workspaceId ? selectFolders(state,workspaceId) : EMPTY_FOLDER
    )

    // Defensive UI: Ensure users don't see deleted folders in the main navigation
    const filteredFolder = folders.filter(folder => !folder.inTrash); 
   
    // --- Hooks & Context ---
    const { createFolder } = useFolder();
    const { toast } = useToast()
    const { isRevisionSidebarOpen } = useRevisionSidebar();
 
    /**
     * @handler addFolderHandler
     * Triggers the folder creation workflow with immediate feedback via Toasts.
     */
    const addFolderHandler = async () => {
             try {
                 const folder = await createFolder(workspaceId);
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
        <>
            {/* Contextual Header: Displays Privacy status only when in Sidebar */}
            <div className={`flex sticky z-20 top-2 bg-background w-full h-10 group/title justify-between
             items-center pr-4 text-Neutrals/neutrals-8 
             `}>
                { usedWhere === "sidebar" && (
                    <span className="font-bold text-Neutrals-8 text-[11px]">
                       {currentWorkspace?.isPublic ? "PUBLIC" : "PRIVATE" }
                    </span>
                )}
                
            </div>

            {/* Revision Mode Safeguard: Uses a HoverCard to explain disabled states */}
            <HoverCard>
                <HoverCardTrigger asChild>
            <div className={`${usedWhere === "sidebar" && isRevisionSidebarOpen ?
                 'bg-slate-gray cursor-not-allowed rounded-lg  w-[3rem] mt-2' : ''}`}>
                    {/* Section Label & Action Icon */}
                <div className="flex sticky z-20 top-0 w-full h-10 group/title justify-between
                items-center pr-4 text-Neutrals/neutrals-8 pl-4 m-1">
                
                { usedWhere === "sidebar" && (
                    <span className={`font-bold text-Neutrals-8 
                     ${isRevisionSidebarOpen ? 'flex ml-[-17.5px] text-[9px] text-gray-300' : 'text-xs'}`}>
                        FOLDERS
                    </span>
                )}
                { usedWhere === "workspacePage" && (
                    <span className="font-bold text-Neutrals-8 text-lg">
                    FOLDERS
                    </span>
                )}
                { usedWhere === "sidebar" && !isRevisionSidebarOpen && (
                    <TooltipComponent message="Create Folder">
                    <PlusIcon
                    onClick={addFolderHandler}
                     size={16}
                     className="group-hover/title:inline-block hidden cursor-pointer hover:text-white"/>

                </TooltipComponent>
                )}
                
                </div>
                {/* Rendering all the folder */}
                <div className={`flex pl-5 transition-all ${isRevisionSidebarOpen && usedWhere === "sidebar" ? 
                    'opacity-50 pointer-events-none cursor-not-allowed' 
                    : ''}`}>
                <Accordion
                type="multiple"
                defaultValue={[ currentFolder?.toString() || '']}
                className="pb-20"
                >
                   {
                   filteredFolder.length > 0 ? (
                    filteredFolder.map((folder) => (
                      (folder &&  <Dropdown 
                        key={folder._id} // Ensure key is a string
                        title={folder.title}
                        listType="folder"
                        id={folder._id} // Ensure id is a string and provide a fallback
                        iconId={folder.iconId || ''} // Ensure iconId is a string and provide a fallback
                    />)
                   ))
                   ) : (
                    <div className="text-Neutrals/neutrals-7 text-sm py-2">No folders found.</div>
                   )
                   
                   }
                </Accordion>
            </div>
        </div>
        </HoverCardTrigger>
        {isRevisionSidebarOpen && usedWhere === "sidebar" && (
            <DisabledHoverMessage />
        )}
        </HoverCard>
        </>
    )
}

export default FoldersDropdownList
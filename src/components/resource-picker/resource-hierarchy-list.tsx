"use client";

import { useDispatch, useSelector } from "react-redux";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { RootState } from "@/store/store";
import { useWorkspace } from "@/hooks/useWorkspace";
import React, { useEffect, useState } from "react";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
import { Loader2 } from "lucide-react";
import ResourcePickerItem from "./resource-picker-item";
import { ReduxWorkSpace } from "@/types/state.type";
import { SET_CURRENT_RESOURCE } from "@/store/slices/contextSlice";
import { Button } from "../ui/button";

interface ResourceHierarchyListProps{
    onSelect: (id: string, title: string, type: 'Workspace' | 'Folder' | 'File') => void;
}
const ResourceHierarchyList: React.FC<ResourceHierarchyListProps> = ({ onSelect }) => {
   
    const dispatch = useDispatch();
    // current selected resource (opened page)
    const currentContext = useSelector((state: RootState) => state.context.currentResource);

    const {
        currentWorkspace,
        isLoadingWorkspaces,
        getWorkspaces,
    } = useWorkspace();

    const {
        folders,
        isLoadingFolders,
        getFolders,
    } = useFolder();

    const {
        files: allFiles,
        fileLoading: isLoadingFiles,
        getWorkspaceFiles,
    } = useFile();
    const handleResourceSelect = (id: string, title: string, type: 'Workspace' | 'Folder' | 'File') => {
        dispatch(SET_CURRENT_RESOURCE({
            id,
            title,
            type
        }
        ))
    }

    // State to manage which containers are open

    const [ expandedIds, setExpandedIds ] = useState<Set<string>>(new Set());

    // Data fetching effect
    useEffect(() => {
        if(currentWorkspace?._id){
            const workspaceId = currentWorkspace._id;

            // Ensure necessary data for the current workspace is fetched
            getFolders(workspaceId);
            getWorkspaceFiles(workspaceId);

            // Automatically expand the current workspace on initial load
            setExpandedIds(prev => {
                if(!prev.has(workspaceId)){
                    return new Set(prev).add(workspaceId);
                }
                return prev;
            });
        }else{
            // Fallback: Ensure workspaces are fetched if none is selected
            getWorkspaces();
        }
    },[
        currentWorkspace?._id,
        getFolders,
        getWorkspaceFiles,
        getWorkspaces
    ])


    // Simple toggle function for folder/workspace expansion
    const toggleExpansion = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const isLoading = isLoadingWorkspaces || isLoadingFolders || isLoadingFiles;

    if(isLoading){
        return(
            <div className="flex justify-center items-center h-full min-h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500"/>
                <span className="ml-2 text-gray-500"> Loading resources...</span>
            </div>
        )
    }

    const topLevelWorkspace = currentWorkspace;

    return (
        <DialogContent >
            <DialogHeader>
                <DialogTitle>Resource Picker</DialogTitle>
                 <DialogDescription>
                    Select the **file, folder, or workspace** containing the notes you want to use
                     for **flashcard generation and review**.
                </DialogDescription>
            </DialogHeader>
            {/* Current workspace */}
            <div className="flex flex-row gap-2">
                <span>Selected: </span>
                <span>[ {currentContext.type} : {currentContext.title} ] </span>
            </div>
            <div className="h-auto overflow-y-auto">
                <div className="flex flex-col gap-1 p-2">
                    <ResourcePickerItem 
                    resource={topLevelWorkspace as ReduxWorkSpace}
                    resourceType="Workspace"
                    level={0}
                    allFolders={folders}
                    allFiles={allFiles}
                    isExpanding={expandedIds.has(topLevelWorkspace?._id!)}
                    onToggle={toggleExpansion}
                    onSelect={handleResourceSelect}
                    expandedIds={expandedIds}
                    />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                        <Button  className="w-[10rem] h-auto bg-purple-950 hover:bg-purple-800">Select & Close</Button>
                </DialogClose>
            </DialogFooter>
           
        </DialogContent>
    )
};

export default ResourceHierarchyList;
/**
 * @component ResourceHierarchyList
 * @description A modal-based resource picker that allows users to traverse their 
 * data hierarchy (Workspace > Folder > File) to set a context for flashcard generation.
 * * * Key Architecture:
 * - Centralized Context: Synchronizes the selected resource with the Redux `contextSlice`.
 * - Selective Expansion: Manages an `expandedIds` Set for high-performance UI toggling 
 * without re-rendering the entire tree.
 * - Reactive Loading: Aggregates loading states from multiple slices (Workspace, Folder, File) 
 * to provide a unified UX during data fetching.
 */
"use client";

import { useDispatch, useSelector } from "react-redux";
import {
    DialogClose,
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "../ui/dialog";
import { RootState } from "@/store/store";
import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import ResourcePickerItem from "./resource-picker-item";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { SET_CURRENT_RESOURCE } from "@/store/slices/contextSlice";
import { Button } from "../ui/button";

// --- Selectors ---
import { 
    selectCurrentWorkspace, 
    selectWorkspaceLoading, 
    selectWorkspaces 
} from "@/store/selectors/workspaceSelector";
import {
     makeSelectFolders, 
     selectCurrentFolder, 
     selectFolderLoading 
    } from "@/store/selectors/folderSelector";
import { makeSelectFiles, selectFileLoading } from "@/store/selectors/fileSelector";

interface ResourceHierarchyListProps{
    onSelect: (id: string, title: string, type: 'Workspace' | 'Folder' | 'File') => void;
}
const ResourceHierarchyList: React.FC<ResourceHierarchyListProps> = ({ onSelect }) => {
   
    const dispatch = useDispatch();
    
    /** * @section Redux State Selection
     * Retrieves the current user context and workspace metadata.
     */
    const currentContext = useSelector((state: RootState) => state.context.currentResource);
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const workspaceId = currentWorkspace?._id;

    const isLoadingWorkspaces = useSelector(selectWorkspaceLoading);
    const isLoadingFolders = useSelector(selectFolderLoading);
    const isLoadingFiles = useSelector(selectFileLoading);

    
    /** * @section Memoized Instance Selectors
     * Prevents parent re-renders from triggering unnecessary filtering logic.
     */
    const selectFolders = useMemo(makeSelectFolders,[]);
    const selectFiles = useMemo(makeSelectFiles, []);
    const EMPTY_FOLDER: ReduxFolder[] = [];

    const folders = useSelector((state: RootState) => 
    workspaceId ? selectFolders(state, workspaceId) : EMPTY_FOLDER
    );
    const currentFolder = useSelector(selectCurrentFolder);
    const folderId = currentFolder?._id;

    const EMPTY_FILE: ReduxFile[] = [];

    const files = useSelector((state: RootState) =>
    folderId ? selectFiles(state, folderId) : EMPTY_FILE
    );

    /** * @section Local UI State
     * Manages a Set of IDs to track expanded folders/workspaces in the hierarchy.
     */
    const [ expandedIds, setExpandedIds ] = useState<Set<string>>(new Set());
   
    

    // Automatically expand the current active workspace on load
    useEffect(() => {
        if(workspaceId){
            setExpandedIds(prev => new Set(prev).add(workspaceId));
        }
    }, [ workspaceId]);

    /**
     * @handler handleResourceSelect
     * Updates the global context for the Flashcard generation engine.
     */
    const handleResourceSelect = (id: string, title: string, type: 'Workspace' | 'Folder' | 'File') => {
        dispatch(SET_CURRENT_RESOURCE({
            id,
            title,
            type
        }
        ))
    }
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

            {/* Selection Breadcrumb / Status */}
            <div className="flex flex-row gap-2">
                <span>Selected: </span>
                <span>[ {currentContext.type} : {currentContext.title} ] </span>
            </div>

            {/* Scrollable Tree View */}
            <div className="h-auto overflow-y-auto">
                <div className="flex flex-col gap-1 p-2">
                    <ResourcePickerItem 
                    resource={topLevelWorkspace as ReduxWorkSpace}
                    resourceType="Workspace"
                    level={0}
                    allFolders={folders}
                    allFiles={files}
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
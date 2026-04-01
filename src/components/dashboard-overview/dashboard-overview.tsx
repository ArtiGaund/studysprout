/**
 * @component DashboardOverview
 * @description A polymorphic container that manages the high-level creation and 
 * listing of entities (Folders within Workspaces or Files within Folders).
 * * Key Architecture:
 * - Dynamic Context: Uses `dirType` to swap between Workspace-level and Folder-level logic.
 * - Optimized Selectors: Implements memoized selector factories (`makeSelectFolders`, `makeSelectFiles`) 
 * to prevent unnecessary re-renders across the dashboard tree.
 * - Action Abstraction: Encapsulates creation logic with optimistic-style feedback using Toasts.
 */

"use client";

import { IBlock, File as MongooseFile} from "@/model/file.model";
import React, { useMemo } from "react";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "../sidebar/folders-dropdown-list";
import { RootState } from "@/store/store";
import TooltipComponent from "../global/tooltip-component";
import { toast } from "../ui/use-toast";
import { FolderIcon, FileIcon } from "lucide-react";
import FolderFileList from "./folder-file-list";
import { useCallback } from 'react';

// --- Redux & Custom Hooks --- 
import { 
    ReduxWorkSpace,
    ReduxFolder,
    ReduxFile
 } from "@/types/state.type";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
import { useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { makeSelectFolders, selectCurrentFolder } from "@/store/selectors/folderSelector";
import { makeSelectFiles } from "@/store/selectors/fileSelector";


interface DashboardOverviewProps{
    dirDetails: ReduxWorkSpace | ReduxFolder;
    fileId: string;
    dirType: "workspace" | "folder";
    params: string;
    globalEditingItem?: RootState['ui']['editingItem'];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    dirDetails,
    fileId,
    dirType,
    params,
    globalEditingItem,
}) => {
   // --- Contextual State Selection ---
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const workspaceId = currentWorkspace?._id;
    const currentFolder = useSelector(selectCurrentFolder);
    const folderId = currentFolder?._id;

    const { createFolder} = useFolder();
    const { createFile } = useFile();

    /** * @section Memoized Selectors
     * Using factory functions to create instance-specific selectors.
     * This ensures that the component only re-renders when the specific 
     * folders/files for the current view change.
     */
    const selectFolders = useMemo(makeSelectFolders,[]);
    const selectFiles = useMemo(makeSelectFiles, []);

    const EMPTY_FOLDER: ReduxFolder[] = [];
    const EMPTY_FILE: ReduxFile[] = [];

    const folders = useSelector( (state: RootState) =>
        workspaceId ? selectFolders(state, workspaceId) : EMPTY_FOLDER
    );
    const files = useSelector( (state: RootState) =>
    folderId ? selectFiles(state, folderId) : EMPTY_FILE
    );

    const isEditable = !dirDetails.inTrash;

    /**
     * @handler addNewFolderHandler
     * Logic for workspace-level expansion. Creates a new folder entity 
     * within the active workspace.
     */
    const addNewFolderHandler = useCallback(async () => {

                if(!isEditable){
                    toast({
                        title: "Cannot create folder",
                        description: "This folder is in trash and cannot be edited",
                        variant: "destructive"
                    });
                    return;
                }
                if(!workspaceId){
                    toast({
                        title: "Cannot create folder",
                        description: "Please select workspace",
                        variant: "destructive"
                    });
                    return;
                }
                    
                     try {
                         const folder = await createFolder(workspaceId);
                        if(!folder.success){
                            toast({
                                title: "Failed to create folder",
                                description: "Please try again later",
                                variant: "destructive"
                            })
                        }else {
                        toast({
                            title: "Successfully created folder",
                            description: "You can now add files to this folder",
                        });
                    }
                     } catch (error) {
                        console.log("Error while creating a folder in workspace ",error)
                        toast({
                            title: "Failed to create folder",
                            description: "Please try again later",
                            variant: "destructive"
                        })
                     }
                   
               
            }, [
                createFolder, 
                workspaceId,
                isEditable
            ])
            
    /**
     * @handler addNewFileHandler
     * Logic for folder-level expansion. Creates a new file (with default block metadata) 
     * within the active folder.
     */        
    const addNewFileHandler = useCallback(async () => {
        if (!isEditable) {
            toast({
                title: "Cannot create file",
                description: "This folder is in trash and cannot be edited",
                variant: "destructive"
            });
            return;
        }
        if (!workspaceId){
            toast({
                title: "Missing Workspace ID",
                description: "Cannot create file without a workspace.",
                variant: "destructive"
            });
            return;
        }
        if (!currentFolder || typeof currentFolder._id === 'undefined') { // Ensure currentFolder and its _id are defined
            toast({
                title: "No Folder Selected",
                description: "Please select a folder to add a file to.",
                variant: "destructive"
            });
            return;
        }
        const newFile: MongooseFile = {
                    folderId: currentFolder?._id.toString(),
                    inTrash: undefined,
                    title: 'Untitled',
                    iconId: '📄',
                    workspaceId: workspaceId, 
                    bannerUrl: '',
                    createdAt: new Date(),
                    lastUpdated: new Date(),
                    blocks: new Map<string, IBlock>,        // or new Map() if your type is Map
                    blockOrder: [],
                    contentBinary: null,
                    contentLastModified: new Date(),
                };

        try {
            const file = await createFile(newFile);
            if(!file.success){
                toast({
                    title: "Failed to create file",
                    description: "Please try again later",
                    variant: "destructive"
                })
            }else {
                toast({
                    title: "Successfully created new file",
                    description: "Start working on it",
                });
            }
           
        } catch (error) {
            console.log("Error while creating file in folder ",error)
            toast({
                title: "Failed to create file",
                description: "Error while creating file in folder",
                variant: "destructive"
            })
        }
    }, [
        createFile, 
        currentFolder, 
        workspaceId,
        isEditable
    ]);

    /**
     * @memoized filteredFiles
     * Filters out files currently in the trash and ensures 
     * files match the current folder parameter.
     */
  const filteredFiles = useMemo(() => {
    if(Array.isArray(files) && params){
        return files.filter(file => file.folderId === params && 
            (file.inTrash === undefined || file.inTrash === null || file.inTrash === ""));
    }
    return []
  },[ files, params ])

    return(
        <div className='flex flex-row w-full items-center gap-2 pl-[5rem] p-[2rem]'>
            {/* Primary Content Section: Creation & Listing */}
                <div className='w-2/3'>
                    <div className="flex flex-row items-center gap-2">
                        <div className="flex sticky z-20 top-2 bg-background w-3/4 h-10 group/title justify-between
                         items-center pr-4 text-Neutrals/neutrals-8">
                            <span className="font-bold text-Neutrals-8 text-[20px]">
                               Create New
                            </span>
                        </div>
                        <div className="flex sticky z-20 top-2 bg-background w-1/4 h-10 group/title justify-between
                         items-center pr-4 text-Neutrals/neutrals-8">
                            {/* Dynamic Icon Trigger based on dirType */}
                            {dirType === "workspace" && (
                                 <TooltipComponent message="Create Folder">
                                    <FolderIcon
                                    onClick={addNewFolderHandler}
                                    className={`relative right-[-5rem] w-[2rem] h-[2rem]
                                    ${isEditable ? "cursor-pointer" : "cursor-not-allowed"}`}
                                    />
                           </TooltipComponent>
                            )}
                            
                            { dirType === "folder" &&(<TooltipComponent message="Create File">
                            <FileIcon 
                             onClick={addNewFileHandler}
                            className={`w-[2rem] h-[2rem] ${isEditable ? "cursor-pointer" : "cursor-not-allowed"}`}
                            />
                            </TooltipComponent>)}
                         </div>
                        </div>
                    <div>
                       { dirType === "workspace" && (<ScrollArea className="overflow-scroll relative h-[450px]">
                            <div className="w-full pointer-events-none absolute bottom-0 h-20 bg-gradient-to-t
                                from-background to-transparent z-40"/>
                           { folders?.length > 0 ? (<FoldersDropdownList 
                             workspaceFolders={folders || []}
                                workspaceId={params}
                                // onFolderAdded={addNewFolderHandler}
                                usedWhere = "workspacePage"
                                globalEditingItems={globalEditingItem}
                            />): (
                                <div> This Workspace is empty.</div>
                            )}
                        </ScrollArea>
                    )}
                    { dirType === "folder" && (
                        <ScrollArea className="overflow-scroll relative h-[450px]">
                             <div className="w-full pointer-events-none absolute bottom-0 h-20 bg-gradient-to-t
                                from-background to-transparent z-40"/>
                                { filteredFiles.length > 0 ? (
                                    <FolderFileList
                                    folderFiles={filteredFiles}
                                    folderId={params}
                                    onFileAdded={addNewFileHandler}
                                    globalEditingItems={globalEditingItem}
                                    />
                                ) :(
                                    <div>Folder is empty</div>
                                )}
                        </ScrollArea>
                    )}
                    </div>
                </div>
               <div className="relative top-[-15px] w-px h-[450px] bg-muted" />
                <div className='w-1/3 h-[500px]'>
                    <div className="relative flex z-20 top-2 bg-background w-3/4 h-10 group/title justify-between
                         items-center p-2 left-[5rem] text-Neutrals/neutrals-8">
                            <span className="font-bold text-Neutrals-8 text-[20px]">
                               {dirType.toUpperCase()} Flashcard Set list
                            </span>
                        </div>
                    <div className="relative flex flex-col z-20 top-2 bg-background w-3/4 h-10 group/title 
                        p-2 left-[5rem] text-Neutrals/neutrals-8">
                        { dirType === "workspace" && (
                            <span>Workspace Flashcard sets</span>
                        )}
                        {dirType === "folder" && (
                            <span>Folder Flashcard sets </span>
                        )}
                    </div>
                </div>
            </div>
    )
}

export default DashboardOverview;
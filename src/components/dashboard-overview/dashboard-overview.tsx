"use client";

import { Folder as MongooseFolder } from "@/model/folder.model";
import { WorkSpace as MongooseWorkspace} from "@/model/workspace.model";
import { File as MongooseFile} from "@/model/file.model";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "../sidebar/folders-dropdown-list";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import axios from "axios";
// Import Redux actions,
import { 
    ADD_FOLDER, 
    SET_CURRENT_FOLDER, 
    SET_FOLDERS, 
    UPDATE_FOLDER 
} from "@/store/slices/folderSlice";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon } from "lucide-react";
import { toast } from "../ui/use-toast";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { FolderIcon, FileIcon } from "lucide-react";
import FolderFileList from "./folder-file-list";
import { useCallback } from 'react';
import {
     ADD_FILE, 
     SET_CURRENT_FILES, 
     SET_FILES 
    } from "@/store/slices/fileSlice";

// Import Redux types 
import { 
    ReduxWorkSpace,
    ReduxFolder,
    ReduxFile
 } from "@/types/state.type";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
import { transformFile, transformFolder } from "@/utils/data-transformers";

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
    

    // const [ error, setError ] = useState(false)
    const { currentWorkspace } = useWorkspace();
    const { folders, currentFolder, getFolders, createFolder} = useFolder();
    const { files, currentFile, getFiles, createFile } = useFile();
     const workspaceId = currentWorkspace?._id.toString() ?? "";
    const dispatch = useDispatch()

    const fetchFolders = useCallback(async (workspaceId: string) => {
        if(!workspaceId){
            toast({
                title: "Failed to fetch all folders of workspace",
                description: "Workspace id not found",
                variant: "destructive"
            })
            return;
        }
          try {
            

            const allFolders = await getFolders(workspaceId);
            if(!allFolders.success){
                toast({
                     title: "Failed to fetch all folders of workspace",
                    description: allFolders.error,
                    variant: "destructive"
                })
                // dispatch(SET_FOLDERS([]))
                // dispatch(SET_CURRENT_FOLDERS(null)); // Clear current folder
                return;
            }
            
            
             toast({
                title: "Successfully fetched folders",
                description: "You can now add files in the folder",
             })
             
          } catch (error: any) {
              console.error("Error loading folders ",error);
                    toast({
                        title: "Failed to fetch folders",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                    // dispatch(SET_FOLDERS([])); // Clear folders on error
                    // dispatch(SET_CURRENT_FOLDERS(null)); // Clear current folder on error
            
          }
        }, [
            getFolders,
            // dispatch,
        ])
         const fetchFiles = useCallback(async ( folderId : string) => {
                try {
                  
                     const allFiles = await getFiles(folderId);
                     if(!allFiles.success){
                        toast({
                            title: "Failed to fetch files",
                            description: allFiles.error,
                            variant: "destructive"
                        })
                        //  dispatch(SET_FILES([])); // Set to empty to avoid stale data
                        return;
                     }
                     toast({
                        title: "Successfully fetched files",
                        description: "You can now add files to this folder",
                     })
                } catch (error) {
                    console.error("Error loading files ",error);
                    toast({
                        title: "Failed to fetch files",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                    
                }
            }, [ 
                getFiles,
            ])
         useEffect(() => {
                // Fetch folders when dirType is workspace
            if (params && dirType === "workspace") {
                console.log(`[DashboardOvierview] useEffect for workspaces: params=${params}, dirType=${dirType}`);
                fetchFolders(params);
            }
            }, [params, dirType, fetchFolders]);
       useEffect(() => {
                // Fetch folders when dirType is workspace
        if (params && dirType === "folder") {
            console.log(`[DashboardOverview] useEffect for folders: params=${params}, dirType=${dirType}`);
            fetchFiles(params);         
        }
        }, [params, dirType, fetchFiles]);

         const addFolderHandler = useCallback(async () => {
                if(!workspaceId){
                    toast({
                        title: "Cannot create folder",
                        description: "Please select workspace",
                        variant: "destructive"
                    });
                    return;
                }
                    
                   
                    const newFolder: MongooseFolder = {
                        data: undefined,
                        createdAt: new Date(),
                        title: 'Untitled',
                        iconId: '📁',
                        inTrash: undefined,
                        workspaceId,
                        bannerUrl: '',
                      };
        
                     try {
                         const folder = await createFolder(newFolder as MongooseFolder);
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
                        fetchFolders(workspaceId); // Re-fetch to update the list
                    }
                        toast({
                            title: "Successfully created folder",
                            description: "You can now add files to this folder",
                        })
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
                fetchFolders
            ])
            // add new file
    const addNewFile = useCallback(async () => {
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
                    data: undefined,
                    inTrash: undefined,
                    title: 'Untitled',
                    iconId: '📄',
                    workspaceId: workspaceId, 
                    bannerUrl: '',
                    createdAt: new Date(),
                    lastUpdated: new Date(),
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
                fetchFiles(currentFolder._id.toString()); // Re-fetch to update the list
            }
            toast({
                title: "Successfully created new file",
                description: "Start working on it",
            })
           
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
        fetchFiles
    ]);

     const handleFolderAdded = useCallback(async () => {
    
    await fetchFolders(params);
  }, [fetchFolders, params]);

           
           
         
 const handleFileAdded = useCallback(async () => {
   
    await fetchFiles(params); 
  }, [fetchFiles, params]);

  const filteredFiles = useMemo(() => {
    if(Array.isArray(files) && params){
        return files.filter(file => file.folderId === params);
    }
    return []
  },[ files, params ])
    return(
        <div className='flex flex-row w-full items-center gap-2 pl-[5rem] p-[2rem]'>
            {/* Activity section */}
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
                            {dirType === "workspace" && (
                                 <TooltipComponent message="Create Folder">
                                    <FolderIcon
                                    onClick={addFolderHandler}
                                    className="relative right-[-5rem] w-[2rem] h-[2rem]"
                                    />
                           </TooltipComponent>
                            )}
                            
                            { dirType === "folder" &&(<TooltipComponent message="Create File">
                            <FileIcon 
                             onClick={addNewFile}
                            className="w-[2rem] h-[2rem]"
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
                                onFolderAdded={handleFolderAdded}
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
                                    folderFiles={files.filter(file => file.folderId === params)}
                                    folderId={params}
                                    onFileAdded={handleFileAdded}
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
                               {dirType.toUpperCase()} stats
                            </span>
                        </div>
                    <div className="relative flex flex-col z-20 top-2 bg-background w-3/4 h-10 group/title 
                        p-2 left-[5rem] text-Neutrals/neutrals-8">
                        { dirType === "workspace" && (<span>Total Folders: {folders.length}</span>)}
                        <span>Total files: {files.length}</span>
                        <span>Last edited note</span>
                    </div>
                </div>
            </div>
    )
}

export default DashboardOverview;
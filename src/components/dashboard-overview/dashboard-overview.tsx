"use client";

import { File as MongooseFile} from "@/model/file.model";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "../sidebar/folders-dropdown-list";
import { RootState } from "@/store/store";

import TooltipComponent from "../global/tooltip-component";

import { toast } from "../ui/use-toast";

import { FolderIcon, FileIcon } from "lucide-react";
import FolderFileList from "./folder-file-list";
import { useCallback } from 'react';

// Import Redux types 
import { 
    ReduxWorkSpace,
    ReduxFolder,
    ReduxFile
 } from "@/types/state.type";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";


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
    

    const [ refetchTrigger, setRefetchTrigger ] = useState(0)
    const { currentWorkspace } = useWorkspace();
    const { folders, currentFolder, getFolders, createFolder} = useFolder();
    const { 
        files,
         currentFile, 
         getFiles,
          createFile,
          getWorkspaceFiles 
    } = useFile();
     const workspaceId = currentWorkspace?._id.toString() ?? "";
    const isEditable = !dirDetails.inTrash;

    const fetchFolders = useCallback(async (workspaceId: string) => {
        if(!workspaceId){
            toast({
                title: "Failed to fetch all folders of workspace",
                description: "Workspace id not found",
                variant: "destructive"
            })
            return;
        }

        // check if folders for this workspace are already loaded
        const hasFoldersForWorkspace = folders.some(folder => 
            folder.workspaceId === workspaceId && 
            folder.inTrash === undefined);
        
        if(hasFoldersForWorkspace){
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
                return;
            }
            
            
             toast({
                title: "Successfully fetched all the folders",
                description: "You can now add files in the folders or create new folders",
             })
             
          } catch (error: any) {
              console.error("Error loading folders ",error);
                    toast({
                        title: "Failed to fetch folders",
                        description: "Please try again later",
                        variant: "destructive"
                    })
          }
        }, [
            getFolders,
            folders
        ])
         const fetchFiles = useCallback(async ( folderId : string) => {
            if(!folderId){
                toast({
                    title: "Failed to fetch files",
                    description: "Folder id not found",
                    variant: "destructive"
                });
                return;
            }

            // check if files for this folder are already loaded
            const hasFilesForFolder = files.some(file => 
                file.folderId === folderId &&
                 file.inTrash === undefined);

            if(hasFilesForFolder){
                return;
            }
                try {
                  
                     const allFiles = await getFiles(folderId);
                     if(!allFiles.success){
                        toast({
                            title: "Failed to fetch files",
                            description: allFiles.error,
                            variant: "destructive"
                        })
                        return;
                     }
                     toast({
                        title: "Successfully fetched all the files",
                        description: "You can now add files to the folder",
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
                files
            ])
       
       useEffect(() => {
                // Fetch folders when dirType is workspace
        if (params && dirType === "folder") {
            const hasFilesForFolder = files.some(file => file.folderId === params && file.inTrash === undefined);
            if(!hasFilesForFolder){
                fetchFiles(params);    
            }     
        }
        }, [
            params, 
            dirType, 
            fetchFiles,
            files,
            refetchTrigger,
        ]);

         const addFolderHandler = useCallback(async () => {

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
                        fetchFolders(workspaceId); // Re-fetch to update the list
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
                fetchFolders,
                isEditable
            ])
            // add new file
    const addNewFile = useCallback(async () => {
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
        fetchFiles,
        isEditable
    ]);

     const handleFolderAdded = useCallback(async () => {
    
    await fetchFolders(params);
  }, [fetchFolders, params]);

           
           
         
 const handleFileAdded = useCallback(async () => {
   
    await fetchFiles(params); 
  }, [fetchFiles, params]);

 
  const filteredFiles = useMemo(() => {
    if(Array.isArray(files) && params){
        return files.filter(file => file.folderId === params && 
            (file.inTrash === undefined || file.inTrash === null || file.inTrash === ""));
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
                                    className={`relative right-[-5rem] w-[2rem] h-[2rem]
                                    ${isEditable ? "cursor-pointer" : "cursor-not-allowed"}`}
                                    />
                           </TooltipComponent>
                            )}
                            
                            { dirType === "folder" &&(<TooltipComponent message="Create File">
                            <FileIcon 
                             onClick={addNewFile}
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
                                    folderFiles={filteredFiles}
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
"use client";

import { Folder as MongooseFolder } from "@/model/folder.model";
import { WorkSpace as MongooseWorkspace} from "@/model/workspace.model";
import { File as MongooseFile} from "@/model/file.model";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "../sidebar/folders-dropdown-list";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import axios from "axios";
// Import Redux actions,
import { 
    ADD_FOLDER, 
    SET_CURRENT_FOLDERS, 
    SET_FOLDERS, 
    UPDATE_FOLDER 
} from "@/store/slices/folderSlice";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon } from "lucide-react";
import { toast } from "../ui/use-toast";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { FolderIcon, FileIcon } from "lucide-react";
import FolderFileList from "./folder-file-list";
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

interface DashboardOverviewProps{
    dirDetails: ReduxWorkSpace | ReduxFolder;
    fileId: string;
    dirType: "workspace" | "folder";
    params: string;
}



const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    dirDetails,
    fileId,
    dirType,
    params
}) => {
    // selector for normalized state
    // const workspaceState = useSelector((state:RootState) => state.workspace)
    // const currentWorkspaceId = workspaceState.currentWorkspace;

    // const folderState = useSelector((state: RootState) => state.folder);
    // const folders = folderState.allIds.map(id => folderState.byId[id]);
    // const currentFolderId = folderState.currentFolder;
    
    // const filesState = useSelector((state: RootState) => state.file);
    // const files = filesState.allIds.map(id => filesState.byId[id]);
    // const currentFileId = filesState.currentFile;

    // const [ error, setError ] = useState(false)
    const { currentWorkspace } = useWorkspace();
    const { folders, currentFolder, getFolders, createFolder} = useFolder();
    const { files, currentFile, getFiles, createFile } = useFile();
     const workspaceId = currentWorkspace?._id?.toString();
    const dispatch = useDispatch()

    // Helper to get current workspace or folder by ID from normalized state
    // const currentWorkspace = currentWorkspaceId ? workspaceState.byId[currentWorkspaceId] : undefined;
    // const currentFolder = currentFolderId ? folderState.byId[currentFolderId] : undefined;
    const handleFolderAdded = async () => {
      await fetchFolders(params)
    }
    // console.log("Dir type ",dirType);
    console.log("params ",params);
    useEffect(() => {
        // Fetch folders when dirType is workspace
    if (params && dirType === "workspace") {
        fetchFolders(params);
    }
    }, [params, dirType]);

//     console.log("Rendered with params:", params, "and dirType:", dirType);
//     useEffect(() => {
//   console.log("Params:", params);
//   console.log("DirType:", dirType);
// }, []);
    useEffect(() => {
        // Fetch folders when dirType is workspace
  if (params && dirType === "folder") {
    console.log("Effect runs: ", params, dirType);
    fetchFiles(params);         
  }
}, [params, dirType]);

    const fetchFolders = async (workspaceId: string) => {
          try {
            // console.log("Inside fetchFolders")
            // const response = await axios.get(`/api/get-all-workspace-folders?workspaceId=${workspaceId}`);
            // console.log("Response for fetch folders ",response)
            // const fetchedFolders: MongooseFolder[] = response.data.data
            // console.log("fetchedFolders ",fetchedFolders)
            
            // if(fetchedFolders){
            //     dispatch(SET_FOLDERS(fetchedFolders))
            //     if(fetchedFolders.length > 0 && !currentFolderId ){
            //       dispatch(SET_CURRENT_FOLDERS(fetchedFolders[0]._id?.toString()))
            //     }
            // }

            const allFolders = await getFolders(workspaceId);
            if(!allFolders.success){
                toast({
                     title: "Failed to fetch all folders of workspace",
                    description: allFolders.error,
                    variant: "destructive"
                })
            }
            
            const fetchedFolders = allFolders.data;
             if(Array.isArray(fetchedFolders)){
                        dispatch(SET_FOLDERS(fetchedFolders));
                     }else if(fetchedFolders && typeof fetchedFolders === "object"){
                        dispatch(SET_FOLDERS([fetchedFolders]));
                     }else{
                        dispatch(SET_FOLDERS([]));
                     }
                     toast({
                        title: "Successfully fetched folders",
                        description: "You can now add files to this folder",
                     })

            // fetching all files for each folder
            // const allFiles = await Promise.all(
            //     fetchedFolders.map( async (folder: Folder) => 
            //     await axios.get(`/api/get-all-folder-files?folderId=${folder._id}`)
            //     )
            // );

        //    const allFiles = fetchFolders.map(async (folder: ReduxFolder) => await getFiles(folder._id));

            // if(!allFiles){
            //     console.log("Not able to fetch files for each folder")
            // }

            // console.log("All files ",allFiles)
            // const filesList = allFiles
            // .map(res=> res.data.data || [])
            // .flat();

            // dispatch(SET_FILES(filesList))
            // if(filesList.length > 0 && !currentFileId){
            //             dispatch(SET_CURRENT_FILES(filesList[0]));
            //         }
          } catch (error: any) {
              console.error("Error loading folders ",error);
                    toast({
                        title: "Failed to fetch folders",
                        description: "Please try again later",
                        variant: "destructive"
                    })
            
            // console.log("Error fetching the Files ",err)
            // setError(true)
          }
        }


         const addFolderHandler = async () => {
                    // const date = ;
                    // const dateToString = date.toISOString();
                    // this will create a visible folder quickly for the user on the frontend
                   
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
                   
                // try {
                //     //   creating new folder on the server
                //     const createFolder = await axios.post('/api/create-folder', newFolder)
                //     // console.log("Create Folder ",createFolder)
                //     if(!createFolder.data.success){
                //         toast({
                //             title: "Failed to create folder",
                //             description: "Please try again later",
                //             variant: "destructive"
                //         })
                //     }
                //     else{
                //         toast({
                //             title: "Successfully created folder",
                //             description: "You can now add files to this folder",
                //          })
                //          const folderData =createFolder.data.data.folder
                //           //   adding folder to a local states
                //          dispatch(ADD_FOLDER(folderData))
                //          const updatedWorkspace = createFolder.data.data.updatedWorkspace
                //          dispatch(UPDATE_WORKSPACE(updatedWorkspace))
                //         //  console.log("Folder data",createFolder.data.data)
                //          onFolderAdded()
                //     }
                // } catch (error) {
                //     console.log("Error while creating a folder in workspace ",error)
                //     toast({
                //         title: "Failed to create folder",
                //         description: "Please try again later",
                //         variant: "destructive"
                //     })
                // }
                
            }
            // add new file
    const addNewFile = async () => {
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
            }
            toast({
                title: "Successfully created new file",
                description: "Start working on it",
            })
            // create new file on the server
            // const createFile = await axios.post(`/api/create-file`,newFile)
            // console.log("Created file ",createFile)
            // if(!createFile.data.success){
            //     toast({
            //         title: "Failed to create file",
            //         description: "Please try again later",
            //         variant: "destructive"
            //     })
            // }else{
            //     const fileData = createFile.data.data.file
            //     const updatedFolder = createFile.data.data.updatedFolder
            //     const updatedWorkspace = createFile.data.data.updatedWorkspace
            //     dispatch(ADD_FILE(fileData))
            //     dispatch(SET_FILES(fileData))
            //     dispatch(SET_CURRENT_FILES(fileData))
            //     dispatch(UPDATE_FOLDER(updatedFolder))
            //     dispatch(UPDATE_WORKSPACE(updatedWorkspace))
            //     toast({
            //         title: "Successfully created new file",
            //         description: "Start working on it",
            //     })
            // }
             
        } catch (error) {
            console.log("Error while creating file in folder ",error)
            toast({
                title: "Failed to create file",
                description: "Error while creating file in folder",
                variant: "destructive"
            })
        }
    };

            const handleFileAdded = async () => {
                await addNewFile();
            }
            const fetchFiles = async ( folderId : string) => {
                try {
                    // const response = await axios.get(`/api/get-all-folder-files?folderId=${folderId}`);
                    // console.log("Response of files in folder page ",response.data.data);
                    // const list = response.data.data as File[] || [];
                    // // dispatch(SET_FILES(list));
                    // if(Array.isArray(list)){
                    //     if(list.length === 0){
                    //         console.log("No files found, but not an error" );
                    //     }else if(!currentFileId){
                    //         dispatch(SET_CURRENT_FILES(list[0]));
                    //     }
                    // }else{
                    //     toast({
                    //         title: "Failed to fetch files",
                    //         description: "Please try again later",
                    //         variant: "destructive"
                    //     })
                    // }
                     const allFiles = await getFiles(folderId);
                     if(!allFiles.success){
                        toast({
                            title: "Failed to fetch files",
                            description: allFiles.error,
                            variant: "destructive"
                        })
                     }
                     const fetchedFiles = allFiles.data;
                     if(Array.isArray(fetchedFiles)){
                        dispatch(SET_FILES(fetchedFiles));
                     }else if(fetchedFiles && typeof fetchedFiles === "object"){
                        dispatch(SET_FILES([fetchedFiles]));
                     }else{
                        dispatch(SET_FILES([]));
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
                    // setError(error);
                }
            }
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
                            />): (
                                <div> This Workspace is empty.</div>
                            )}
                        </ScrollArea>
                    )}
                    { dirType === "folder" && (
                        <ScrollArea className="overflow-scroll relative h-[450px]">
                             <div className="w-full pointer-events-none absolute bottom-0 h-20 bg-gradient-to-t
                                from-background to-transparent z-40"/>
                                { Array.isArray(files) && files.length > 0 ? (
                                    <FolderFileList
                                    folderFiles={files.filter(file => file.folderId === params)}
                                    folderId={params}
                                    onFileAdded={handleFileAdded}
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
"use client";

import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "../sidebar/folders-dropdown-list";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import axios from "axios";
import { ADD_FOLDER, SET_CURRENT_FOLDERS, SET_FOLDERS, UPDATE_FOLDER } from "@/store/slices/folderSlice";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon } from "lucide-react";
import { toast } from "../ui/use-toast";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { FolderIcon, FileIcon } from "lucide-react";
import FolderFileList from "./folder-file-list";
import { ADD_FILE, SET_CURRENT_FILES, SET_FILES } from "@/store/slices/fileSlice";
import { File } from "@/model/file.model";
interface DashboardOverviewProps{
    dirDetails: WorkSpace | Folder;
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

    const workspaceId = useSelector((state:RootState) => state.workspace.currentWorkspace?._id)
    // console.log("Workspace id in dashboard overview ", workspaceId);
    const folders = useSelector((state: RootState) => state.folder.folders);
    const currentFolderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    // console.log("Current folder id in dashboard overview ", currentFolderId);
    const files = useSelector((state: RootState) => state.file.files);
    console.log("files in dashboard overview ",files);
    const currentFileId = useSelector((state: RootState) => state.file.currentFile?._id)
    const [ error, setError ] = useState(false)
    const dispatch = useDispatch()
    const handleFolderAdded = async () => {
      await fetchFolders(params)
    }
    // console.log("Dir type ",dirType);
    console.log("params ",params);
    useEffect(() => {
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
  if (params && dirType === "folder") {
    console.log("Effect runs: ", params, dirType);
    fetchFiles(params);         
  }
}, [params, dirType]);

    const fetchFolders = async (workspaceId: string) => {
          try {
            // console.log("Inside fetchFolders")
            const response = await axios.get(`/api/get-all-workspace-folders?workspaceId=${workspaceId}`);
            // console.log("Response for fetch folders ",response)
            const fetchedFolders = response.data.data
            // console.log("fetchedFolders ",fetchedFolders)
            
            if(fetchedFolders){
                dispatch(SET_FOLDERS(fetchedFolders))
                if(fetchedFolders.length > 0 && !currentFolderId ){
                  dispatch(SET_CURRENT_FOLDERS(fetchedFolders[0]))
                }
            }

            // fetching all files for each folder
            const allFiles = await Promise.all(
                fetchedFolders.map( async (folder: Folder) => 
                await axios.get(`/api/get-all-folder-files?folderId=${folder._id}`)
                )
            );

            // if(!allFiles){
            //     console.log("Not able to fetch files for each folder")
            // }

            // console.log("All files ",allFiles)
            const filesList = allFiles
            .map(res=> res.data.data || [])
            .flat();

            dispatch(SET_FILES(filesList))
            if(filesList.length > 0 && !currentFileId){
                        dispatch(SET_CURRENT_FILES(filesList[0]));
                    }
          } catch (err) {
            
            console.log("Error fetching the folders ",err)
            setError(true)
          }
        }


        const addFolderHandler = async () => {
               
                    // this will create a visible folder quickly for the user on the frontend
                    const newFolder: Folder = {
                        data: undefined,
                        createdAt: new Date(),
                        title: 'Untitled',
                        iconId: '📁',
                        inTrash: undefined,
                        workspaceId: params,
                        bannerUrl: '',
                      };
                   
                try {
                    //   creating new folder on the server
                    const createFolder = await axios.post('/api/create-folder', newFolder)
                    // console.log("Create Folder ",createFolder)
                    if(!createFolder.data.success){
                        toast({
                            title: "Failed to create folder",
                            description: "Please try again later",
                            variant: "destructive"
                        })
                    }
                    else{
                        toast({
                            title: "Successfully created folder",
                            description: "You can now add files to this folder",
                         })
                         const folderData =createFolder.data.data.folder
                          //   adding folder to a local states
                         dispatch(ADD_FOLDER(folderData))
                         const updatedWorkspace = createFolder.data.data.updatedWorkspace
                         dispatch(UPDATE_WORKSPACE(updatedWorkspace))
                        //  console.log("Folder data",createFolder.data.data)
                        //  onFolderAdded()
                    }
                } catch (error) {
                    console.log("Error while creating a folder in workspace ",error)
                    toast({
                        title: "Failed to create folder",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                }
                
            }
            // add new file
    const addNewFile = async () => {
        if (!workspaceId) return;
        // const fId = new mongoose.Types.ObjectId(id);
        const newFile: File = {
            folderId: currentFolderId,
            data: undefined,
            inTrash: undefined,
            title: 'Untitled',
            iconId: '📄',
            workspaceId: workspaceId.toString(), 
            bannerUrl: '',
            createdAt: new Date(),
            lastUpdated: new Date(),
        };

        try {
            // create new file on the server
            const createFile = await axios.post(`/api/create-file`,newFile)
            console.log("Created file ",createFile)
            if(!createFile.data.success){
                toast({
                    title: "Failed to create file",
                    description: "Please try again later",
                    variant: "destructive"
                })
            }else{
                const fileData = createFile.data.data.file
                const updatedFolder = createFile.data.data.updatedFolder
                const updatedWorkspace = createFile.data.data.updatedWorkspace
                dispatch(ADD_FILE(fileData))
                dispatch(SET_FILES(fileData))
                dispatch(SET_CURRENT_FILES(fileData))
                dispatch(UPDATE_FOLDER(updatedFolder))
                dispatch(UPDATE_WORKSPACE(updatedWorkspace))
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

            const handleFileAdded = async () => {
                await addNewFile();
            }
            const fetchFiles = async ( folderId : string) => {
                try {
                    const response = await axios.get(`/api/get-all-folder-files?folderId=${folderId}`);
                    console.log("Response of files in folder page ",response.data.data);
                    if(!response.data.success){
                        toast({
                            title: "Failed to fetch files",
                            description: "Please try again later",
                            variant: "destructive"
                        })
                    }
                    const list = response.data.data  as File[];;
                    dispatch(SET_FILES(list));
                    if(list.length > 0 && !currentFileId){
                        dispatch(SET_CURRENT_FILES(list[0]));
                    }
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
                                { files.length > 0 ? (
                                    <FolderFileList
                                    folderFiles={files || []}
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
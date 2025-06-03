"use client"
import React, { useEffect, useState } from "react";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon } from "lucide-react";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import { v4 as uuid4 } from "uuid";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import { Folder } from "@/model/folder.model";
import { useDispatch, useSelector } from "react-redux";
import { ADD_FOLDER, SET_FOLDERS } from "@/store/slices/folderSlice";
import { RootState } from "@/store/store";
import Dropdown from "./dropdown";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
  

interface FoldersDropdownListProps{
    workspaceFolders: Folder[] | [];
    workspaceId: string; 
    onFolderAdded: () => void;
    usedWhere: "workspacePage" | "folderPage" | "sidebar";
}
const FoldersDropdownList:React.FC<FoldersDropdownListProps> = ({ workspaceFolders, workspaceId, onFolderAdded, usedWhere }) => {
    // 1) keep track of local state folders
    // set up real time updates => when another user create an update, we want real time update system setup
    // so it can create a folder for us in our localhost (i think i don't need it bz i am not doing collaborator 
    // part)
    // console.log("Workspace id ",workspaceId)
    // console.log("Workspace Folders ",workspaceFolders)
    const folders = useSelector((state: RootState) => state.folder.folders)
    const currentFolderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    const { toast } = useToast()
    const dispatch = useDispatch()
    // 2)effect set initial state server app state
    useEffect(() => {
        // console.log("inside use effect for set folders")
        if (workspaceFolders.length > 0) {
            dispatch(SET_FOLDERS(workspaceFolders))
        }
      }, [ workspaceFolders, workspaceId, dispatch ]);
    
    // 4) add folders

    const addFolderHandler = async () => {
       
            // this will create a visible folder quickly for the user on the frontend
            const newFolder: Folder = {
                data: undefined,
                createdAt: new Date(),
                title: 'Untitled',
                iconId: '📁',
                inTrash: undefined,
                workspaceId,
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
                 onFolderAdded()
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
    // console.log("folders from state ",folders)

    return(
        <>
            <div className="flex sticky z-20 top-2 bg-background w-full h-10 group/title justify-between
             items-center pr-4 text-Neutrals/neutrals-8">
                { usedWhere === "sidebar" && (
                    <span className="font-bold text-Neutrals-8 text-[11px]">
                        PRIVATE
                    </span>
                )}
                
            </div>
            <div className="flex sticky z-20 top-0 bg-background w-full h-10 group/title justify-between
             items-center pr-4 text-Neutrals/neutrals-8 pl-4">
                { usedWhere === "sidebar" && (
                    <span className="font-bold text-Neutrals-8 text-xs">
                        FOLDERS
                    </span>
                )}
                { usedWhere === "workspacePage" && (
                    <span className="font-bold text-Neutrals-8 text-lg">
                    FOLDERS
                    </span>
                )}
                { usedWhere === "sidebar" && (
                    <TooltipComponent message="Create Folder">
                    <PlusIcon
                    onClick={addFolderHandler}
                     size={16}
                     className="group-hover/title:inline-block hidden cursor-pointer hover:text-white"/>

                </TooltipComponent>
                )}
                
                </div>
                {/* Rendering all the folder */}
                <div className="flex pl-5">
                <Accordion
                type="multiple"
                defaultValue={[ currentFolderId?.toString() || '']}
                className="pb-20"
                >
                   {
                   folders.filter((folder) => !folder.inTrash)
                   .map((folder) => (
                        <Dropdown 
                        key={folder?._id?.toString()} // Ensure key is a string
                        title={folder.title}
                        listType="folder"
                        id={folder?._id?.toString() || ''} // Ensure id is a string and provide a fallback
                        iconId={folder?.iconId || ''} // Ensure iconId is a string and provide a fallback
                    />
                   ))
                   }
                </Accordion>
            </div>
        </>
    )
}

export default FoldersDropdownList
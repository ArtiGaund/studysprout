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
import { useDispatch, useSelector } from "react-redux";
import { ADD_FOLDER, SET_FOLDERS } from "@/store/slices/folderSlice";
import { RootState } from "@/store/store";
import Dropdown from "./dropdown";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { Folder as MongooseFolder} from "@/model/folder.model";
import { useFolder } from "@/hooks/useFolder";
import { ReduxFolder } from "@/types/state.type";
import { useFile } from "@/hooks/useFile";
import { useWorkspace } from "@/hooks/useWorkspace";
  


interface FoldersDropdownListProps{
    workspaceFolders: ReduxFolder[] | [];
    workspaceId: string; 
    onFolderAdded: () => void;
    usedWhere: "workspacePage" | "folderPage" | "sidebar";
}
const FoldersDropdownList:React.FC<FoldersDropdownListProps> = ({  workspaceId, onFolderAdded, usedWhere }) => {
    // 1) keep track of local state folders
    // set up real time updates => when another user create an update, we want real time update system setup
    // so it can create a folder for us in our localhost (i think i don't need it bz i am not doing collaborator 
    // part)
   
    const { folders, currentFolder, folderError,  createFolder, getFolders } = useFolder();
    const { files, getWorkspaceFiles } = useFile();
    const { toast } = useToast()
    const dispatch = useDispatch()
   const { currentWorkspace} = useWorkspace();


    //    useEffect for global data fetching    
    useEffect(() => {
        if(currentWorkspace?._id){
            getWorkspaceFiles(currentWorkspace?._id);
            getFolders(currentWorkspace?._id);
        }
    }, [currentWorkspace?._id, getFolders, getWorkspaceFiles])
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
                defaultValue={[ currentFolder?.toString() || '']}
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
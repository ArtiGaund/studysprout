'use client'
import { useAppState } from "@/lib/providers/state-provider";
import { Folder } from "@/model/folder.model";
import React, { useEffect, useState } from "react";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon } from "lucide-react";

interface FoldersDropdownListProps{
    workspaceFolders: Folder[] | [];
    workspaceId: string; 
}
const FoldersDropdownList:React.FC<FoldersDropdownListProps> = ({ workspaceFolders, workspaceId }) => {
    // 1) keep track of local state folders
    // set up real time updates => when another user create an update, we want real time update system setup
    // so it can create a folder for us in our localhost (i think i don't need it bz i am not doing collaborator 
    // part)
    const { state, dispatch } = useAppState()
    const [ folders, setFolders ] = useState(workspaceFolders)
    // 2)effect set initial state server app state
    useEffect(() => {
        if (workspaceFolders.length > 0) {
            dispatch({
                type: 'SET_FOLDERS',
                payload: {
                    workspaceId,
                    folders: workspaceFolders.map((folder) => ({
                        ...folder,
                        files:
                            state.workspaces
                            .find((workspace) => workspace._id === workspaceId)
                            ?.folders?.find((f) => f._id === folder._id)?.files || []
                    })) as Folder[]
                }
            })
        }
      }, [workspaceFolders, workspaceId]);
    // 3) state (updating our local states) to manage server data
    useEffect(() => {
        setFolders(state.workspaces.find((workspace) => workspace._id === workspaceId)
        ?.folders || []
    )
    }, [state])
    // 4) add folders

    const addFolderHandler = async () => {
        // this will create a visible folder quickly for the user on the frontend
        const newFolder: Folder = {
            data: undefined,
            createdAt: new Date(),
            title: 'Untitled',
            iconId: '📄',
            inTrash: undefined,
            workspaceId,
            bannerUrl: '',
          };
          dispatch({
            type: 'ADD_FOLDER',
            payload: { workspaceId, folder: { ...newFolder, files: [] } },
          });
    }

    return(
        <>
            <div className="flex sticky z-20 top-0 bg-background w-full h-10 group/title justify-between
             items-center pr-4 text-Neutrals/neutrals-8">
                <span className="font-bold text-Neutrals-8 text-xs">
                    FOLDERS
                </span>
                <TooltipComponent message="Create Folder">
                    <PlusIcon
                    onClick={addFolderHandler}
                     size={16}
                     className="group-hover/title:inline-block hidden cursor-pointer hover:dark:text-white"/>

                </TooltipComponent>
            </div>
        </>
    )
}

export default FoldersDropdownList
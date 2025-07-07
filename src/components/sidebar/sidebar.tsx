"use client"
// import getFolders from "@/utils/getFolders";
import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react"
import { twMerge } from "tailwind-merge";
import WorkspaceDropdown from "./workspace-dropdown";
import { WorkSpace } from "@/model/workspace.model";
import NativeNavigation from "./native-navigation";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "./folders-dropdown-list";
import { useDispatch, useSelector } from "react-redux";
import { SET_CURRENT_FOLDERS, SET_FOLDERS } from "@/store/slices/folderSlice";
// import { SET_CURRENT_WORKSPACES, SET_WORKSPACES } from "@/store/slices/workspaceSlice";
import { RootState } from "@/store/store";
import UserCard from "./user-card";
// import { Folder } from "@/types/folder";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useFolder } from "@/hooks/useFolder";
interface SidebarProps{
    params: { workspaceId: string};
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ params, className }) => {
    // const { data: session } = useSession()
    // const folders: Folder[] = useSelector((state: RootState) => state.folder.folders);
    // const currentFolderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    // const [ isLoading, setIsLoading ] = useState(false)
    // const [ error, setError ] = useState(false)
    // const [ allWorkspaces, setAllWorkspaces ] = useState([] as any)
    // const [ currenntWorkspace, setCurrentWorkspace ] = useState()
    // const dispatch = useDispatch()

    // 1. Call hooks
    const {
       workspaces,
       currentWorkspace,
       hasWorkspaces,
       getWorkspaces,
      fetchCurrentWorkspace,
      isLoadingWorkspaces,
      workspaceError
      } = useWorkspace();
    const { 
      folders,
      currentFolder,
      getFolders,
      isLoadingFolders,
      folderError, 
    } = useFolder();

    const router = useRouter()

      // 2. Effect for setting current workspace based on URL param
      useEffect(() => {
        if(params.workspaceId){
          fetchCurrentWorkspace(params.workspaceId)
        }
      },[params.workspaceId, fetchCurrentWorkspace])

    //   3. Effect for fetching folders based on workspaceId
      useEffect(()=> {
        if(params.workspaceId){
          getFolders(params.workspaceId)
        }
      },[params.workspaceId, getFolders])

    
    const handleFolderAdded = async () => {
      getFolders(params.workspaceId);
      // await fetchFolders(params.workspaceId)
    }

   
    if(workspaceError) router.replace('/dashboard')

    // check for user, check for folders, check for error, get all the workspaces which is private collaborating 
    // and shared workspaces
    return (<aside className={twMerge('hidden sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4 !justify-between',
      className
    )}>
        <div>
            { workspaces.length > 0 ? (
              <>
              <WorkspaceDropdown
              workspaces={workspaces}
              defaultValue={currentWorkspace}
              />
              <NativeNavigation myWorkspaceId={params.workspaceId}/>
              <ScrollArea className="overflow-scroll relative h-[450px]">
                  <div className="w-full pointer-events-none absolute bottom-0 h-20 bg-gradient-to-t
                   from-background to-transparent z-40"/>
                   <FoldersDropdownList 
                   workspaceFolders={folders || []}
                   workspaceId={params.workspaceId}
                   onFolderAdded={handleFolderAdded}
                   usedWhere="sidebar"
                   /> 
              </ScrollArea> 
            </>
              
          ) : (
            <p>Loading workspaces...</p>
          )} 
        </div>
        <UserCard />
    </aside>)
}

export default Sidebar
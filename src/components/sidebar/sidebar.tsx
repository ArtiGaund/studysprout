"use client"
// import getFolders from "@/utils/getFolders";
import axios from "axios";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge";
import WorkspaceDropdown from "./workspace-dropdown";
import { WorkSpace } from "@/model/workspace.model";
import NativeNavigation from "./native-navigation";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "./folders-dropdown-list";
import { useDispatch, useSelector } from "react-redux";
import { SET_CURRENT_FOLDER, SET_FOLDERS } from "@/store/slices/folderSlice";
// import { SET_CURRENT_WORKSPACES, SET_WORKSPACES } from "@/store/slices/workspaceSlice";
import { RootState } from "@/store/store";
import UserCard from "./user-card";
// import { Folder } from "@/types/folder";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
interface SidebarProps{
    params: { workspaceId: string};
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ params, className }) => {


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

    const { getWorkspaceFiles } = useFile();

    const router = useRouter()



      // 2. Effect for setting current workspace based on URL param
      useEffect(() => {
        console.log(`[Sidebar] useEffect (fetchCurrentWrorkspace) triggered. params.workspaceId = ${params.workspaceId}` )
        if(params.workspaceId){

          // async function to orchestrate multiple
            const fetchAllSidebarData = async () => {
              // 1. Fetch current workspace details (if not already current and in Redux)
              console.log(`[Sidebar] Initiating API call for fetchCurrentWorkspace for ${params.workspaceId}`);
              const workspaceResponse = await fetchCurrentWorkspace(params.workspaceId);
              if(!workspaceResponse.success){
                console.log(`[Sidebar] Failed to fetch current workspace ${params.workspaceId}: `, workspaceResponse.error);
                if(workspaceResponse.error && workspaceResponse.error !=='Workspace id required'){
                  router.replace(`/dashboard`);
                }
                return;
              }

              // 2. Fetch all folders for this workspace
              console.log(`[Sidebar] Initiating fetch for all folders in workspace:  ${params.workspaceId}`);

              await getFolders(params.workspaceId);

              // 3. fetch all files for this workspace( across all folders)
              console.log(`[Sidebar] Fetching all files for workspace:  ${params.workspaceId}`);
              await getWorkspaceFiles(params.workspaceId);
              
            }
          fetchAllSidebarData();


          
        }
      },[
        params.workspaceId, 
        fetchCurrentWorkspace,
        router,
        getFolders,
        getWorkspaceFiles
      ])

    //   3. Effect for fetching folders based on workspaceId
      // useEffect(()=> {
      //   console.log(`[Sidebar] useEffect (getFolders) triggered. params.workspaceId=${params.workspaceId}`);
      //   if(params.workspaceId){
         
      //       const fetchFolders = async () => {
      //         console.log(`[Sidebar] Initiating API call for getFolders for ${params.workspaceId}`);
      //         const response = await getFolders(params.workspaceId);
      //         if(!response.success){
      //           console.log(`[Sidebar] Failed to fetch folders for workspace ${params.workspaceId}: `, response.error);
      //         }
      //       }
      //     fetchFolders();
      //   }
      // },[params.workspaceId, getFolders])

      useEffect(() => {
        getWorkspaces();
      },[
        getWorkspaces
      ])
    
    const handleFolderAdded = async () => {
       console.log(`[Sidebar] handleFolderAdded triggered. Clearing ref and re-fetching folders for ${params.workspaceId}`);
      getFolders(params.workspaceId);
    }

   
    if(workspaceError) {
      console.error("[Sidebar] Workspace error detected, redirecting to dashboard:", workspaceError);
      router.replace('/dashboard')
      return null;
    }

    // Show loading state if workspaces are still loading
    if (isLoadingWorkspaces) {
        return (
            <aside className={twMerge('hidden sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4 !justify-between', className)}>
                <p>Loading workspaces...</p>
            </aside>
        );
    }


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
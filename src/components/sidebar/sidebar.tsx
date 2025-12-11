"use client"
import {  useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react"
import { twMerge } from "tailwind-merge";
import WorkspaceDropdown from "./workspace-dropdown";
import NativeNavigation from "./native-navigation";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "./folders-dropdown-list";
import UserCard from "./user-card";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
import SidebarExpandButton from "./sidebar-expand-button";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
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

    const { isRevisionSidebarOpen } = useRevisionSidebar();

      // 2. Effect for setting current workspace based on URL param
      useEffect(() => {
        if(params.workspaceId){

          // async function to orchestrate multiple
            const fetchAllSidebarData = async () => {
              // 1. Fetch current workspace details (if not already current and in Redux)
              const workspaceResponse = await fetchCurrentWorkspace(params.workspaceId);
              if(!workspaceResponse.success){
                if(workspaceResponse.error && workspaceResponse.error !=='Workspace id required'){
                  router.replace(`/dashboard`);
                }
                return;
              }

              // 2. Fetch all folders for this workspace
              await getFolders(params.workspaceId);

              // 3. fetch all files for this workspace( across all folders)
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

  

      useEffect(() => {
        getWorkspaces();
      },[
        getWorkspaces
      ])
    
    const handleFolderAdded = async () => {
      getFolders(params.workspaceId);
    }

   
    if(workspaceError) {
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
    return (<aside className={twMerge(`hidden sm:flex sm:flex-col
      ${isRevisionSidebarOpen ? 'w-[80px]' : 'w-[280px]'} shrink-0 p-4 md:gap-4 !justify-between`,
      className
    )}>
        <div>
            { workspaces.length > 0 ? (
              <>
              <SidebarExpandButton />
              {!isRevisionSidebarOpen && (<WorkspaceDropdown
              workspaces={workspaces}
              defaultValue={currentWorkspace}
              />)}
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
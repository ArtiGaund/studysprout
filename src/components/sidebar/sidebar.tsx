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
interface SidebarProps{
    params: { workspaceId: string};
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ params, className }) => {
    const { data: session } = useSession()
    const [ folders, setFolders ] = useState([] as any)
    const [ isLoading, setIsLoading ] = useState(false)
    const [ error, setError ] = useState(false)
    const [ allWorkspaces, setAllWorkspaces ] = useState([] as any)

    const router = useRouter()

    // console.log("Workspace id in Params in sidebar ",params.workspaceId)

   
    useEffect(() => {
      const fetchFolders = async (workspaceId: string) => {
        try {
          const response = await axios.get(`/api/get-all-workspace-folders?workspaceId=${workspaceId}`);
          // console.log("Response ",response)
          const fetchedFolders = response.data
          // console.log("fetchedFolders ",fetchedFolders)
          if(fetchedFolders){
              setFolders(fetchedFolders);
          }
        } catch (err) {
          console.log("Error fetching the folders ",err)
          setError(true)
        }
      }
      fetchFolders(params.workspaceId);
    }, [])
    
    // const userId = session?.user._id
    useEffect(() => {
        if(session && session.user && session.user._id){
          const fetchAllWorkspaces = async() => {
            const userId = session?.user._id
            // console.log("user id in sidebar ",userId)
            try {
              const response = await axios.get(`/api/get-all-workspaces?userId=${userId}`)
              const fetchedWorkspaces = response.data.data
              // console.log("fetchedWorkspaces ",fetchedWorkspaces)
              if(fetchedWorkspaces){
                setAllWorkspaces(fetchedWorkspaces)
              }
            } catch (err) {
              console.log("Error while fetching all the workspaces for user ",err)
              setError(true)
            }
          }
          fetchAllWorkspaces()
        }
            
      }, [session]);
    // getting all the folders for the workspace

      // console.log("All workspace of user ",allWorkspaces.data)
      // console.log("session ",session)
      
    // user is not login
    if(!session) return
    
    // console.log("default workspace ", allWorkspaces?.find((workspace:WorkSpace) => workspace._id === params.workspaceId))

    // check for the error
    if(error) router.replace('/dashboard')
    // check for user, check for folders, check for error, get all the workspaces which is private collaborating 
    // and shared workspaces
    return <aside className={twMerge('hidden sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4 !justify-between',
      className
    )}>
        <div>
          {session && allWorkspaces && allWorkspaces.length > 0 ? (
            <>
              <WorkspaceDropdown
              workspaces={allWorkspaces}
              defaultValue={
                allWorkspaces?.find((workspace:WorkSpace) => workspace._id === params.workspaceId)}
              />
              <NativeNavigation myWorkspaceId={params.workspaceId}/>
              <ScrollArea className="overflow-scroll relative h-[450px]">
                  <div className="w-full pointer-events-none absolute bottom-0 h-20 bg-gradient-to-t
                   from-background to-transparent z-40"/>
                   <FoldersDropdownList 
                   workspaceFolders={folders || []}
                   workspaceId={params.workspaceId}
                   /> 
              </ScrollArea>
            </>
              
          ) : (
            <p>Loading workspaces...</p>
          )

          }
            
        </div>
    </aside>
}

export default Sidebar
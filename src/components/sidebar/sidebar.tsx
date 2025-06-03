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
import { SET_CURRENT_WORKSPACES, SET_WORKSPACES } from "@/store/slices/workspaceSlice";
import { RootState } from "@/store/store";
import UserCard from "./user-card";
interface SidebarProps{
    params: { workspaceId: string};
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ params, className }) => {
    const { data: session } = useSession()
    const folders = useSelector((state: RootState) => state.folder.folders);
    const currentFolderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    const [ isLoading, setIsLoading ] = useState(false)
    const [ error, setError ] = useState(false)
    const [ allWorkspaces, setAllWorkspaces ] = useState([] as any)
    const [ currenntWorkspace, setCurrentWorkspace ] = useState()
    const dispatch = useDispatch()

    const router = useRouter()

    // console.log("Workspace id in Params in sidebar ",params.workspaceId)

  //  console.log("Folders in sidebar ",folders)
    useEffect(() => {
      fetchFolders(params.workspaceId);
    }, [params.workspaceId]);
    
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
                dispatch(SET_WORKSPACES(fetchedWorkspaces))
              }
            } catch (err) {
              console.log("Error while fetching all the workspaces for user ",err)
              setError(true)
            }
          }
          fetchAllWorkspaces()
        }
            
      }, [session, dispatch]);

      // setting the current workspace 
      useEffect(() => {
        const getCurrentWorkspace = async () => {
          try {
            const currentWorkspaceId = params.workspaceId
          const response = await axios.get(`/api/get-current-workspace?workspaceId=${currentWorkspaceId}`)
          // console.log("Response for current workspace ",response.data.data)
          setCurrentWorkspace(response.data.data)
          dispatch(SET_CURRENT_WORKSPACES(response.data.data))
          } catch (error) {
            console.log("Error while fetching current workspace ",error)
          }

        }
        getCurrentWorkspace()
      }, [params.workspaceId, dispatch])
    // getting all the folders for the workspace

    // its an callback method, when folder is added from folder-dropdown-list component, this method is called 
    // to update the workspaceFolders props
    const handleFolderAdded = async () => {
      await fetchFolders(params.workspaceId)
    }

    const fetchFolders = async (workspaceId: string) => {
      try {
        // console.log("Inside fetchFolders")
        const response = await axios.get(`/api/get-all-workspace-folders?workspaceId=${workspaceId}`);
        // console.log("Response for fetch folders ",response)
        const fetchedFolders = response.data.data
        // console.log("fetchedFolders ",fetchedFolders)
        
        if(fetchedFolders){
            dispatch(SET_FOLDERS(fetchedFolders))
            if(fetchFolders.length > 0 && !currentFolderId ){
              dispatch(SET_CURRENT_FOLDERS(fetchedFolders[0]))
            }
        }
      } catch (err) {
        console.log("Error fetching the folders ",err)
        setError(true)
      }
    }
      
    // user is not login
    if(!session) return
    

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
              defaultValue={currenntWorkspace}
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
          )

          }
            
        </div>
        <UserCard />
    </aside>
}

export default Sidebar
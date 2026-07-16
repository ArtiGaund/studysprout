/**
 * @component Sidebar
 * @description The primary navigation controller for the application. 
 * It synchronizes global workspace state with the UI and handles the logic 
 * for a collapsible "Revision Mode" sidebar.
 * * Key Functionality:
 * - Redux Synchronization: Selects workspaces, current folder context, and nested folder structures.
 * - Dynamic Layout: Responds to `isRevisionSidebarOpen` from the Revision Provider to toggle width (80px vs 280px).
 * - Safety Logic: Implements automated redirection to `/dashboard` if workspace errors occur.
 * - Performance: Uses memoized selector factories (`makeSelectFolders`) to optimize nested list rendering.
 */
"use client";

import {  useRouter } from "next/navigation";
import React, { useMemo } from "react"
import { twMerge } from "tailwind-merge";
import WorkspaceDropdown from "./workspace-dropdown";
import NativeNavigation from "./native-navigation";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "./folders-dropdown-list";
import UserCard from "./user-card";
import SidebarExpandButton from "./sidebar-expand-button";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { useSelector } from "react-redux";
import { 
  selectCurrentWorkspace, 
  selectWorkspaceError, 
  selectWorkspaceLoading, 
  selectWorkspaces 
} from "@/store/selectors/workspaceSelector";
import { makeSelectFolders } from "@/store/selectors/folderSelector";
import { ReduxFolder } from "@/types/state.type";
import { RootState } from "@/store/store";

interface SidebarProps{
    params: { workspaceId: string};
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ params, className }) => {
    const router = useRouter()

    // --- WORKSPACE STATE ---
    const workspaces = useSelector(selectWorkspaces);
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const workspaceLoading = useSelector(selectWorkspaceLoading);
    const workspaceError = useSelector(selectWorkspaceError);

    const workspaceId = params.workspaceId;
    const isWorkspaceSynced = currentWorkspace?._id === workspaceId;
    // --- FOLDER STATE ---
    // Using a memoized selector factory to handle folder retrieval for the specific active workspace
    const selectFolders = useMemo(makeSelectFolders,[]);
    const EMPTY_FOLDER: ReduxFolder[] = [];

    const folders = useSelector((state: RootState) =>
    workspaceId ? selectFolders(state, workspaceId) : EMPTY_FOLDER
    );


    // --- UI/UX STATE ---
    // Controls the "Collapsed" state when the user is in Revision/Study mode
    const { isRevisionSidebarOpen } = useRevisionSidebar();
   
    /** * @guard Error Handling
     * Redirects the user back to the main dashboard if a workspace fails to load 
     * or an invalid ID is provided in the URL.
     */
    if(workspaceError) {
      router.replace('/dashboard')
      return null;
    }

    /**
     * @render LoadingState
     * Prevents UI flickering by showing a clean skeleton/loading aside while
     * workspace metadata is being hydrated from Redux.
     */
    if (workspaceLoading || !isWorkspaceSynced) {
        return (
            <aside className={twMerge('hidden sm:flex sm:flex-col shrink-0 p-4',
             'md:gap-4 !justify-between w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px]', 
             className)}>
                <p>Loading workspaces...</p>
            </aside>
        );
    }


    // check for user, check for folders, check for error, get all the workspaces which is private collaborating 
    // and shared workspaces
    return (<aside className={twMerge(
      `hidden sm:flex flex-col  shrink-0 p-4 md:gap-4 !justify-between transition-all
       duration-300  bg-[#080C0C] border-r border-white/5 h-full',
       ${isRevisionSidebarOpen 
        ? 'w-[80px]' 
        : 'w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px]'
      }
     `,
      className
    )}>
        <div className="flex-1 flex flex-col min-h-0">
            { workspaces.length > 0 && currentWorkspace ? (
              <>
              {/* Expansion Trigger: Allows users to toggle sidebar width */}
              <SidebarExpandButton />

              {/* Workspace Selector: Only visible in expanded mode for better UX */}
              {!isRevisionSidebarOpen && (
                <WorkspaceDropdown workspaces={workspaces} defaultValue={currentWorkspace}/>
              )}

              {/* Main Navigation: Links to Home, Trash, and Settings */}
              <NativeNavigation myWorkspaceId={params.workspaceId}/>

              {/* Hierarchical Folder List: Wrapped in ScrollArea for deep structures */}
              <ScrollArea 
              // className="overflow-scroll relative h-[450px]"
              className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollable"
              >
                  <div className="w-full pointer-events-none absolute bottom-0 h-20 bg-gradient-to-t
                   from-[#080C0C] to-transparent z-40"/>
                   <FoldersDropdownList 
                      workspaceFolders={folders || []}
                      workspaceId={params.workspaceId}
                      usedWhere="sidebar"
                   /> 
              </ScrollArea> 
            </>
              
          ) : (
            <p>Loading workspaces...</p>
          )} 
        </div>

        {/* Profile & Account Settings: Fixed to the bottom of the sidebar */}
        <UserCard />
    </aside>)
}

export default Sidebar
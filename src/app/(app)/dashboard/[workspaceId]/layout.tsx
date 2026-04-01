/**
 * WORKSPACE SHARED LAYOUT
 * -----------------------
 * Role: Parent wrapper for all routes inside a specific workspace.
 * * Key Responsibilities:
 * 1. Data Initialization: Triggers parallel fetching of Folders, Files, and Flashcard sets.
 * 2. State Isolation: Clears Redux state (Folders/Files) when switching between workspace to
 * prevent "zombie data" from appearing.
 * 3. Persistence: Updates 'Last Active Workspace' in LocalStorage for the user.
 * 4. Real-time: Initialize the <WorkspaceSocketManager /> for collaboration.
 */
'use client';

import React, { useEffect, useRef } from "react";
import Sidebar from "@/components/sidebar/sidebar";
import MobileSidebar from "@/components/sidebar/mobile-sidebar";
import RevisionSidebar from "@/components/revision/revision-sidebar";
import { setLastWorkspace } from "@/lib/local-storage-workspace";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
import { useDispatch, useSelector } from "react-redux";
import { selectUserId } from "@/store/selectors/userSelector";
import { useFlashcardSet } from "@/hooks/flashcard/useFlashcardSet";
import { CLEAR_WORKSPACE_FOLDERS } from "@/store/slices/folderSlice";
import { clearFlashcards } from "@/store/slices/flashcardSlice";
import { RESET_FILES } from "@/store/slices/fileSlice";
import { SET_WORKSPACE_LOADING } from "@/store/slices/workspaceSlice";
import { WorkspaceSocketManager } from "@/components/socket/workspace-socket-manager";
interface LayoutProps{
    children: React.ReactNode,
    params: any
}

const Layout: React.FC<LayoutProps> = ({ children, params }) => {

    // Ref to track which workspace is currently loaded to avoid redundant fetches
    const hasLoadedWorkspaceRef = useRef<string | null>(null);

    const dispatch = useDispatch();
    const userId = useSelector(selectUserId);

    // Custom Hooks for Data fetching
    const {
        fetchCurrentWorkspace,
        getWorkspaces
    } = useWorkspace();
    const {
        getFolders
    } = useFolder();
    const {
        getWorkspaceFiles
    } = useFile();
    const {
        getFlashcardSets
    } = useFlashcardSet(params.workspaceId);
    
    /** * EFFECT: Workspace Data fetching & Cleanup
     * Logic runs whenever the workspaceId in the URL changes.
     */
    useEffect(() => {
        if(!userId || !params.workspaceId) return;

        const currentWorkspaceId = params.workspaceId;

       const performLoad = async () => {
            dispatch(SET_WORKSPACE_LOADING(true));
            
            // CLEANUP PHASE: If we are moving to a NEW Workspace, clear the old state
            if(hasLoadedWorkspaceRef.current !== currentWorkspaceId){
                dispatch(RESET_FILES());
                if(hasLoadedWorkspaceRef.current){
                    dispatch(CLEAR_WORKSPACE_FOLDERS(hasLoadedWorkspaceRef.current));
                }

                dispatch(clearFlashcards());
            }

         hasLoadedWorkspaceRef.current = currentWorkspaceId;
         try {
                //FETCH PHASE: Load all workspace resources in parallel for speed 
                await Promise.all([
                    fetchCurrentWorkspace(currentWorkspaceId),
                    getFolders(currentWorkspaceId),
                    getWorkspaceFiles(currentWorkspaceId),
                    getWorkspaces(),
                    getFlashcardSets(currentWorkspaceId),
                ]);
                // Persist the user's choice for their next session
                 setLastWorkspace(userId, currentWorkspaceId);
            } catch (error) {
                console.error("Layout Load Error: ",error);
            }finally{
                dispatch(SET_WORKSPACE_LOADING(false));
            }
         
       }

        // Trigger load only if it's a new ID or first load   
        if(hasLoadedWorkspaceRef.current !== currentWorkspaceId){
            performLoad();
        }
    },[
        params.workspaceId,
        userId,
        dispatch,
    ])
    return(
        <main className="flex overflow-hidden h-screen w-screen">
            <WorkspaceSocketManager />
            <Sidebar params={params} />
            <div className="border-neutral-12/70 border-l-[1px] relative overflow-scroll">
                 <RevisionSidebar params={params}/>
            </div>
           
            <MobileSidebar>
                <Sidebar 
                params={params}
                className="w-screen inline-block sm:hidden"
                />
            </MobileSidebar>
            <div className="border-neutral-12/70 border-l-[1px] w-full relative overflow-scroll">
                {children}
            </div>
        </main>
    )
}

export default Layout
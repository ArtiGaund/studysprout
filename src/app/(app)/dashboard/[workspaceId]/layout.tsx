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
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { useLastStudied } from "@/hooks/useLastSudied";
import { WorkspaceSocketProvider } from "@/lib/providers/workspace-socket-context";
import { Sheet } from "@/components/ui/sheet";
import FlashcardSetViewerSheet from "@/components/flashcard/flashcard-set-viewer-sheet";
import FlashcardTypesForm from "@/components/flashcard/flashcard-types-form";

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

    // Sheet-related state now lives at layout level through context, not inside 
    // RevisionSidebar - this keep the Sheets out of MobileSidebar's DOM substree.
    const { 
        isRevisionSidebarOpen,
        flashcardSetViewerId,
        closeFlashcardSetViewerSheet, 
        isFlashcardTypeSheetOpen,
        closeFlashcardTypeSheet,
    } = useRevisionSidebar();

    const { fetchLastStudied } = useLastStudied();
    
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
                    fetchCurrentWorkspace(currentWorkspaceId, true),
                    getFolders(currentWorkspaceId),
                    getWorkspaceFiles(currentWorkspaceId),
                    getWorkspaces(),
                    getFlashcardSets(currentWorkspaceId),
                    fetchLastStudied(),
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
    ]);

    return(
        <WorkspaceSocketProvider>
            <main className="flex overflow-hidden h-screen w-screen">
                <WorkspaceSocketManager />
                <Sidebar params={params} className="hidden sm:flex" />

                {isRevisionSidebarOpen && (
                    <div className="hidden sm:flex shrink-0 border-neutral-12/70 border-l-[1px]
                     relative overflow-scroll">
                        <RevisionSidebar params={params}/>
                    </div>
                )}
            
                <MobileSidebar
                    revisionContent={
                        <RevisionSidebar 
                            params={params}
                            className="flex"
                        />
                    }
                >
                    <Sidebar 
                    params={params}
                    className="w-full flex h-full"
                    />
                </MobileSidebar>
                
                <div className="border-neutral-12/70 border-l-[1px] w-full relative 
                overflow-scroll">
                    {children}
                </div>
            </main>

            {/* 
                Both Sheets rendered here - as siblings of MobileSidebar, not descendants of
                it. Redix portals their overlay/content to document.body regardless, but
                keeping the "trigger tree" outside the manually-translated <aside> means
                 their's no longer a conflicting stacking context or competing pointer-events owner.
            */}
            <Sheet
                open={!!flashcardSetViewerId}
                onOpenChange={(open) => {
                    if(!open) closeFlashcardSetViewerSheet();
                }}
            >
                {flashcardSetViewerId && 
                    <FlashcardSetViewerSheet setId={flashcardSetViewerId}/>
                }
            </Sheet>

            <Sheet
                open={isFlashcardTypeSheetOpen}
                onOpenChange={(open) => {
                    if(!open) closeFlashcardTypeSheet();
                }}
            >
                <FlashcardTypesForm />
            </Sheet>
        </WorkspaceSocketProvider>
    )
}

export default Layout
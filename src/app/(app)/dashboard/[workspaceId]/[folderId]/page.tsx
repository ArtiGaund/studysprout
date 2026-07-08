/**
 * FOLDER OVERVIEW PAGE
 * -----------------------
 * Role: Renders the dashboard for a specific folder within a workspace
 * * Key Responsibilities:
 * 1. Data Sync: Matches the 'folderId' from the URL with the local Redux store.
 * 2. Navigation Guard: If the folder doesn't exist in the current workspace,
 * it redirects the user back to the workspace root.
 * 3. Context Management: Updates the global 'Current Resource' to facilitate breadcrumbs. 
 */
"use client"
import { NavHeader } from '@/components/banner-upload/nav-header'
import { FolderFileList } from '@/components/folder-view/folder-file-list'
import { FolderOverviewHeader } from '@/components/folder-view/folder-overview-header'
import { FolderStatsRow } from '@/components/folder-view/folder-stats-row'
import { SmartAction } from '@/components/folder-view/smart-action'
import { WeeklyLearningGoal } from '@/components/folder-view/weekly-learning-goal'
import { RelationshipGraph } from '@/components/dashboard-shared/relationship-graph'
import { 
    makeSelectFolders, 
    selectCurrentFolder, 
    selectFolderLoading 
} from '@/store/selectors/folderSelector'
import { SET_CURRENT_FOLDER } from '@/store/slices/folderSlice'
import { RootState } from '@/store/store'
import { ReduxFolder } from '@/types/state.type'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectFiles } from "@/store/selectors/fileSelector";
import { ReduxFile } from "@/types/state.type";
import { FlashcardSection } from '@/components/dashboard-shared/flashcard-section'

const FolderPage: React.FC<{ 
    params : {
        workspaceId: string,
         folderId: string 
        }
}> = ({ params }) => {
    const router = useRouter()
    const dispatch = useDispatch();
   
    // Memoized selectors for performance
    const selectFolders = useMemo(makeSelectFolders,[]);
    const EMPTY_FOLDER: ReduxFolder[] = [];

    const folders = useSelector((state: RootState) =>
        params.workspaceId ? selectFolders(state, params.workspaceId) : EMPTY_FOLDER
    );

    const currentFolder = useSelector(selectCurrentFolder);
    const folderLoading = useSelector(selectFolderLoading);

    // Guard: Verify if the currently selected folder matches the URL
    const isCorrectFolder = currentFolder?._id === params.folderId;
    const EMPTY_FILE: ReduxFile[] = [];
    
    const files = useSelector((state: RootState) => 
        params.folderId ? selectFiles(state, params.folderId) : EMPTY_FILE
    );
    
    const filteredFiles = useMemo(() => {
        if(Array.isArray(files)){
            return files.filter(file =>
                (file.inTrash === undefined || file.inTrash === null || file.inTrash === "")
            );
        }
        return [];
    },[
        files,
    ]);

    

    /** * EFFECT: Folder Data Synchronization
     * Ensures Redux state reflects the folder being viewed in the URL
     */
    useEffect(() => {
      const folder = folders.find(
            f => f._id === params.folderId
        );

        if(folder && currentFolder?._id !== params.folderId){
            dispatch(SET_CURRENT_FOLDER(folder));
        }
    }, [
        params.folderId,
        folders,
        currentFolder?._id,
    ])

    /** * EFFECT: Deletion/Safety Guard
     * If the folder is deleted or not found, redirect to the parent workspace.
     */
    useEffect(() => {
        if(!folderLoading && folders.length > 0){
            const folderExists = folders.some(f => f._id === params.folderId);
            if(!folderExists){
                router.replace(`/dashboard/${params.workspaceId}`);
            }
        }
    },[
        folderLoading,
        folders,
        params.folderId,
        params.workspaceId,
        router
    ])

    //  --- RENDER STATES ---
    if(folderLoading || !isCorrectFolder){
        return(
            <div className='flex justify-center items-center h-full'>
                Loading folder...
            </div>
        )
    }

    if(!currentFolder || currentFolder._id !== params.folderId){
        return (
            <div className='flex justify-center items-center h-full'>
                Syncing folder data...
            </div>
        )
    }
    return (
        <div className='flex flex-col gap-y-8 pb-10 overflow-x-hidden'>
            {currentFolder && (
                <NavHeader 
                dirType="folder"
                fileId={params.folderId}
                dirDetails={currentFolder}
                />
            )}
            <div className='px-4 sm:px-6 lg:px-10 flex flex-col gap-y-10 max-w-[1600px] mx-auto w-full'>
                <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch'>
                    {/*Left Column */}
                    <div className='lg:col-span-3 flex flex-col gap-y-6'>
                        {/* Header */}
                        <FolderOverviewHeader 
                            folder={currentFolder}
                            filesLength={filteredFiles.length ?? 0}
                        />
                        {/* Stats */}
                        <FolderStatsRow />
                        {/* Search & File List Placeholder */}
                        <FolderFileList 
                            workspaceId={params.workspaceId}
                            folderId={params.folderId}
                            files={filteredFiles}
                        />

                        <div className='mt-4'>
                            <WeeklyLearningGoal 
                                folderId={params.folderId} 
                                workspaceId={params.workspaceId}
                            />
                        </div>
                    </div>
                    {/* Right Column */}
                    <aside className='lg:col-span-1 flex flex-col gap-y-4 lg:sticky lg:top-4
                    lg:max-h-[calc(100vh-2em)] lg:overflow-y-auto'>
                        {/* Graph */}
                        <RelationshipGraph level="folder"/>

                        {/* Folder Flashcards Header */}
                        <div 
                         className="bg-purple-900/10 border border-purple-500/20 rounded-2xl
                          p-5 flex flex-col gap-y-4"
                        >
                            <div className='flex items-center justify-center gap-x-2'>
                                <span className='text-[10px] font-bold text-zinc-500 
                                tracking-widest uppercase'>
                                    Folder Flashcards
                                </span>
                                <span className='bg-purple-600 text-[10px] px-2 py-0.5 rounded
                                font-bold text-zinc-300'>
                                    CORE
                                </span>
                            </div>
                            <FlashcardSection 
                                workspaceId={params.workspaceId}
                                folderId={params.folderId}
                            />
                        </div>
                        <SmartAction folderId={params.folderId} />
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default FolderPage
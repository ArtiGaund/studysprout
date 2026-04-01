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
import BannerSection from '@/components/banner-upload/banner-section'
import DashboardOverview from '@/components/dashboard-overview/dashboard-overview'
import { 
    makeSelectFolders, 
    selectCurrentFolder, 
    selectFolderLoading 
} from '@/store/selectors/folderSelector'
import { SET_CURRENT_FOLDER } from '@/store/slices/folderSlice'
import { RootState } from '@/store/store'
import { ReduxFolder } from '@/types/state.type'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

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
        folders
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
        <div className='relative'>
            { currentFolder && (
                <BannerSection
                dirType='folder'
                fileId={params.folderId}
                dirDetails={currentFolder}
                ></BannerSection>
            )}
            <div>
                { currentFolder && (
                    <DashboardOverview 
                    dirDetails={currentFolder}
                    fileId={params.folderId}
                    dirType='folder'
                    params={params.folderId}
                />
                )}
            </div>
        </div>
    )
}

export default FolderPage
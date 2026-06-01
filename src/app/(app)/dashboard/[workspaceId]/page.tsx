/**
 * WORKSPACE OVERVIEW PAGE
 * -----------------------
 * Role: The default landing view for a specific workspace.
 * * Functions:
 * 1. Context Synchronization: Updates the 'Current Resouce' context for breadcrumbs/sidebar.
 * 2. Visual Layout: Renders the Banner, Dashboard Overview (Title/Emoji), and Resource Stats.
 * 3. Loading Safety: Ensures UI components only render once Redux data matches the URL. 
 */

"use client";
import { SET_CURRENT_RESOURCE } from '@/store/slices/contextSlice'
import { RootState } from '@/store/store'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
    selectCurrentWorkspace, 
    selectWorkspaceLoading 
} from '@/store/selectors/workspaceSelector'
import { NavHeader } from '@/components/banner-upload/nav-header'
import { SystemOverviewHeader } from '@/components/workspace-view/system-overview-header';
import { MetricsOverview } from '@/components/workspace-view/metrics-overview';

const WorkspacePage: React.FC<{ params : { workspaceId: string }}> = ({ params }) => {
    const dispatch = useDispatch();

    // Selectors fro Redux Store
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const workspaceLoading = useSelector(selectWorkspaceLoading);
    const globalEditingItems = useSelector((state: RootState) => state.ui.editingItem);

    // Guard: Verify if the Redux data actually belongs to the workspace in the URL
     const isDataReady = currentWorkspace?._id === params.workspaceId;

     /** * EFFECT: Context Update
      * Update the global breadcrumbs/sidebar context so the UI knows we are currently viewing this
      * specific Workspace resouce.
      */
    useEffect(() => {
       
            if(isDataReady){
                dispatch(SET_CURRENT_RESOURCE({
                    id: currentWorkspace._id,
                    title: currentWorkspace.title,
                    type: 'Workspace'
                }));
            }
    }, [
        params.workspaceId,
        isDataReady
    ]);

   
    // --- CONDITIONAL RENDERING ---    
    if (
       workspaceLoading ||
       !isDataReady
    ) {
        return (
            <div className='flex justify-center items-center h-full'>
                Loading workspace details ...
            </div>
        );
    }
    return (
        <div className='flex flex-col gap-y-8 pb-10'>
            {currentWorkspace && (
                <NavHeader 
                    dirType='workspace'
                    fileId={params.workspaceId}
                    dirDetails={currentWorkspace}
                />
            )}
            <div className='px-4 sm:px-6 lg:px-10 flex flex-col gap-y-10 max-w-[1600px] mx-auto w-full'>
                <SystemOverviewHeader workspaceId={params.workspaceId}/>
                <MetricsOverview workspaceId={params.workspaceId}/>
            </div>
        </div>
    )
}

export default WorkspacePage
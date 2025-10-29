"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import DashboardOverview from '@/components/dashboard-overview/dashboard-overview'
import { useWorkspace } from '@/hooks/useWorkspace'
import { SET_CURRENT_RESOURCE } from '@/store/slices/contextSlice'
import { RootState } from '@/store/store'
import { ReduxWorkSpace } from '@/types/state.type'
import { transformWorkspace } from '@/utils/data-transformers'
// import { WorkSpace } from '@/model/workspace.model'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const WorkspacePage: React.FC<{ params : { workspaceId: string }}> = ({ params }) => {
    const router = useRouter()
    const dispatch = useDispatch();
    const {
        //  currentWorkspaceDetails, 
         currentWorkspace, 
         isLoadingWorkspaces,
         fetchCurrentWorkspace
         } = useWorkspace();

    const globalEditingItems = useSelector((state: RootState) => state.ui.editingItem);

    useEffect(() => {
         console.log(`[WorkspacePage] useEffect triggered. params.workspaceId = ${params.workspaceId}`);
        // Only proceed if workspaceId is valid
            if (!params.workspaceId) {
                console.log("[WorkspacePage] No workspaceId in params, skipping fetch.");
                return;
            }

            // If the currentWorkspace from Redux already matches the ID of params and it's not currently loading,
            // Skip the fetch
            if(currentWorkspace && currentWorkspace._id === params.workspaceId && !isLoadingWorkspaces){
                console.log("[WorkspacePage] currentWorkspace already matches params.workspaceId, skipping fetch.");
                dispatch(SET_CURRENT_RESOURCE({
                    id: currentWorkspace._id,
                    title: currentWorkspace.title,
                    type: 'Workspace',
                }))
                return;
            }
            
        const getWorkspaceDetails = async () => {
             console.log(`[WorkspacePage] Initiating fetch for workspace: ${params.workspaceId}`);
                const response = await fetchCurrentWorkspace(params.workspaceId); 
                if (!response.success) {
                    console.log(`[WorkspacePage] Failed to fetch workspace ${params.workspaceId}: `, response.error);
                    router.push('/dashboard'); // Redirect if workspace not found
                } else if(response.data){
                    const fetchedWorkspace = response.data as ReduxWorkSpace;
                     dispatch(SET_CURRENT_RESOURCE({
                            id: fetchedWorkspace._id,
                            title: fetchedWorkspace.title,
                            type: 'Workspace',
                        }))
                    }
              
        };
        getWorkspaceDetails();
    }, [
        params.workspaceId,
         router,  
         fetchCurrentWorkspace,
         currentWorkspace,
         isLoadingWorkspaces,
         dispatch
    ]);

    // Loading State
    if (isLoadingWorkspaces || !currentWorkspace || currentWorkspace._id !== params.workspaceId) {
        return (
            <div className='flex justify-center items-center h-full'>
                Loading workspace details ...
            </div>
        );
    }
    return (
        <div className='relative'>
            {currentWorkspace && (
                <BannerSection 
                    dirType="workspace"
                    fileId={params.workspaceId}
                    dirDetails={currentWorkspace}
                />
            )}
           <div>
            { currentWorkspace && (
                <DashboardOverview 
                dirDetails={currentWorkspace}
                fileId={params.workspaceId}
                dirType='workspace'
                params={params.workspaceId}
                globalEditingItem={globalEditingItems}
                />
            )}
           </div>
        </div>
    )
}

export default WorkspacePage
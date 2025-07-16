"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import DashboardOverview from '@/components/dashboard-overview/dashboard-overview'
import { useWorkspace } from '@/hooks/useWorkspace'
import { RootState } from '@/store/store'
import { ReduxWorkSpace } from '@/types/state.type'
import { transformWorkspace } from '@/utils/data-transformers'
// import { WorkSpace } from '@/model/workspace.model'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

const WorkspacePage: React.FC<{ params : { workspaceId: string }}> = ({ params }) => {
    const router = useRouter()
    // const [ workspaceDetails, setWorkspaceDetails ] = useState<ReduxWorkSpace | undefined>(undefined)

    const {
         currentWorkspaceDetails, 
         currentWorkspace, 
         isLoadingWorkspaces,
         fetchCurrentWorkspace
         } = useWorkspace();

    const globalEditingItems = useSelector((state: RootState) => state.ui.editingItem);

    const hasFetchedWorkspaceDetails = useRef<Set<string>>(new Set());
    useEffect(() => {
        const getWorkspaceDetails = async () => {
            // Only proceed if workspaceId is valid
            if (!params.workspaceId) {
                console.log("[WorkspacePage] No workspaceId in params, skipping fetch.");
                return;
            }

            // Check if this workspace's details have already been fetched by this component instance
            // This prevents redundant API calls on re-renders
            if (hasFetchedWorkspaceDetails.current.has(params.workspaceId)) {
                console.log(`[WorkspacePage] Skipping initial fetch for workspace ${params.workspaceId}: already fetched by this page.`);
                return;
            }

            // Only fetch workspace details if currentWorkspace is not set in Redux
            // OR if the currentWorkspace in Redux doesn't match the workspaceId from params
            if (!currentWorkspace || currentWorkspace._id !== params.workspaceId) {
                console.log(`[WorkspacePage] Initiating fetch for workspace: ${params.workspaceId}`);
                // Use fetchCurrentWorkspace from useWorkspace hook, which handles Redux dispatch internally
                const response = await fetchCurrentWorkspace(params.workspaceId); 
                if (!response.success) {
                    router.push('/dashboard'); // Redirect if workspace not found
                } else {
                    // Mark as fetched only upon successful API call and Redux dispatch
                    hasFetchedWorkspaceDetails.current.add(params.workspaceId);
                }
            }
        };
        getWorkspaceDetails();
    }, [params.workspaceId, router, currentWorkspace, fetchCurrentWorkspace]);

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
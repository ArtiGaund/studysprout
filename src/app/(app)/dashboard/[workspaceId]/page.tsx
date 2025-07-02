"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import DashboardOverview from '@/components/dashboard-overview/dashboard-overview'
import { useWorkspace } from '@/hooks/useWorkspace'
import { ReduxWorkSpace } from '@/types/state.type'
import { transformWorkspace } from '@/utils/data-transformers'
// import { WorkSpace } from '@/model/workspace.model'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const WorkspacePage: React.FC<{ params : { workspaceId: string }}> = ({ params }) => {
    const router = useRouter()
    const [ workspaceDetails, setWorkspaceDetails ] = useState<ReduxWorkSpace | undefined>(undefined)

    const { currentWorkspaceDetails} = useWorkspace();

    useEffect(() => {
        const getWorkspaceDetails = async () => {
            try {
                const response = await currentWorkspaceDetails(params.workspaceId)
                if(!response.success){
                    router.push('/dashboard')
                } else {
                    if(response.data){
                        const workspace = transformWorkspace(response.data);
                        setWorkspaceDetails(workspace);
                    }else{
                        setWorkspaceDetails(undefined)
                    }
                    
                }
            } catch (error) {
                console.log("Error while fetching workspace details ", error)
            }
        }
        getWorkspaceDetails()
    }, [params.workspaceId, router])

    return (
        <div className='relative'>
            {workspaceDetails && (
                <BannerSection 
                    dirType="workspace"
                    fileId={params.workspaceId}
                    dirDetails={workspaceDetails}
                />
            )}
           <div>
            { workspaceDetails && (
                <DashboardOverview 
                dirDetails={workspaceDetails}
                fileId={params.workspaceId}
                dirType='workspace'
                params={params.workspaceId}
                />
            )}
           </div>
        </div>
    )
}

export default WorkspacePage
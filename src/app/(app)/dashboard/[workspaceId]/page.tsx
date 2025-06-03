"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import DashboardOverview from '@/components/dashboard-overview/dashboard-overview'
import { WorkSpace } from '@/model/workspace.model'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const WorkspacePage: React.FC<{ params : { workspaceId: string }}> = ({ params }) => {
    const router = useRouter()
    const [ workspaceDetails, setWorkspaceDetails ] = useState<WorkSpace | undefined>(undefined)


    useEffect(() => {
        const getWorkspaceDetails = async () => {
            try {
                const response = await axios.get(`/api/get-current-workspace?workspaceId=${params.workspaceId}`)
                if(!response.data.success){
                    router.push('/dashboard')
                } else {
                    setWorkspaceDetails(response.data.data)
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
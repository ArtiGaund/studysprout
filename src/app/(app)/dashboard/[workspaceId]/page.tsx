"use client"
import TextEditor from '@/components/text-editor/text-editor'
import { WorkSpace } from '@/model/workspace.model'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const WorkspacePage = ({ params }: { params: { workspaceId: string }}) => {
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
    }, [params.workspaceId])

    return (
        <div className='relative'>
            {workspaceDetails && (
                <TextEditor 
                    dirType="workspace"
                    fileId={params.workspaceId}
                    dirDetails={workspaceDetails}
                />
            )}
        </div>
    )
}

export default WorkspacePage
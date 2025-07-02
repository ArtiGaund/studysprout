"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import DashboardOverview from '@/components/dashboard-overview/dashboard-overview'
import { useFolder } from '@/hooks/useFolder'
import { ReduxFolder } from '@/types/state.type'
import { transformFolder } from '@/utils/data-transformers'
// import { Folder } from '@/model/folder.model'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { RootProps } from 'postcss'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const FolderPage: React.FC<{ params : { folderId: string }}> = ({ params }) => {
    const router = useRouter()
    const [ folderDetails, setFolderDetails ] = useState<ReduxFolder | undefined>(undefined)
    const { currentFolderDetail } = useFolder();

    useEffect(() => {
        const getFolderDetails = async() => {
            try {
                // const response = await axios.get(`/api/get-current-folder?folderId=${params.folderId}`)
                const response = await currentFolderDetail(params.folderId)
                if(!response.success){
                    router.push('/dashboard')
                }else{
                    if(response.data){
                        const folder = transformFolder(response.data);
                        setFolderDetails(folder);
                    }else{
                        setFolderDetails(undefined);
                    }
                }
            } catch (error) {
                console.log("Error while fetching all the folders details ",error)

            }
        }
        getFolderDetails()
    }, [params.folderId, router])

    return (
        <div className='relative'>
            { folderDetails && (
                <BannerSection
                dirType='folder'
                fileId={params.folderId}
                dirDetails={folderDetails}
                ></BannerSection>
            )}
            <div>
                { folderDetails && (
                    <DashboardOverview 
                    dirDetails={folderDetails}
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
"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import { Folder } from '@/model/folder.model'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { RootProps } from 'postcss'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const FolderPage: React.FC<{ params : { folderId: string }}> = ({ params }) => {
    const router = useRouter()
    const [ folderDetails, setFolderDetails ] = useState<Folder | undefined>(undefined)

    useEffect(() => {
        const getFolderDetails = async() => {
            try {
                const response = await axios.get(`/api/get-current-folder?folderId=${params.folderId}`)
                if(!response.data.success){
                    router.push('/dashboard')
                }else{
                    setFolderDetails(response.data.data)
                }
            } catch (error) {
                console.log("Error while fetching all the folders details ",error)

            }
        }
        getFolderDetails()
    }, [params.folderId])
    return (
        <div className='relative'>
            { folderDetails && (
                <BannerSection
                dirType='folder'
                fileId={params.folderId}
                dirDetails={folderDetails}
                ></BannerSection>
            )}
        </div>
    )
}

export default FolderPage
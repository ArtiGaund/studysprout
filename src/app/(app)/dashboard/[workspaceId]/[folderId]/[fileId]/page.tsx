"use client"

import dynamic from 'next/dynamic'
import BannerSection from '@/components/banner-upload/banner-section'
import TextEditor from '@/components/editor/editor'
import { useFile } from '@/hooks/useFile'
import { ReduxFile } from '@/types/state.type'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { SET_CURRENT_RESOURCE } from '@/store/slices/contextSlice'

const DynamicTextEditor = dynamic(
    () => import("@/components/editor/editor"),
    {
        ssr: false,
        loading: () => <div> Loading editor...</div>
    }
)

const FilePage: React.FC<{ params : { fileId: string, workspaceId?: string,folderId?: string }}> = ({ params }) => {
    const fileId = params.fileId;

    
    const router = useRouter()
    const dispatch = useDispatch();
    const { 
        currentFileDetails, 
        currentFile
     } = useFile();
    const onChangeHandler = ( content: string ) => {
        console.log("Live updated content of file ",content);
    }
    useEffect(() => {
        if(!params.fileId || typeof params.fileId !== 'string'){
            // Optionally redirect if fileId is invalid from the start
            const redirectPath = params.workspaceId 
                ? `/dashboard/${params.workspaceId}${params.folderId ? `/${params.folderId}` : ''}`
                : `/dashboard`;
            router.push(redirectPath);
            return;
        }

        // Call currentFileDetails from useFile hook.
        // The hook handles:
        // 1. checking if the file is already in Redux state
        // 2. using its internal useRef guard ( hasFetchedCurrentFiles) to prevent redundant API calls.
        const getFileDetails = async() => {
            try {
                const response = await currentFileDetails(params.fileId)
                if(!response.success){
                    const redirect = params.workspaceId && params.folderId 
                    ? `/dashboard/${params.workspaceId}/${params.folderId}`
                    : `/dashboard/${params.workspaceId}`
                    router.push(redirect)
                }else{
                   const fetchedFile = response.data as ReduxFile;
                   dispatch(SET_CURRENT_RESOURCE({
                       id: fetchedFile._id,
                       title: fetchedFile.title,
                       type: 'File',
                   }))
                }
            } catch (error) {
                console.warn("FilePage: Error while fetching file details:  ",error)
                const redirect = params.workspaceId && params.folderId
                ? `/dashboard/${params.workspaceId}/${params.folderId}`
                : `/dashboard/${params.workspaceId}`
                router.push(redirect)
            }
        }
        getFileDetails()
    }, [
        params.fileId, 
        router,
        params.workspaceId,
        params.folderId,
        currentFileDetails,
        dispatch
    ])
    if(!fileId){
        return <div>Loading file...</div>
    }

    if(!currentFile || currentFile._id !== fileId){
        return <div>Loading file content...</div>
    }
    return (
        <div className='relative'>
            { currentFile && (
                <>
                    <BannerSection
                    dirType='file'
                    fileId={params.fileId}
                    dirDetails={currentFile}
                    ></BannerSection>
                    <DynamicTextEditor
                    key={params.fileId} 
                    fileId={params.fileId}
                    fileDetails={currentFile}
                    onChange= {onChangeHandler}
                    editable={!currentFile.inTrash}
                    />
                </>
            )}
        </div>
    )
}

export default FilePage
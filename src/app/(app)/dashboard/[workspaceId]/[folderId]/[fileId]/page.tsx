"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import TextEditor from '@/components/editor/editor'
// import Editor from '@/components/editor/editor'
import { useFile } from '@/hooks/useFile'
// import { File } from '@/model/file.model'
import { ReduxFile } from '@/types/state.type'
// import { transformFile } from '@/utils/data-transformers'
// import axios from 'axios'
import { useRouter } from 'next/navigation'
// import { RootProps } from 'postcss'
import React, { useEffect, useState } from 'react'
// import { useSelector } from 'react-redux'


const FilePage: React.FC<{ params : { fileId: string, workspaceId?: string,folderId?: string }}> = ({ params }) => {
    console.log("Params in file page ",params.fileId);
    const fileId = params.fileId;

    
    const router = useRouter()
    // const [ fileDetails, setFileDetails ] = useState<ReduxFile | undefined>(undefined)

    const { 
        currentFileDetails, 
        currentFile
     } = useFile();
    const onChangeHandler = ( content: string ) => {
        console.log("Live updated content of file ",content);
    }
    useEffect(() => {
         console.log(`[FilePage] useEffect triggered. fileId=${params.fileId}`);
        if(!params.fileId || typeof params.fileId !== 'string'){
            console.warn("FilePage: Invalid fileId received in params: ", params.fileId);
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
             console.log(`[FilePage] Calling currentFileDetails for file: ${params.fileId}`);
            try {
                const response = await currentFileDetails(params.fileId)
                if(!response.success){
                    console.error("FilePage: Failed to fetch file details: ",response.error);
                    const redirect = params.workspaceId && params.folderId 
                    ? `/dashboard/${params.workspaceId}/${params.folderId}`
                    : `/dashboard/${params.workspaceId}`
                    router.push(redirect)
                }else{
                   console.log(`[FilePage] Successfully fetched file details for: ${params.fileId}`);
                }
            } catch (error) {
                console.log("FilePage: Error while fetching file details:  ",error)
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
        currentFileDetails
    ])
    if(!fileId){
        return <div>Loading file...</div>
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
                    <TextEditor 
                    fileId={params.fileId}
                    fileDetails={currentFile}
                    onChange= {onChangeHandler}
                    // initialContent={JSON.stringify(currentFile.data)}
                    editable={true}
                    />
                    {/* <Editor /> */}
                    
                </>
            )}
        </div>
    )
}

export default FilePage
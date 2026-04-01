/**
 * FILE VIEW PAGE (Real-time Editor)
 * ---------------------------------
 * Role: The primary workspace for note-taking and collaborative editing.
 * * Core Features:
 * 1. Collaborative Presence: Tracks active users in the file via 'useFilePresence'.
 * 2. Binary Data Handling: Decodes Yjs Binary state from Base64/Buffer to Uint8Array.
 * 3. Dynamic Rendering: Loads the TextEditor component client-side only (SSR: false)
 * 4. Contextual Navigation: Ensures users are redirected if the file cannot be fetched.
 */
"use client"

import dynamic from 'next/dynamic'
import BannerSection from '@/components/banner-upload/banner-section'
import { useFile } from '@/hooks/useFile'
import { ReduxFile } from '@/types/state.type'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SET_CURRENT_RESOURCE } from '@/store/slices/contextSlice'
import { selectCurrentFile } from '@/store/selectors/fileSelector'
import { FilePresenceAvatar } from '@/components/file-presence/file-presence-avatar'
import { useFilePresence } from '@/hooks/socket/useFilePresence'
import { useUser } from '@/lib/providers/user-provider'
import TooltipComponent from '@/components/global/tooltip-component'
import { FileUtilityDrawer } from '@/components/file-presence/file-utility-drawer'

// Optimized: Load editor only on the client to avoid hydration mismatches.
const DynamicTextEditor = dynamic(
    () => import("@/components/editor/editor"),
    {
        ssr: false,
        loading: () => <div> Loading editor...</div>
    }
)

const FilePage: React.FC<{ params : { fileId: string, workspaceId?: string,folderId?: string }}> = ({ params }) => {
    const fileId = params.fileId;
    const [ isDrawerOpen, setIsDrawerOpen ] = useState(false);
    const { user } = useUser();
    
    const router = useRouter()
    const dispatch = useDispatch();
    const { 
        currentFileDetails, 
     } = useFile();

     const currentFile = useSelector(selectCurrentFile);
     const [ loading, setLoading ] = useState(false);
    const onChangeHandler = ( content: string ) => {
        // console.log("Live updated content of file ",content);
    }
   
    // SOCKET HOOK: Manages presence list for current file
    const activeFileUsers = useFilePresence(params.fileId, user);

    /** * Effect: Initial File Data Load
     * Fetches file metadata and content if not present in Redux.
     */
    useEffect(() => {
        if(!params.fileId || typeof params.fileId !== 'string'){
            const redirectPath = params.workspaceId 
                ? `/dashboard/${params.workspaceId}${params.folderId ? `/${params.folderId}` : ''}`
                : `/dashboard`;
            router.push(redirectPath);
            return;
        }

        if(currentFile?._id === params.fileId) return;
        // Call currentFileDetails from useFile hook.
        // The hook handles:
        // 1. checking if the file is already in Redux state
        // 2. using its internal useRef guard ( hasFetchedCurrentFiles) to prevent redundant API calls.
        const getFileDetails = async() => {
            setLoading(true);
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
            }finally{
                setLoading(false);
            }
        }
        getFileDetails()
    }, [
        params.fileId, 
    ])
    
    /** * DATA TRANSFORMATION: Binary Decoding
     *  Yjs requires a Uint8Array. This memo block converts the MongoDB/Base64 stored data into 
     * the correct binary format for the TipTap editor
     */
    const binaryData = useMemo(() => {
        const rawBinary = currentFile?.contentBinary;
        if(!rawBinary) return null;

        // 1. If its a Base64 string
        if(typeof rawBinary === 'string'){
            const binaryString = window.atob(rawBinary);
            const bytes = new Uint8Array(binaryString.length);
            for(let i = 0;i<binaryString.length;i++){
                bytes[i]=binaryString.charCodeAt(i);
            }
            return bytes;
        }

        // 2. If it's the MongoDb/Node Buffer Object { data: number[] }
        if(
            typeof rawBinary === 'object' && 
            'data' in rawBinary && 
            Array.isArray((rawBinary as any).data)
        ){
            return new Uint8Array((rawBinary as any).data);
        }

        if(rawBinary instanceof Uint8Array) return rawBinary;
        // 3. If it's already an array-like structure
        if(Array.isArray(rawBinary)){
            return new Uint8Array(rawBinary)
        }
        return null;
    },[
        currentFile?.contentBinary
    ]);

    if(!currentFile || currentFile._id !== fileId || loading){
        return <div>Loading file content...</div>
    }
    return (
        <div className='relative'>
            { currentFile && (
                <>
                    {/* Banner Section */}
                    <BannerSection
                    dirType='file'
                    fileId={params.fileId}
                    dirDetails={currentFile}
                    ></BannerSection>
                    {/* Editor wrapper */}
                    <div 
                    className='flex flex-row w-full relative'
                    >

                        {/* Presence Toolbar */}
                        <TooltipComponent
                        message='View Active Users'
                        >
                            <div 
                            className='absolute flex flex-row p-2 rounded-md top-2 right-2 z-20 bg-emerald-950/40 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                            onClick={() => setIsDrawerOpen(true)}
                            >
                                <div className="ml-2 mt-2 flex-shrink-0 items-center pr-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"/>
                                    </span>
                                </div>
                                <FilePresenceAvatar 
                                activeUsers={activeFileUsers}
                                
                                />
                            </div>
                        </TooltipComponent>
                        <DynamicTextEditor
                        key={`${params.fileId}-${!!binaryData}`} 
                        fileId={params.fileId}
                        initialContentBinary={binaryData}
                        username={user?.username || ''}
                        // onChange= {onChangeHandler}
                        editable={!currentFile.inTrash}
                        />

                        <FileUtilityDrawer 
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        activeUsers={activeFileUsers}
                        />
                    </div>
                </>
            )}
        </div>
    )
}

export default FilePage


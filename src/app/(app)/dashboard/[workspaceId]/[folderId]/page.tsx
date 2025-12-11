"use client"
import BannerSection from '@/components/banner-upload/banner-section'
import DashboardOverview from '@/components/dashboard-overview/dashboard-overview'
import { useFolder } from '@/hooks/useFolder'
import { SET_CURRENT_RESOURCE } from '@/store/slices/contextSlice'
import { RootState } from '@/store/store'
import { ReduxFolder } from '@/types/state.type'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const FolderPage: React.FC<{ params : { folderId: string }}> = ({ params }) => {
    const router = useRouter()
    const dispatch = useDispatch();
   
    const { currentFolderDetail, isLoadingFolders } = useFolder();
    // Get the current folder ID from Redux
    const currentFolderIdFromRedux = useSelector((state: RootState) => state.folder.currentFolder);
    // Get the normalized folders by ID map from Redux
    const foldersById = useSelector((state: RootState) => state.folder.byId);

    // Memoize the full folder object to be passed to child components
    const folderDetailsToRender: ReduxFolder | undefined = useMemo(() => {
        if(currentFolderIdFromRedux && foldersById[currentFolderIdFromRedux]){
            return foldersById[currentFolderIdFromRedux];
        }
        return undefined;
    },[
        currentFolderIdFromRedux,
        foldersById
    ])
    
    useEffect(() => {
        if(!params.folderId){
            return;
        }

                const getFolderDetails = async() => {
            
                    const response = await currentFolderDetail(params.folderId)
                    if(!response.success){
                        router.push('/dashboard')
                    }else if(response.data){
                        const fetchedFolder = response.data as ReduxFolder;
                        dispatch(SET_CURRENT_RESOURCE({
                            id: fetchedFolder._id,
                            title: fetchedFolder.title,
                            type: 'Folder',
                        }))
                    }
            }
         getFolderDetails()
    }, [
        params.folderId,
         router,
         currentFolderDetail,
         dispatch
        ])


     // Show loading state if folder details are not yet available or are loading
    if (isLoadingFolders || !folderDetailsToRender || folderDetailsToRender._id !== params.folderId) {
        return (
            <div className='flex justify-center items-center h-full'>
                Loading folder details ...
            </div>
        );
    }
    return (
        <div className='relative'>
            { folderDetailsToRender && (
                <BannerSection
                dirType='folder'
                fileId={params.folderId}
                dirDetails={folderDetailsToRender}
                ></BannerSection>
            )}
            <div>
                { folderDetailsToRender && (
                    <DashboardOverview 
                    dirDetails={folderDetailsToRender}
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
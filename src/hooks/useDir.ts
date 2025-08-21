"use client";

import { useToast } from "@/components/ui/use-toast";
import { deleteBanner, getBanner, hardDeleteDir, restoreDir, updateDirIcon, uploadBanner } from "@/services/dirServices";
import { DELETE_FILE, UPDATE_FILE } from "@/store/slices/fileSlice";
import { DELETE_FOLDER, UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { DELETE_WORKSPACE, UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { RootState } from "@/store/store";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { dir } from "console";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFile } from "./useFile";
import { useFolder } from "./useFolder";
import { useWorkspace } from "./useWorkspace";
import { WorkSpace as MongooseWorkspace } from "@/model/workspace.model";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { File as MongooseFile } from "@/model/file.model";

type DirType = "workspace" | "folder" | "file";

interface UseDirOptions {
    dirType: DirType;
    dirId: string;
    currentWorkspaceId?: string;
    currentFolderId?: string;
    currentFileId?: string;
    onFileRestored?: () => void;
}
export function useDir({ 
    dirType,
    dirId,
    currentWorkspaceId,
    currentFolderId,
    currentFileId,
    onFileRestored
}: UseDirOptions){
    //  console.log("useDir hook initialized with dirId:", dirId, "dirType:", dirType);
    const dispatch = useDispatch();
    const router = useRouter();
    const { toast } = useToast();
    const { invalidateFileCaches } = useFile();
    const { invalidateFolderCaches } = useFolder();

    // select the relevant item directly from the Redux store
    const details = useSelector((state: RootState) => {
        if(!dirId) return;
        switch(dirType){
            case "workspace" :
                return state.workspace.byId[dirId];
            case "folder":
                return state.folder.byId[dirId];
            case "file":
                return state.file.byId[dirId];
            default: 
                return undefined;
        }
    })

    const [ isLoading, setIsLoading ] = useState(false);
    const [ isSaving, setIsSaving ] = useState(false);
    const [ isRemovingBanner, setIsRemovingBanner ] = useState(false);
    const [ bannerImageUrl, setBannerImageUrl ] = useState<string | undefined>(undefined);

    // This ref will help us to prevent fetching if a deletion/navigation is in progress
    const isNavigatingAfterDeleteRef = useRef(false);

    // fetch the banner image url if available
    useEffect(() => {
        if(details?.bannerUrl){
            const fetchImage = async() => {
                try {
                    const url = await getBanner(details.bannerUrl!);
                    setBannerImageUrl(url);
                } catch (error) {
                    console.error("Failed to fetch banner image, ",error);
                    setBannerImageUrl(undefined);
                }
            }
            fetchImage();
        }else{
            setBannerImageUrl(undefined);
        }
    }, [details?.bannerUrl]);

    const handleRestore = useCallback(async() => {
        if(!dirId || !details?.inTrash){
            toast({
                title: "Error",
                description: "Item ID is missing for restoration",
                variant: "destructive"
            });
            return;
        }

       setIsSaving(true);
        try {
            const updatePayload: Partial<ReduxWorkSpace | ReduxFolder | ReduxFile> = {
                inTrash: undefined,
                lastUpdated: new Date().toISOString(),
            }
            // Optimistic UI update: Dispatch immediately
            if(dirType === "workspace")
                dispatch(UPDATE_WORKSPACE(updatePayload as ReduxWorkSpace));
            if(dirType === "folder")
                dispatch(UPDATE_FOLDER({
                id: dirId,
                updates: updatePayload as ReduxFolder
            }));
            if(dirType === "file"){
                dispatch(UPDATE_FILE({
                    id: dirId,
                    updates: updatePayload as ReduxFile
                }));
            }
            

            const response = await restoreDir(dirType, dirId);

            
            // Dispatch full updated objects from api response
            if(dirType === "workspace")
                dispatch(UPDATE_WORKSPACE(response as ReduxWorkSpace));
            if(dirType === "folder"){
                const restoredFolder = response as ReduxFolder;
                if(restoredFolder.workspaceId){
                    invalidateFolderCaches(restoredFolder.workspaceId);
                    console.log(`[useDir] Restored Folder: Invalidating folder caches for workspace: ${restoredFolder.workspaceId}`);
                }

                // Also invalidating file caches, as files within the folder might now be visible
                if(restoredFolder._id){
                    invalidateFileCaches(restoredFolder.workspaceId, restoredFolder._id);
                    console.log(`[useDir] Restored Folder: Invalidating file caches for folder: ${restoredFolder._id}`);
                }
                dispatch(UPDATE_FOLDER({
                    id: dirId,
                    updates: restoredFolder
                }));
            }
            if(dirType === "file"){
                const restoredFile = response as ReduxFile;
                if(restoredFile.workspaceId || restoredFile.folderId){
                    invalidateFileCaches(restoredFile.workspaceId, restoredFile.folderId);
                    console.log(`[useDir] Restored File: Invalidating file caches for
                         workspaceId: ${restoredFile.workspaceId}, folderId: ${restoredFile.folderId},
                         folderId: ${restoredFile.folderId}`);
                    if(onFileRestored){
                        onFileRestored();
                    }
                }else{
                    console.log(`[useDir] Restored File: Could not invalidate file caches, missing workspaceId 
                        or folderId in response.`)
                }
                        dispatch(UPDATE_FILE({
                        id: dirId,
                        updates: restoredFile
                    }));
                }
            toast({
                title: `Successfully restored ${dirType}`,
                description: `Restored ${dirType} from trash`
            })

        } catch (error: any) {
            console.error(`Error restoring ${dirType}:`, error);
            toast({
                title: `Failed to restore ${dirType}`,
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
            // Revert optimistic update if api call fails
            if(details){
                const previousPayload: Partial<ReduxWorkSpace | ReduxFolder | ReduxFile> = {
                    _id: dirId,
                    inTrash: details.inTrash,
                }
                if(dirType === 'workspace')
                    dispatch(UPDATE_WORKSPACE(previousPayload as ReduxWorkSpace));
                if(dirType === 'folder')
                    dispatch(UPDATE_FOLDER({
                id: dirId,
                updates: previousPayload as ReduxFolder
            }));
                if(dirType === 'file')
                    dispatch(UPDATE_FILE({
                id: dirId,
                updates: previousPayload as ReduxFile
            }));
            }
        }finally{
            setIsSaving(false);
        }
    },[ 
        dirType,
         dirId, 
         details,
          dispatch,
           toast,
           invalidateFileCaches,
           onFileRestored,
           invalidateFolderCaches
        ])

    const handleDelete = useCallback( async () => {
        // console.log("Attempting to hard delete dirId:", dirId, "of type:", dirType);
        if(!dirId){
            toast({
                title: "Error",
                description: `${dirType} ID is missing for deletion`,
                variant: "destructive"
            })
            return; 
        }
        // console.log("DirId inside delete methond ",dirId);
        setIsLoading(true);
        isNavigatingAfterDeleteRef.current = true;
        try {
            const response = await hardDeleteDir(dirType, dirId);
            if(dirType === "workspace"){
                 dispatch(DELETE_WORKSPACE(dirId));
                 router.replace("/dashboard");
            }
               
            else if(dirType === "folder"){
                dispatch(DELETE_FOLDER(dirId));
                router.replace(currentWorkspaceId ? `/dashboard/${currentWorkspaceId}` : `/dashboard`);
            }
            else if(dirType === "file"){
                dispatch(DELETE_FILE(dirId));
                router.replace(
                    currentWorkspaceId && currentFolderId 
                    ?`/dashboard/${currentWorkspaceId}/${currentFolderId}` 
                    : `/dashboard`);
            }
                
            toast({
                 title: `${dirType.charAt(0).toUpperCase() + dirType.slice(1)} deleted successfully`,
                description: `${dirType.charAt(0).toUpperCase() + dirType.slice(1)} is permanently deleted`,
            })

        } catch (error: any) {
            console.error(`Error deleting ${dirType}:`, error);
            toast({
                title: `Failed to delete ${dirType}`,
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
             // If deletion fails, reset the flag so `useEffect` can try fetching again if user stays on page.
            isNavigatingAfterDeleteRef.current = false;
        } finally {
      setIsLoading(false);
    }
    },[
        dirType,
        dirId,
        dispatch,
        toast,
        router,
        currentWorkspaceId,
        currentFolderId
    ])


    const handleIconChange = useCallback( async (icon: string) => {
        if(!dirId){
            toast({
                title: "Error",
                description: `${dirType} ID is missing for deletion`,
                variant: "destructive"
            })
        }
        setIsSaving(true);
        try {
            const updateDir = await updateDirIcon(dirType, dirId, icon);
            if(dirType === "workspace") 
                dispatch(UPDATE_WORKSPACE(updateDir as ReduxWorkSpace));
            if(dirType === "folder")
                dispatch(UPDATE_FOLDER({
            id: dirId,
            updates: updateDir as ReduxFolder
        }));
            if(dirType === "file")
                dispatch(UPDATE_FILE({
            id: dirId,
            updates: updateDir as ReduxFile
        }));
            toast({
                title: "Success",
                description: `${dirType.charAt(0).toUpperCase() + dirType.slice(1)} icon updated successfully`
            })
        } catch (error: any) {
            console.error(`Error changing ${dirType} icon:`, error);
        toast({
          title: `Failed to change the icon for ${dirType}.`,
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
        } finally{
            setIsSaving(false);
        }
    }, [
        dirType,
        dirId,
        dispatch,
        toast
    ])

    const handleBannerUpload = useCallback( async (file: File) => {
        if(!dirId){
            toast({
                title: "Error",
                description: `${dirType} ID is missing for banner upload`,
                variant: "destructive"
            })
        }
        setIsSaving(true);
        const formData = new FormData();
        formData.append("file", file);
        if(dirType === "workspace") formData.append("workspaceId", dirId);
        if(dirType === "folder") formData.append("folderId", dirId);
        if(dirType === "file") formData.append("fileId", dirId);
        try {
            const updateDir = await uploadBanner(dirType, formData);
            if(dirType === "workspace") 
                dispatch(UPDATE_WORKSPACE(updateDir as ReduxWorkSpace));
            if(dirType === "folder")
                dispatch(UPDATE_FOLDER({
                    id: dirId,
                    updates: updateDir as ReduxFolder
                }));
            if(dirType === "file")
                dispatch(UPDATE_FILE({
            id: dirId,
            updates: updateDir as ReduxFile
        }));
            toast({
                title: "Success",
                description: `${dirType.charAt(0).toUpperCase() + dirType.slice(1)} banner updated successfully`
            })
        } catch (error: any) {
             console.error(`Error uploading banner for ${dirType}:`, error);
            toast({
            title: "Failed",
            description: error.message || `Failed to upload banner for ${dirType}.`,
            variant: "destructive",
            });
        }finally{
            setIsSaving(false);
        }
    }, [
        dirType,
        dirId,
        dispatch,
        toast
    ])

    const handleDeleteBanner = useCallback(async () => {
        if(!details?.bannerUrl) return; 
        if(!dirId){
            toast({
                title: "Error",
                description: `${dirType} ID is missing for banner deletion`,
                variant: "destructive"
            })
        }
        setIsRemovingBanner(true);

        try {
            const updatedDir = await deleteBanner(dirType, dirId);
            if(dirType === "workspace") 
                dispatch(UPDATE_WORKSPACE(updatedDir as ReduxWorkSpace));
            if(dirType === "folder")
                dispatch(UPDATE_FOLDER({
            id: dirId,
            updates: updatedDir as ReduxFolder
        }));
            if(dirType === "file")
                dispatch(UPDATE_FILE({
            id: dirId,
            updates: updatedDir as ReduxFile
        }));
            toast({
                title: "Success",
                description: `${dirType.charAt(0).toUpperCase() + dirType.slice(1)} banner removed successfully`
            })
            
        } catch (error: any) {
            console.error(`Error removing banner for ${dirType}:`, error);
            toast({
                title: "Failed",
                description: error.message || `Failed to remove banner for ${dirType}.`,
                variant: "destructive",
            });
        }finally{
            setIsRemovingBanner(false);
        }
        
    }, [
        dirType,
        dirId,
        details?.bannerUrl,
        dispatch,
        toast
    ])

    return {
        details,
        isLoading,
        isSaving,
        isRemovingBanner,
        bannerImageUrl,
        handleRestore,
        handleDelete,
        handleIconChange,
        handleBannerUpload,
        handleDeleteBanner
    }
}
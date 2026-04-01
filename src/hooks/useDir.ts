/**
 * @hook useDir
 * @description A unified controller hook for managing directory entities (Workspaces, Folders, Files).
 * This hook abstracts complex state operations, providing a consistent API for any UI 
 * component needing to perform CRUD-like actions on the file system tree.
 * * * Core Competencies:
 * - Polymorphic State Selection: Context-aware Redux selectors that navigate nested state.
 * - Optimistic UI Updates: Dispatches immediate local state changes before server confirmation 
 * to ensure a "zero-latency" user experience.
 * - Cache Invalidation: Triggers targeted re-fetches via secondary hooks (useFile, useFolder).
 * - Lifecycle Management: Handles banner image fetching and automatic cleanup/routing after deletions.
 */
"use client";

import { useToast } from "@/components/ui/use-toast";
import {
     deleteBanner, 
     getBanner, 
     hardDeleteDir, 
     restoreDir,
      updateDirIcon,
       uploadBanner 
    } from "@/services/dirServices";
import { DELETE_FILE, UPDATE_FILE } from "@/store/slices/fileSlice";
import { DELETE_FOLDER, UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { DELETE_WORKSPACE, UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { RootState } from "@/store/store";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect,  useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFile } from "./useFile";
import { useFolder } from "./useFolder";
import { clearLastWorkspace } from "@/lib/local-storage-workspace";
import { useSession } from "next-auth/react";

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
    const dispatch = useDispatch();
    const router = useRouter();
    const { toast } = useToast();
    const { invalidateFileCaches } = useFile();
    const { invalidateFolderCaches } = useFolder();


    // --- State & Refs ---
    const [ isLoading, setIsLoading ] = useState(false);
    const [ isSaving, setIsSaving ] = useState(false);
    const [ isRemovingBanner, setIsRemovingBanner ] = useState(false);
    const [ bannerImageUrl, setBannerImageUrl ] = useState<string | undefined>(undefined);

    // This ref will help us to prevent fetching if a deletion/navigation is in progress
    const isNavigatingAfterDeleteRef = useRef(false);

    const params = useParams();
    const { data: session} = useSession();

    /**
     * @selector details
     * Navigates the Redux tree based on the provided dirType.
     * Includes a robust fallback search for files if the primary path is missing.
     */
    const details = useSelector((state: RootState) => {
        if(!dirId) return;
        switch(dirType){
            case "workspace" :
                return state.workspace.byId?.[dirId];
            case "folder":
                return state.folder.foldersByWorkspace
                ?.[currentWorkspaceId ?? ""]
                ?.byId?.[dirId];
            case "file":
                // 1. Try the specific folder path
                const fileByPath = state.file.filesByFolder
                ?.[currentFolderId ?? ""]
                ?.byId?.[dirId];
                if(fileByPath) return fileByPath;

                // 2. Fallback: Search all folders for this fileId
                for(const folderId in state.file.filesByFolder){
                    const file = state.file.filesByFolder[folderId].byId[dirId];
                    if(file) return file;
                }
                return undefined;
            default: 
                return undefined;
        }
    })

    
   /**
     * @effect Banner-Fetcher
     * Syncs the visual banner URL with the entity's metadata.
     */
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

    /**
     * @method handleRestore
     * Moves an item out of the trash. Uses Optimistic UI updates
     * to prevent UI flickering while waiting for the database response.
     */
    const handleRestore = useCallback(async() => {
        if(!dirId || !details?.inTrash){
            toast({
                title: "Error",
                description: "Item ID is missing for restoration",
                variant: "destructive"
            });
            return;
        }
        const parentWorkspaceId = (details as any).workspaceId;
        const parentFolderId = (details as any).folderId;
       setIsSaving(true);
        try {
            const updatePayload: Partial<ReduxWorkSpace | ReduxFolder | ReduxFile> = {
                inTrash: null,
                lastUpdated: new Date().toISOString(),
            }
            // Optimistic UI update: Dispatch immediately
            if(dirType === "workspace")
                dispatch(UPDATE_WORKSPACE(updatePayload as ReduxWorkSpace));
            if(dirType === "folder")
                dispatch(UPDATE_FOLDER({
                workspaceId: parentWorkspaceId,
                id: dirId,
                updates: updatePayload as ReduxFolder
            }));
            if(dirType === "file" && parentFolderId){
                dispatch(UPDATE_FILE({
                    folderId: parentFolderId,
                    id: dirId,
                    updates: updatePayload as ReduxFile
                }));
            }
            

            const response = await restoreDir(dirType, dirId)

            // Dispatch full updated objects from api response
            if(dirType === "workspace")
                dispatch(UPDATE_WORKSPACE(response as ReduxWorkSpace));
            if(dirType === "folder"){
                const restoredFolder = response as ReduxFolder;
                if(restoredFolder.workspaceId){
                        dispatch(UPDATE_FOLDER({
                        workspaceId: restoredFolder.workspaceId,
                        id: dirId,
                        updates: restoredFolder
                    }));
                    invalidateFolderCaches(restoredFolder.workspaceId);
                    invalidateFileCaches(restoredFolder.workspaceId, restoredFolder._id);
                }
                
            }
            if(dirType === "file"){
                const restoredFile = response as ReduxFile;
                if(restoredFile.workspaceId && restoredFile.folderId){
                     dispatch(UPDATE_FILE({
                        folderId: restoredFile.folderId,
                        id: dirId,
                        updates: restoredFile
                    }));
                    invalidateFileCaches(restoredFile.workspaceId, restoredFile.folderId);
                    if(onFileRestored){
                        onFileRestored();
                    }
                }
                       
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
                workspaceId: currentWorkspaceId!,
                id: dirId,
                updates: previousPayload as ReduxFolder
            }));
                if(dirType === 'file')
                    dispatch(UPDATE_FILE({
                folderId: currentFolderId!,
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

    /**
     * @method handleDelete
     * Executes permanent deletion and manages the complex redirect logic
     * required to keep the user in a valid navigation path.
     */
    const handleDelete = useCallback( async () => {
        if(!session?.user._id) return;
        if(!dirId){
            toast({
                title: "Error",
                description: `${dirType} ID is missing for deletion`,
                variant: "destructive"
            })
            return; 
        }
        setIsLoading(true);
        isNavigatingAfterDeleteRef.current = true;
        const parentWorkspaceId = (details as any).workspaceId;
        const parentFolderId = (details as any).folderId;
        try {
            const response = await hardDeleteDir(dirType, dirId);
            if(dirType === "workspace"){
                 dispatch(DELETE_WORKSPACE(dirId));
                 clearLastWorkspace(session.user._id);
                 router.replace("/dashboard");
            }
               
            else if(dirType === "folder"){
                dispatch(DELETE_FOLDER({
                    workspaceId: parentWorkspaceId,
                    folderId: dirId
                }));
                router.replace(
                    params.workspaceId
                     ? `/dashboard/${params.workspaceId}`
                     : "/dashboard"
                    );
            }
            else if(dirType === "file"){
                dispatch(DELETE_FILE({
                    folderId: parentFolderId,
                    fileId: dirId
                }));
                router.replace(
                    params.workspaceId && params.folderId 
                    ? `/dashboard/${params.workspaceId}/${params.folderId}`
                    : params.workspaceId 
                    ? `/dashboard/${params.workspaceId}`
                    :"/dashboard"
                );
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
        params,
        session?.user._id
    ])

    /**
     * @method handleIconChange
     * Updates the emoji/icon identifier for the entity across the store.
     */
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
            workspaceId: currentWorkspaceId!,
            id: dirId,
            updates: updateDir as ReduxFolder
        }));
            if(dirType === "file")
                dispatch(UPDATE_FILE({
            folderId: currentFolderId!,
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

    /**
     * @method handleBannerUpload
     * Manages binary data upload via FormData and syncs the resulting URL.
     */
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
            const updateDir = await uploadBanner(dirType, dirId, formData);
            if(dirType === "workspace") 
                dispatch(UPDATE_WORKSPACE(updateDir as ReduxWorkSpace));
            if(dirType === "folder")
                dispatch(UPDATE_FOLDER({
                    workspaceId: currentWorkspaceId!,
                    id: dirId,
                    updates: updateDir as ReduxFolder
                }));
            if(dirType === "file")
                dispatch(UPDATE_FILE({
            folderId: currentFolderId!,
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

    /**
     * @method handleDeleteBanner
     * Removes the banner association and cleans up cloud storage references.
     */
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
            workspaceId: currentWorkspaceId!,
            id: dirId,
            updates: updatedDir as ReduxFolder
        }));
            if(dirType === "file")
                dispatch(UPDATE_FILE({
            folderId: currentFolderId!,
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
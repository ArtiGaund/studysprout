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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

type DirType = "workspace" | "folder" | "file";

interface UseDirOptions {
    dirType: DirType;
    dirId: string;
    currentWorkspaceId?: string;
    currentFolderId?: string;
    currentFileId?: string;
}
export function useDir({ 
    dirType,
    dirId,
    currentWorkspaceId,
    currentFolderId,
    currentFileId
}: UseDirOptions){
    const dispatch = useDispatch();
    const router = useRouter();
    const { toast } = useToast();

    // select relevant state based on dirType
    const details = useSelector((state: RootState) => {
        if(dirType === "workspace")
             return state.workspace.byId[dirId] as ReduxWorkSpace | undefined;
        if(dirType === "folder") 
            return state.folder.byId[dirId] as ReduxFolder | undefined;
        if(dirType === "file") 
            return state.file.byId[dirId] as ReduxFile | undefined;
        return undefined;
    })

    const [ isLoading, setIsLoading ] = useState(false);
    const [ isSaving, setIsSaving ] = useState(false);
    const [ isRemovingBanner, setIsRemovingBanner ] = useState(false);
    const [ bannerImageUrl, setBannerImageUrl ] = useState<string | undefined>(undefined);

    
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
        if(!details?.inTrash) return; //only restore if its in trash
        if(!dirId){
            toast({
                title: "Error",
                description: "Item ID is missing for restoration",
                variant: "destructive"
            })
        }

        setIsLoading(true);
        try {
            const todayDate = new Date();
            const lastUpdated = todayDate.toString();
            const updatePayload: Partial<ReduxWorkSpace | ReduxFolder | ReduxFile> = {
                _id: dirId,
                inTrash: "",
                lastUpdated
            }
            if(dirType === "workspace")
                dispatch(UPDATE_WORKSPACE(updatePayload as ReduxWorkSpace));
            if(dirType === "folder")
                dispatch(UPDATE_FOLDER(updatePayload as ReduxFolder));
            if(dirType === "file")
                dispatch(UPDATE_FILE(updatePayload as ReduxFile));
            
            const response = await restoreDir(dirType, dirId);
            // Dispatch full updated objects from api response
            if(dirType === "workspace")
                dispatch(UPDATE_WORKSPACE(response as ReduxWorkSpace));
            if(dirType === "folder")
                dispatch(UPDATE_FOLDER(response as ReduxFolder));
            if(dirType === "file")
                dispatch(UPDATE_FILE(response as ReduxFile));
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
                    dispatch(UPDATE_FOLDER(previousPayload as ReduxFolder));
                if(dirType === 'file')
                    dispatch(UPDATE_FILE(previousPayload as ReduxFile));
            }
        }finally{
            setIsLoading(false);
        }
    },[ dirType, dirId, details, dispatch, toast])

    const handleDelete = useCallback( async () => {
        if(!dirId){
            toast({
                title: "Error",
                description: `${dirType} ID is missing for deletion`,
                variant: "destructive"
            })
        }
        setIsLoading(true);
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
                dispatch(UPDATE_FOLDER(updateDir as ReduxFolder));
            if(dirType === "file")
                dispatch(UPDATE_FILE(updateDir as ReduxFile));
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
                dispatch(UPDATE_FOLDER(updateDir as ReduxFolder));
            if(dirType === "file")
                dispatch(UPDATE_FILE(updateDir as ReduxFile));
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
                dispatch(UPDATE_FOLDER(updatedDir as ReduxFolder));
            if(dirType === "file")
                dispatch(UPDATE_FILE(updatedDir as ReduxFile));
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
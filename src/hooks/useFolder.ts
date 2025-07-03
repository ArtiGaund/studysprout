"use client";
import { useCallback, useMemo } from "react";
import { RootState } from "@/store/store";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { ADD_FOLDER, SET_CURRENT_FOLDERS, SET_FOLDER_ERROR, SET_FOLDER_LOADING, SET_FOLDERS, UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { getAllFolders } from "@/services/workspaceServices";
import { ReduxFolder } from "@/types/state.type";
import { addFolder, getCurrentFolder } from "@/services/folderServices";
// import { updateFolder as updateFolderService } from "@/services/folderServices";
import { updateDir } from "@/services/dirServices";

export function useFolder(){
    const { data: session, status } = useSession();
    const dispatch = useDispatch();

    // Selector for folder state
    const foldersById = useSelector(( state: RootState ) => state.folder.byId);
    const allFolderIds = useSelector(( state: RootState ) => state.folder.allIds);
    const currentFolderId = useSelector(( state: RootState ) => state.folder.currentFolder);
    const folderLoading = useSelector(( state: RootState ) => state.folder.loading);
    const folderError = useSelector(( state: RootState ) => state.folder.error);

    const getFolders = useCallback(async( workspaceId: string): Promise<{
        success: boolean,
        data?: MongooseFolder[],
        error?: string
    }> => {
        if(!workspaceId) 
            return { success: false, error: "Workspace id required"}
        dispatch(SET_FOLDER_LOADING(true));
        dispatch(SET_FOLDER_ERROR(null));
        try {
            const fetchFolders = await getAllFolders(workspaceId);
            if(Array.isArray(fetchFolders)){
                dispatch(SET_FOLDERS(fetchFolders));
            }else if(fetchFolders && typeof fetchFolders === 'object'){
                dispatch(SET_FOLDERS([fetchFolders as MongooseFolder]));
            }else{
                console.warn("getAllFolders returned unexpected data:",fetchFolders);
                dispatch(SET_FOLDERS([]));
            }
            return{
                success: true,
                data: fetchFolders,
                error: "Successfully fetched all the folders of the workspace."
            }
        } catch (error: any) {
             console.error('Error while fetching workspace folders in hook in hook:', error);
            const errorMessage = error.message || "Failed to fetch all the folders of workspace";
            dispatch(SET_FOLDER_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FOLDER_LOADING(false));
        }

    }, [dispatch])

    const createFolder = useCallback(async( folderData: MongooseFolder ): Promise<{
        success: boolean,
        data?: MongooseFolder,
        error?: string
    }> => {
        if(!folderData)
            return {
                success: false,
                error: "Folder data required"
            }
            dispatch(SET_FOLDER_LOADING(true));
            dispatch(SET_FOLDER_ERROR(null));
            try {
                const newFolder = await addFolder(folderData);
                dispatch(ADD_FOLDER(newFolder));
                dispatch(SET_CURRENT_FOLDERS(newFolder._id?.toString()));
                return {
                    success: true,
                    data: newFolder,
                }
            } catch (error: any) {
                console.error('Error creating folder in hook:', error);
                const errorMessage = error.message || "Failed to create folder";
                dispatch(SET_FOLDER_ERROR(errorMessage));
                return { success: false, error: errorMessage };
            }finally{
                dispatch(SET_FOLDER_LOADING(false));
            }
    }, [dispatch])

    const updateFolder = useCallback(async(folderId: string, updatedData: Partial<MongooseFolder>): Promise<{
        success: boolean,
        data?: MongooseFolder,
        error?: string
    }> => {
        if(!updatedData)
            return {
                success: false,
                error: "Folder data required"
            }
            dispatch(SET_FOLDER_LOADING(true));
            dispatch(SET_FOLDER_ERROR(null));
        try {
            const folder = await updateDir("folder", folderId , updatedData);
            if(!updateFolder){
                return {
                    success: false,
                    error: "Failed to update folder"
                }
            }
            dispatch(UPDATE_FOLDER(folder));
            return {
                success: true,
                data: folder,
            }
        } catch (error: any) {
            console.error('Error update folder in hook:', error);
            const errorMessage = error.message || "Failed to update folder";
            dispatch(SET_FOLDER_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FOLDER_LOADING(false));
        }
    }, [dispatch ])
    const currentFolderDetail = useCallback(async (folderId: string): Promise<{
        success: boolean,
        data?: MongooseFolder,
        error?: string
    }> => {
        if(!folderId) 
            return {
                success: false,
                error: "Folder id required"
            }
        dispatch(SET_FOLDER_LOADING(true));
        dispatch(SET_FOLDER_ERROR(null));
        try {
            const folder = await getCurrentFolder(folderId);
            if(!folder){
                return {
                    success: false,
                    error: "Failed to get current folder"
                }
            }
            dispatch(SET_CURRENT_FOLDERS(folder._id?.toString()));
            return {
                success: true,
                data: folder,
            }
        } catch (error: any) {
             console.error('Error fetching current folder in hook:', error);
            const errorMessage = error.message || "Failed to fetch current folder";
            dispatch(SET_FOLDER_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FOLDER_LOADING(false));
        }
    }, [dispatch])
     // --- Derived States ---
    //  allFoldersArray is created on every render whenever useFolder runs, thats why infinite loop is coming here 
    //  const allFoldersArray: ReduxFolder[] = allFolderIds.map(id => foldersById[id]);
    // To resolve above issue, use useMemo
    const allFoldersArray: ReduxFolder[] = useMemo(() => {
        return allFolderIds.map(id => foldersById[id]);
    },[ allFolderIds, foldersById]);
    //  const currentFolderObject = currentFolderId ? foldersById[currentFolderId] : undefined;
    // same for the above one
    const currentFolderObject = useMemo(() => {
        return currentFolderId ? foldersById[currentFolderId] : undefined;
    }, [ currentFolderId, foldersById ]);

     return{
        // Data drived from redux store
        folders: allFoldersArray,
        currentFolder: currentFolderObject,

        // Loading and error states
        isLoadingFolders: folderLoading,
        folderError: folderError,

        // function to trigger
        getFolders,
        createFolder,
        updateFolder,
        currentFolderDetail,
     }

}
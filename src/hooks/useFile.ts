"use client";

import { useCallback, useMemo } from "react";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { File as MongooseFile } from "@/model/file.model";
import { ADD_FILE, SET_CURRENT_FILES, SET_FILE_ERROR, SET_FILE_LOADING, SET_FILES, UPDATE_FILE } from "@/store/slices/fileSlice";
import { addFile, getAllFilesByWorkspaceId, getCurrentFile } from "@/services/fileServices";
import { ReduxFile } from "@/types/state.type";
import { updateDir } from "@/services/dirServices";
import { getAllFiles } from "@/services/folderServices";
import { transformFile } from "@/utils/data-transformers";

export function useFile() {
    const dispatch = useDispatch();

     // Selector for file state
     const filesById = useSelector(( state: RootState ) => state.file.byId);
     const allFileIds = useSelector(( state: RootState ) => state.file.allIds);
     const currentFileId = useSelector(( state: RootState ) => state.file.currentFile);
     const fileLoading = useSelector(( state: RootState ) => state.file.loading);
     const fileError = useSelector(( state: RootState ) => state.file.error);

     const createFile = useCallback(async (fileData: MongooseFile): Promise<{
        success: boolean,
        data?: MongooseFile,
        error?: string
     }> => {
        if(!fileData)
            return {
                success: false,
                error: "File data required"
            }
            dispatch(SET_FILE_LOADING(true));
            dispatch(SET_FILE_ERROR(null));
            try {
                const newFile = await addFile(fileData);

                const transformedFile = transformFile(newFile);
                dispatch(ADD_FILE(transformedFile));
                return {
                    success: true,
                    data: newFile
                }
            } catch (error: any) {
                 console.error('Error creating file in hook:', error);
                const errorMessage = error.message || "Failed to create file";
                dispatch(SET_FILE_ERROR(errorMessage));
                return { success: false, error: errorMessage };
            }finally{
                dispatch(SET_FILE_LOADING(false));
            }
     }, [dispatch]);

     const updateFile = useCallback(async (fileId: string, updatedData: Partial<MongooseFile>): Promise<{
        success: boolean,
        data?: MongooseFile,
        error?: string
     }> => {
        if(!fileId || !updatedData)
            return {
                success: false,
                error: "File data required"
            }
            dispatch(SET_FILE_LOADING(true));
            dispatch(SET_FILE_ERROR(null));
        try {
            const result = await updateDir("file",fileId, updatedData);
            const file = result.file
            console.log("Updated file:", result.file);
            if(!result){
                return {
                    success: false,
                    error: "Failed to update file"
                }
            }
            if(!file){
                return {
                    success: false,
                    error: result.error || "Failed to update file or invalid response from service"
                }
            }
            dispatch(UPDATE_FILE(file));
            return {
                success: true,
                data: file
            }
        } catch (error: any) {
            console.error('Error update file in hook:', error);
            const errorMessage = error.message || "Failed to update folder";
            dispatch(SET_FILE_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        } finally{
            dispatch(SET_FILE_LOADING(false));
        }
     }, [dispatch]);
     const getWorkspaceFiles = useCallback(async(workspaceId: string): Promise<{
        success: boolean,
        data?: MongooseFile[],
        error?: string
     }> => {
         if(!workspaceId){
                return {
                    success: false,
                    error: "Workspace id required"
                }
            }
        try {
           
            dispatch(SET_FILE_LOADING(true));
            dispatch(SET_FILE_ERROR(null));
            const fetchFiles = await getAllFilesByWorkspaceId(workspaceId);

            const transformedFiles = (Array.isArray(fetchFiles)
            ? fetchFiles
            : [fetchFiles]
            ).filter(Boolean).map(file => transformFile(file as MongooseFile));
            
            if(transformedFiles.length > 0){
                dispatch(SET_FILES(transformedFiles));
                if(!currentFileId && !transformedFiles.some(file => file._id === currentFileId)){
                    const firstFile = transformedFiles[0];
                    if(firstFile && firstFile._id){
                         dispatch(SET_CURRENT_FILES(firstFile._id));
                    }
                   
                }
            }else{
                dispatch(SET_FILES([]));
                dispatch(SET_CURRENT_FILES(null));
            }
            return {
                success: true,
                data: fetchFiles
            }
        } catch (error: any) {   
             console.error('Error while fetching workspace files in hook:', error); // Updated message
            const errorMessage = error.message || "Failed to fetch all the files of workspace"; // Updated message
            dispatch(SET_FILE_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FILE_LOADING(false));
        }
     }, [
        dispatch,
        currentFileId,
    ])
     const getFiles = useCallback(async (folderId: string): Promise<{
        success: boolean,
        data?: MongooseFile[],
        error?: string
     }> => {
        if(!folderId)
            return{
                success: false,
                error: "Folder id required"
            }
        dispatch(SET_FILE_LOADING(true));
        dispatch(SET_FILE_ERROR(null));
        try {
            const fetchFiles = await getAllFiles(folderId);

            const transformedFiles = (Array.isArray(fetchFiles)
            ? fetchFiles
            : [fetchFiles]
            ).filter(Boolean).map(file => transformFile(file as MongooseFile));
           
             if(transformedFiles.length > 0){
                dispatch(SET_FILES(transformedFiles));
                if(!currentFileId && !transformedFiles.some(file => file._id === currentFileId)){
                    const firstFile = transformedFiles[0];
                    if(firstFile && firstFile._id){
                         dispatch(SET_CURRENT_FILES(firstFile._id));
                    }
                   
                }
            }else{
                dispatch(SET_FILES([]));
                dispatch(SET_CURRENT_FILES(null));
            }
            return {
                success: true,
                data: fetchFiles,
                error: "Successfully fetched all the files of folder"
            }
        } catch (error: any) {
            console.error('Error while fetching  folder files in hook in hook:', error);
            const errorMessage = error.message || "Failed to fetch all the files of folder";
            dispatch(SET_FILE_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FILE_LOADING(false));
        }
     }, [
        dispatch,
        currentFileId
    ]);
     const currentFileDetails = useCallback(async (fileId: string): Promise<{
        success: boolean,
        data?: MongooseFile,
        error?: string
     }> => {
        if(!fileId)
            return {
                success: false,
                error: "File id required"
            }
        dispatch(SET_FILE_LOADING(true));
        dispatch(SET_FILE_ERROR(null));
        try {
            const file = await getCurrentFile(fileId);
            if(!file){
                return {
                    success: false,
                    error: "Failed to fetch current file"
                }
            }
            dispatch(SET_CURRENT_FILES(file._id.toString()));
            return {
                success: true,
                data: file
            }
        }catch (error: any) {
            console.error('Error fetching current file in hook:', error);
            const errorMessage = error.message || "Failed to fetch current file";
            dispatch(SET_FILE_ERROR(errorMessage));
            return { success: false, error: errorMessage };
     }finally{
        dispatch(SET_FILE_LOADING(false));
     }
    }, [dispatch]);
      // --- Derived States ---
    //  const allFilesArray: ReduxFile[] = allFileIds.map(id => filesById[id]);
    const allFilesArray: ReduxFile[] = useMemo(() => {
        return allFileIds.map(id => filesById[id]);
    }, [ allFileIds, filesById ]);
    // const currentFileObject = currentFileId ? filesById[currentFileId] : undefined; 
    const currentFileObject = useMemo(() => {
        return currentFileId ? filesById[currentFileId] : undefined;
    }, [ currentFileId, filesById ])
     return {
         // Data drived from redux store
         files: allFilesArray,
         currentFile: currentFileObject,

          // Loading and error states
         loading: fileLoading,
         error: fileError,

         // Actions
         createFile,
         updateFile,
        getFiles,
        currentFileDetails,
        getWorkspaceFiles
     }
}
"use client";

import { useCallback } from "react";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { File as MongooseFile } from "@/model/file.model";
import { ADD_FILE, SET_CURRENT_FILES, SET_FILE_ERROR, SET_FILE_LOADING, SET_FILES, UPDATE_FILE } from "@/store/slices/fileSlice";
import { addFile, getCurrentFile } from "@/services/fileServices";
import { ReduxFile } from "@/types/state.type";
import { updateDir } from "@/services/dirServices";
import { getAllFiles } from "@/services/folderServices";

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
                dispatch(ADD_FILE(newFile));
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
            const file = await updateDir("file",fileId, updatedData);
            if(!file){
                return {
                    success: false,
                    error: "Failed to update file"
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
            if(Array.isArray(fetchFiles)){
                dispatch(SET_FILES(fetchFiles));
            }else if(fetchFiles && typeof fetchFiles === "object"){
                dispatch(SET_FILES([fetchFiles as MongooseFile]));
            }else{
                dispatch(SET_FILES([]));
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
     }, [dispatch]);
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
     const allFilesArray: ReduxFile[] = allFileIds.map(id => filesById[id]);
    const currentFileObject = currentFileId ? filesById[currentFileId] : undefined; 
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
     }
}
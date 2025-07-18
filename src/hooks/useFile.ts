"use client";

import { useCallback, useMemo, useRef } from "react";
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

     // Refs to track fetched states for this hook's API calls
    const hasFetchedWorkspaceFilesRef = useRef<Set<string>>(new Set());
    const hasFetchedFolderFilesRef = useRef<Set<string>>(new Set());
    const hasFetchedCurrentFileRef = useRef<Set<string>>(new Set());

     const createFile = useCallback(async (fileData: MongooseFile): Promise<{
        success: boolean,
        data?: ReduxFile,
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
                // Clear relevant refs to force re-fetch if needed
                if (fileData.workspaceId) {
                    hasFetchedWorkspaceFilesRef.current.delete(fileData.workspaceId);
                }
                if (fileData.folderId) {
                    hasFetchedFolderFilesRef.current.delete(fileData.folderId);
                }
                return {
                    success: true,
                    data: transformedFile
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
        data?: ReduxFile,
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
            const transformedFile = transformFile(file);
            dispatch(UPDATE_FILE({
                id: transformedFile._id,
                updates: transformedFile
            }));
            //  If the updated file is the current one, clear its ref to ensure fresh details next time
            // if (currentFileId === fileId) {
                hasFetchedCurrentFileRef.current.delete(fileId);
            // }
            // If the file's workspace ID is available, clear the workspace files ref
            if (file.workspaceId) { // Assuming file object has workspaceId
                hasFetchedWorkspaceFilesRef.current.delete(file.workspaceId.toString());
            }
            // If the file's folder ID is available, clear the folder files ref
            if (file.folderId) { // Assuming file object has folderId
                hasFetchedFolderFilesRef.current.delete(file.folderId.toString());
            }
            return {
                success: true,
                data: transformedFile
            }
        } catch (error: any) {
            console.error('Error update file in hook:', error);
            const errorMessage = error.message || "Failed to update folder";
            dispatch(SET_FILE_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        } finally{
            dispatch(SET_FILE_LOADING(false));
        }
     }, [
        dispatch,
        // currentFileId
    ]);
     const getWorkspaceFiles = useCallback(async(workspaceId: string): Promise<{
        success: boolean,
        data?: ReduxFile[],
        error?: string
     }> => {
         if(!workspaceId){
             console.log("[useFile] getWorkspaceFiles: No workspaceId provided.");
                return {
                    success: false,
                    error: "Workspace id required"
                }
            }
            if (hasFetchedWorkspaceFilesRef.current.has(workspaceId)) {
            console.log(`[useFile] Skipping getWorkspaceFiles for workspace ${workspaceId}: already fetched.`);
            return { success: true, data: allFileIds.map(id => filesById[id]) as ReduxFile[] }; // Return Redux data mapped back to Mongoose-like
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
            hasFetchedWorkspaceFilesRef.current.add(workspaceId);
            return {
                success: true,
                data: fetchFiles
            }
        } catch (error: any) {   
             console.error('Error while fetching workspace files in hook:', error); // Updated message
            const errorMessage = error.message || "Failed to fetch all the files of workspace"; // Updated message
            dispatch(SET_FILE_ERROR(errorMessage));
            hasFetchedWorkspaceFilesRef.current.delete(workspaceId);
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FILE_LOADING(false));
        }
     }, [
        dispatch,
        // currentFileId,
        // filesById,
        // allFileIds
    ])
     const getFiles = useCallback(async (folderId: string): Promise<{
        success: boolean,
        data?: ReduxFile[],
        error?: string
     }> => {
        if(!folderId){
             console.log("[useFile] getFiles: No folderId provided.");
             return{
                success: false,
                error: "Folder id required"
            }
        }
        if (hasFetchedFolderFilesRef.current.has(folderId)) {
            console.log(`[useFile] Skipping getFiles for folder ${folderId}: already fetched.`);
            return { success: true, data: allFileIds.map(id => filesById[id]) as ReduxFile[] }; // Return Redux data mapped back to Mongoose-like
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
            hasFetchedFolderFilesRef.current.add(folderId);
            return {
                success: true,
                data: fetchFiles,
                error: "Successfully fetched all the files of folder"
            }
        } catch (error: any) {
            console.error('Error while fetching  folder files in hook in hook:', error);
            const errorMessage = error.message || "Failed to fetch all the files of folder";
            dispatch(SET_FILE_ERROR(errorMessage));
            hasFetchedFolderFilesRef.current.delete(folderId);
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FILE_LOADING(false));
        }
     }, [
        dispatch,
        // currentFileId,
        // filesById,
        // allFileIds
    ]);
     const currentFileDetails = useCallback(async (fileId: string): Promise<{
        success: boolean,
        data?: ReduxFile,
        error?: string
     }> => {
        if(!fileId){
            console.log("[useFile] currentFileDetails: No fileId provided.");
            return { success: false, error: "File id required" };
        }
        // Guard against redundant calls for this specific fetch
        if (currentFileId === fileId && filesById[fileId]) {
            console.log(`[useFile] Skipping currentFileDetails for ${fileId}: already set.`);
            return { success: true, data: filesById[fileId] as ReduxFile }; // Return Redux data mapped back to Mongoose-like
        }
        if (hasFetchedCurrentFileRef.current.has(fileId)) {
            console.log(`[useFile] Skipping currentFileDetails for ${fileId}: already initiated.`);
            return { success: true, data: filesById[fileId] as ReduxFile };
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
            const transformedFile = transformFile(file);
            dispatch(SET_CURRENT_FILES(transformedFile._id.toString()));
             hasFetchedCurrentFileRef.current.add(fileId);
            return {
                success: true,
                data: transformedFile
            }
        }catch (error: any) {
            console.error('Error fetching current file in hook:', error);
            const errorMessage = error.message || "Failed to fetch current file";
            dispatch(SET_FILE_ERROR(errorMessage));
            hasFetchedCurrentFileRef.current.delete(fileId);
            return { success: false, error: errorMessage };
     }finally{
        dispatch(SET_FILE_LOADING(false));
     }
    }, [
        dispatch,
        // currentFileId,
        // filesById
    ]);
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
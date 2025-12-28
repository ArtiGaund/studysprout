/** 
 * Manage File updation
 */
"use client";

import { useCallback, useMemo } from "react";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { IBlock, File as MongooseFile } from "@/model/file.model";
import { ADD_BlOCK, ADD_FILE, DELETE_BLOCK, SET_CURRENT_FILE, SET_FILE_ERROR, SET_FILE_LOADING, SET_FILES, UPDATE_BLOCK, UPDATE_FILE } from "@/store/slices/fileSlice";
import { addBlock, addFile, deleteBlock, getAllFilesByWorkspaceId, getCurrentFile, updateBlock } from "@/services/fileServices";
import { ReduxFile } from "@/types/state.type";
import { updateDir } from "@/services/dirServices";
import { getAllFiles } from "@/services/folderServices";
import { transformFile } from "@/utils/data-transformers";
import { 
    hasFetchedCurrentFileRef,
    hasFetchedFolderFilesRef,
    hasFetchedWorkspaceFilesRef
} from "@/cache/fileCache";
import { UIBlock } from "@/utils/block/normalizeBlock";

export function useFile() {
    const dispatch = useDispatch();

     // Selector for file state
     const {
        byId: filesById,
        allIds: allFileIds,
        currentFile: currentFileId,
        loading: fileLoading,
        error: fileError,
        
     } = useSelector(( state: RootState) => state.file);
    

     const createFile = useCallback(async (payload: Partial<MongooseFile>): Promise<{
        success: boolean,
        data?: ReduxFile,
        error?: string
     }> => {
        if(!payload)
            return {
                success: false,
                error: "File data required"
            }
            dispatch(SET_FILE_LOADING(true));
            dispatch(SET_FILE_ERROR(null));
            try {
                const newFile = await addFile(payload);

                const transformedFile = transformFile(newFile as MongooseFile);
                dispatch(ADD_FILE(transformedFile));
                dispatch(SET_CURRENT_FILE(transformedFile._id.toString()));
                // Clear relevant refs to force re-fetch if needed
                if (payload.workspaceId) {
                    hasFetchedWorkspaceFilesRef.delete(payload.workspaceId);
                }
                if (payload.folderId) {
                    hasFetchedFolderFilesRef.delete(payload.folderId);
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
            // Stringify the 'data' field if it's an object/array before sending to API
            const payloadToSend = { ...updatedData };
        try {
            const result = await updateDir("file",fileId, payloadToSend);
            const file = result
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
        
                hasFetchedCurrentFileRef.delete(fileId);
            // If the file's workspace ID is available, clear the workspace files ref
            if (file.workspaceId) { // Assuming file object has workspaceId
                hasFetchedWorkspaceFilesRef.delete(file.workspaceId.toString());
            }
            // If the file's folder ID is available, clear the folder files ref
            if (file.folderId) { // Assuming file object has folderId
                hasFetchedFolderFilesRef.delete(file.folderId.toString());
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
     const getWorkspaceFiles = useCallback(async(workspaceId: string, forceFetch?: boolean): Promise<{
        success: boolean,
        data?: ReduxFile[],
        error?: string
     }> => {
         if(!workspaceId){
                return {
                    success: false,
                    error: "Workspace id required"
                }
            }
            if (hasFetchedWorkspaceFilesRef.has(workspaceId) && !forceFetch) {
            const files = allFileIds
            .filter(id => filesById[id]?.workspaceId === workspaceId)
            .map(id => filesById[id]);
            return { success: true, data: files as ReduxFile[] }; // Return Redux data mapped back to Mongoose-like
        }
        try {
           
            dispatch(SET_FILE_LOADING(true));
            dispatch(SET_FILE_ERROR(null));
            const fetchFiles = await getAllFilesByWorkspaceId(workspaceId);

            const transformedFiles = (Array.isArray(fetchFiles)
            ? fetchFiles
            : [fetchFiles]
            ).filter(Boolean).map(file => transformFile(file as MongooseFile));

            dispatch(SET_FILES(transformedFiles));
            
                
                if(!currentFileId && !transformedFiles.some(file => file._id === currentFileId)){
                    const firstFile = transformedFiles[0];
                    if(firstFile && firstFile._id){
                         dispatch(SET_CURRENT_FILE(firstFile._id));
                    }
                   
                }
            hasFetchedWorkspaceFilesRef.add(workspaceId);
            return {
                success: true,
                data: transformedFiles
            }
        } catch (error: any) {   
             console.error('Error while fetching workspace files in hook:', error); // Updated message
            const errorMessage = error.message || "Failed to fetch all the files of workspace"; // Updated message
            dispatch(SET_FILE_ERROR(errorMessage));
            hasFetchedWorkspaceFilesRef.delete(workspaceId);
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FILE_LOADING(false));
        }
     }, [
        dispatch,
    ])
     const getFiles = useCallback(async (folderId: string): Promise<{
        success: boolean,
        data?: ReduxFile[],
        error?: string
     }> => {
        if(!folderId){
             return{
                success: false,
                error: "Folder id required"
            }
        }
        if (hasFetchedFolderFilesRef.has(folderId)) {
            const files = allFileIds
            .filter(id => filesById[id]?.folderId === folderId)
            .map(id => filesById[id]);
            return { success: true, data: files as ReduxFile[] }; // Return Redux data mapped back to Mongoose-like
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
                         dispatch(SET_CURRENT_FILE(firstFile._id));
                    }
                   
                }
            }else{
                dispatch(SET_FILES([]));
                dispatch(SET_CURRENT_FILE(null));
            }
            dispatch(SET_FILES(transformedFiles));

            if(transformedFiles.length > 0 && transformedFiles[0].workspaceId){
                hasFetchedWorkspaceFilesRef.delete(transformedFiles[0].workspaceId);
            }
            hasFetchedFolderFilesRef.add(folderId);
            return {
                success: true,
                data: transformedFiles,
                error: "Successfully fetched all the files of folder"
            }
        } catch (error: any) {
            console.error('Error while fetching  folder files in hook in hook:', error);
            const errorMessage = error.message || "Failed to fetch all the files of folder";
            dispatch(SET_FILE_ERROR(errorMessage));
            hasFetchedFolderFilesRef.delete(folderId);
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FILE_LOADING(false));
        }
        }
     , [
        dispatch,
    ]);
     const currentFileDetails = useCallback(async (fileId: string): Promise<{
        success: boolean,
        data?: ReduxFile,
        error?: string
     }> => {
        if(!fileId){
            return { success: false, error: "File id required" };
        }

        // 1. check Redux state first (synchronous check for already loaded data)
        const cachedFile = filesById[fileId];
        if(cachedFile){
            // we still need to set the global currentFileId to ensure the UI is correct
            dispatch(SET_CURRENT_FILE(fileId));
            return {
                success: true,
                data: cachedFile as ReduxFile,
            };
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
            dispatch(ADD_FILE(transformedFile));
            dispatch(SET_CURRENT_FILE(transformedFile._id.toString()));
             hasFetchedCurrentFileRef.add(fileId);
            return {
                success: true,
                data: transformedFile
            }
        }catch (error: any) {
            console.error('Error fetching current file in hook:', error);
            const errorMessage = error.message || "Failed to fetch current file";
            dispatch(SET_FILE_ERROR(errorMessage));
            hasFetchedCurrentFileRef.delete(fileId);
            return { success: false, error: errorMessage };
     }finally{
        dispatch(SET_FILE_LOADING(false));
     }
    }, [
        dispatch,
        filesById
    ]);

    // function to explicitly invalidate caches
    const invalidateFileCaches = useCallback((
        workspaceId?: string,
        folderId?: string
    ) => {
        if(workspaceId){
            hasFetchedWorkspaceFilesRef.delete(workspaceId);
        }
        if(folderId){
            hasFetchedFolderFilesRef.delete(folderId);
        }

        if(currentFileId){
            hasFetchedCurrentFileRef.delete(currentFileId);
        }

    },[currentFileId]);

    const addBlockHandler = useCallback(async (
        fileId: string, 
        block: UIBlock ,
         afterBlockId: string ) => {
            try {
                const newBlock = await addBlock(fileId, block, afterBlockId );
            
                if(!newBlock?.blocks){
                    return{
                        success: false,
                        error: "Failed to add block"
                    }
                }
                    dispatch(UPDATE_FILE({
                        id: fileId,
                        updates: {
                            blocks: {
                                ...filesById[fileId].blocks,
                                [newBlock.data.block.id]: newBlock.data.block,
                            },
                            blockOrder: newBlock.data.blockOrder,
                        }
                    }))
                // }

                return {
                    success: true,
                    data: newBlock
                }
            } catch (error: any) {
                console.warn("[useFile] Failed to add block due to following error: ",error);
                dispatch(DELETE_BLOCK({ fileId, blockId: block.id}));
                return {
                    success: false,
                    error: error.message
                }
            }
    },[
        dispatch
    ])

    const updateBlockHandler = useCallback(async (
        fileId: string,
        blockId: string,
        updates: UIBlock
    ) => {
        try {
            const result = await updateBlock(fileId, blockId, updates);
            dispatch(UPDATE_BLOCK({
                fileId,
                blockId,
                updates
            }));

            return {
                success: true,
                data: result
            }
        } catch (error: any) {
            console.warn("[useFile] Failed to update block due to following error: ",error);
            return {
                success: false,
                error: error.message
            }
        }
    }, [
        dispatch
    ])

    const deleteBlockHandler = useCallback(async (
        fileId: string,
        blockId: string,
    ) => {
        try {
            const result = await deleteBlock(fileId, blockId);

            dispatch(DELETE_BLOCK({
                fileId,
                blockId
            }))

            return {
                sucess: true,
            }
        } catch (error: any) {
            console.warn("[useFile] Failed to delete block due to following error: ",error);
            return {
                success: false,
                error: error.message
            }
        }
    }, [
        dispatch
    ])
      // --- Derived States ---
    const allFilesArray: ReduxFile[] = useMemo(() => {
        return allFileIds.map((id: string) => filesById[id]);
    }, [ allFileIds, filesById ]);
    
    const currentFileObject = useMemo(() => {
        return currentFileId ? filesById[currentFileId] : undefined;
    }, [ currentFileId, filesById ])
     return {
         // Data drived from redux store
         files: allFilesArray,
         currentFile: currentFileObject,

          // Loading and error states
         fileLoading,
         fileError,

         // Actions
         createFile,
         updateFile,
        getFiles,
        currentFileDetails,
        getWorkspaceFiles,
        invalidateFileCaches,
        addBlockHandler,
        updateBlockHandler,
        deleteBlockHandler
     }
}
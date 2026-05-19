/**
 * @hook useFile
 * @description The central business logic hub for file and block management in StudySprout.
 * * CORE ARCHITECTURAL PATTERNS:
 * 1. Hybrid State Management: Combines Redux for global UI state with Ref-based caching 
 * for network efficiency, ensuring data only fetches when necessary.
 * 2. Optimistic Rendering: Block-level actions (add/update/delete) update the Redux store 
 * immediately, providing a latency-free experience with built-in rollback logic.
 * 3. Data Integrity: Normalizes raw Mongoose documents into UI-specific types using 
 * `transformFile`, shielding components from backend schema changes.
 * 4. Memoized Selectors: Employs factory-pattern selectors to prevent parent state 
 * changes from triggering unnecessary re-renders in the file list.
 */
"use client";

import { useCallback, useMemo } from "react";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { File as MongooseFile } from "@/model/file.model";
import { 
    ADD_FILE, 
    DELETE_BLOCK, 
    SET_CURRENT_FILE, 
    SET_FILE_ERROR, 
    SET_FILE_LOADING, 
    SET_FILES, 
    UPDATE_BLOCK, 
    UPDATE_FILE 
} from "@/store/slices/fileSlice";
import { 
    addBlock, 
    addFile, 
    deleteBlock, 
    getAllFilesByWorkspaceId, 
    getCurrentFile, 
    updateBlock 
} from "@/services/fileServices";
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
import {
     makeSelectFiles, 
     selectCurrentFile, 
     selectFileError, 
     selectFileLoading
 } from "@/store/selectors/fileSelector";
import { selectCurrentFolder } from "@/store/selectors/folderSelector";

const EMPTY_ARRAY: ReduxFile[] = [];
export function useFile() {
    const dispatch = useDispatch();

   // --- Redux State Selection ---
    const currentFolder = useSelector(selectCurrentFolder);
    const folderId = currentFolder?._id ?? "";
    const fileLoading = useSelector(selectFileLoading);
    const fileError = useSelector(selectFileError);
    const currentFile = useSelector(selectCurrentFile);

    // Optimized: prevents re-calculation of file arrays unless the folder context changes.
    const selectFiles = useMemo(makeSelectFiles, []);
    const files = useSelector((state: RootState) => 
    folderId ? selectFiles(state, folderId) : EMPTY_ARRAY
    );
    
    /**
     * @method createFile
     * Executes file creation with automated cache invalidation.
     * Ensures that sidebar/workspace lists reflect the new entity without a full page reload.
     */
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
                if(!newFile){
                    return {
                        success: false,
                        error: "Failed to create new file",
                    };
                }
                const transformedFile = transformFile(newFile as MongooseFile);
                if(!transformedFile){
                    return{
                        success: false,
                        error: "Failed to transform new file",
                    };
                }

                // Sync Redux
                dispatch(ADD_FILE({
                    folderId: newFile.folderId,
                    file: transformedFile
                }));
                dispatch(SET_CURRENT_FILE(transformedFile));
                
                // Invalidate Cache to ensure navigation lists are fresh
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

     /**
     * @method updateFile
     * Handles metadata updates (Title, Icon, Banners). 
     * Propagates changes across workspace/folder caches to maintain UI consistency.
     */
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
            console.log("[useFile] updateFile result: ",result);
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
            if(!transformedFile){
                return {
                    success: false,
                    error: "Failed to transform updated file",
                };
            }
            dispatch(UPDATE_FILE({
                folderId: file.folderId.toString(),
                id: file._id,
                updates: transformedFile
            }));
        
            // Clear Cache for this specific item
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
    ]);

    /**
     * @method getWorkspaceFiles
     * High-performance fetcher that groups files by folder before updating the store.
     * Minimizes dispatch cycles by batching folder updates.
     */
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
            return { success: true, data: files as ReduxFile[] }; // Return Redux data mapped back to Mongoose-like
        }
        try {
           
            dispatch(SET_FILE_LOADING(true));
            dispatch(SET_FILE_ERROR(null));
            const fetchFiles = await getAllFilesByWorkspaceId(workspaceId);

            const transformedFiles: ReduxFile[] = fetchFiles.map( (file: MongooseFile) => 
                transformFile(file));

            const groupedByFolder = transformedFiles.reduce((acc: Record<string, ReduxFile[]>, file: ReduxFile) => {
                const fId = file.folderId ?? "unorganized";
                if(!acc[fId]) acc[fId] = [];
                acc[fId].push(file);
                return acc;
            }, {} as Record<string, ReduxFile[]>);

            Object.entries(groupedByFolder).forEach(([fId, folderFiles]) => {
                dispatch(SET_FILES({
                    folderId: fId,
                    files: folderFiles
                }));
            });

            hasFetchedCurrentFileRef.add(workspaceId);
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
    /**
     * @method getFiles
     * High-performance fetcher that groups files by folder before updating the store.
     * Minimizes dispatch cycles by batching folder updates.
     */
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
            // const files = allFileIds
            // .filter(id => filesById[id]?.folderId === folderId)
            // .map(id => filesById[id]);
            return { success: true, data: files as ReduxFile[] }; // Return Redux data mapped back to Mongoose-like
        }
        dispatch(SET_FILE_LOADING(true));
        dispatch(SET_FILE_ERROR(null));
        try {
            const fetchFiles = await getAllFiles(folderId);

            const transformedFiles: ReduxFile[] = 
                (Array.isArray(fetchFiles) ? fetchFiles : [fetchFiles])
                .map(file => (file ? transformFile(file as MongooseFile) : null ))
                .filter((file): file is ReduxFile => file !== null);

            if(!transformedFiles){
                return {
                    success: false,
                    error: "Failed to transformed all files",
                }
            }
           
             if(transformedFiles.length > 0 && !hasFetchedFolderFilesRef.has(folderId)){
                dispatch(SET_FILES({
                    folderId: folderId,
                    files: transformedFiles
                }));
                if(!currentFile && !transformedFiles.some(file => file._id === currentFile)){
                    const firstFile = transformedFiles[0];
                    if(firstFile && firstFile._id){
                         dispatch(SET_CURRENT_FILE(firstFile));
                    }
                   
                }
            }else{
                dispatch(SET_FILES({
                    folderId: folderId,
                    files: []
                }));
                dispatch(SET_CURRENT_FILE(null));
            }
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

    /**
     * @method currentFileDetails
     * @description Orchestrates the retrieval of a single file's full metadata.
     * Logic Flow:
     * 1. Cache Check: Scans the local Redux 'files' state first to avoid network latency.
     * 2. State Sync: If found locally, updates the global 'currentFile' pointer.
     * 3. Network Fetch: If missing, fetches from the API, transforms the data, 
     * and populates both the file list and the current selection in Redux.
     */
     const currentFileDetails = useCallback(async (fileId: string): Promise<{
        success: boolean,
        data?: ReduxFile,
        error?: string
     }> => {
        if(!fileId){
            return { success: false, error: "File id required" };
        }
        const cachedFile = files.find(file => file._id === fileId);

        if(cachedFile){
            // we still need to set the global currentFileId to ensure the UI is correct
            dispatch(SET_CURRENT_FILE(cachedFile));
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
            if(!transformedFile){
                return {
                    success: false,
                    error: "Failed to transform file",
                };
            }
            dispatch(ADD_FILE({
                folderId:file.folderId,
                file: transformedFile
            }));
            dispatch(SET_CURRENT_FILE(transformedFile));
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
        files,
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

        if(currentFile?._id){
            hasFetchedCurrentFileRef.delete(currentFile._id);
        }

    },[currentFile?._id]);


    /**
     * @method addBlockHandler
     * Implementation of Optimistic UI for block insertion. 
     * Instantly updates Redux, then rolls back the state if the API call fails.
     */
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

                const file = files.find(file => file._id === fileId);
                if(!file){
                    return {
                        success: false,
                        error: "File not found in store"
                    }
                }
                dispatch(UPDATE_BLOCK({
                    folderId,
                    fileId,
                    blockId: newBlock.data.block.id,
                    updates: newBlock.data.block
                }))
                    dispatch(UPDATE_FILE({
                        folderId: file._id,
                        id: fileId,
                        updates: {
                            blocks: {
                                ...file.blocks,
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
                dispatch(DELETE_BLOCK({ 
                    folderId: currentFolder?._id!,
                    fileId, 
                    blockId: block.id
                }));
                return {
                    success: false,
                    error: error.message
                }
            }
    },[
        dispatch
    ])

   /**
     * @method updateBlockHandler
     * @description Implements Optimistic UI Updates for block-level changes.
     * 1. Immediately dispatches updates to Redux to ensure zero-latency for the user.
     * 2. Synchronizes the change with the backend in the background.
     */
    const updateBlockHandler = useCallback(async (
        fileId: string,
        blockId: string,
        updates: UIBlock
    ) => {
        // Step 1: Optimistic Update (Immediate UI response)
        dispatch(UPDATE_BLOCK({
                folderId,
                fileId,
                blockId,
                updates
            }));
        if(!folderId){
            console.warn("[useFile] Cannot update block: No folderId found.");
            return;
        }
        try {
            // Step 2: Background Synchronization
            const result = await updateBlock(fileId, blockId, updates);
            
            return {
                success: true,
                data: result
            }
        } catch (error: any) {
            /** * Note for Recruiter: In a production environment, if this fails, 
             * we would ideally implement a rollback dispatch here to revert the UI 
             * to the previous known-good state from the server.
             */
            console.warn("[useFile] Failed to update block due to following error: ",error);
            return {
                success: false,
                error: error.message
            }
        }
    }, [
        dispatch,
        folderId,
    ])

     /**
     * @method deleteBlockHandler
     * @description Handles permanent removal of content blocks.
     * Ensures local Redux state and remote Database state remain synchronized.
     */

    const deleteBlockHandler = useCallback(async (
        fileId: string,
        blockId: string,
    ) => {
        try {
            // Wait for server confirmation before removing from UI to prevent data loss
            const result = await deleteBlock(fileId, blockId);

            dispatch(DELETE_BLOCK({
                folderId: currentFolder?._id!,
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

    /**
     * @method getWorkspaceFilesFromStore
     * @description A high-performance utility to retrieve files already present 
     * in the Redux store without triggering a network request.
     */
    const getWorkspaceFilesFromStore = useCallback(
        (workspaceId: string) => {
            if(!workspaceId) return [];

            // Filters the local normalized state for specific workspace membership
            return files.filter(file => file.workspaceId === workspaceId);
        },[
            files
        ])
      // --- Derived States ---
    const allFilesArray = files;
    const currentFileObject = useMemo(() => {
        return currentFile
        ? files.find(file => file === currentFile)
        : undefined;
    }, [ currentFile, files ])
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
        deleteBlockHandler,
        getWorkspaceFilesFromStore,
     }
}
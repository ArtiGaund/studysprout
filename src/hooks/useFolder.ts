/**
 * @hook useFolder
 * @description A robust controller hook for managing Folder entities within a Workspace.
 * * ADVANCED ARCHITECTURAL PATTERNS:
 * 1. Normalized State Sync: Translates backend Mongoose entities into a flattened Redux structure.
 * 2. Scope-Aware Loading: Tracks loading/error states per WorkspaceId to prevent UI flicker across different views.
 * 3. Cache Management: Implements a "Cache-First" strategy using singleton Refs to minimize API overhead.
 * 4. Automatic Selection: Smart logic to auto-select the first folder in a workspace if none is active.
 */
"use client";

import { useCallback, useMemo, useRef } from "react";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { 
    ADD_FOLDER, 
    SET_CURRENT_FOLDER, 
    SET_FOLDER_ERROR, 
    SET_FOLDER_LOADING, 
    SET_FOLDERS, 
    UPDATE_FOLDER 
} from "@/store/slices/folderSlice";
import { getAllFolders } from "@/services/workspaceServices";
import { ConceptGraph, ReduxFolder } from "@/types/state.type";
import { addFolder, conceptGraphService, getCurrentFolder, learningPathService } from "@/services/folderServices";
import { updateDir } from "@/services/dirServices";
import { transformFolder } from "@/utils/data-transformers";
import { hasFetchedFoldersByWorkspaceRef } from "@/cache/folderCache";
import {
     makeSelectFolders, 
     selectCurrentFolder, 
     selectFolderError, 
     selectFolderLoading
 } from "@/store/selectors/folderSelector";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { useToast } from "@/components/ui/use-toast";
import { LearningPathFileNode } from "@/components/dashboard-shared/learning-path-view";

const EMPTY_ARRAY: ReduxFolder[] = [];
export function useFolder(){
    const dispatch = useDispatch();

    // --- Contextual Selectors ---
   const currentFolder = useSelector(selectCurrentFolder);
   const currentWorkspace = useSelector(selectCurrentWorkspace);
   const workspaceId = currentWorkspace?._id;

   // Instance-specific memoized selector for workspace-bound folders
   const selectFolders = useMemo(makeSelectFolders, []);
   const folders = useSelector( (state: RootState) => 
    workspaceId ? selectFolders(state, workspaceId) : EMPTY_ARRAY
   );

   const folderLoading = useSelector(selectFolderLoading);
   const folderError = useSelector(selectFolderError);
   const { toast } = useToast();

   const learningPathCacheRef = useRef<Map<string, LearningPathFileNode[]>>(new Map());
   
   /**
     * @method getFolders
     * Implements a cache-first fetch logic. 
     * Prioritizes existing Redux state before hitting the network.
     */
    const getFolders = useCallback(async( workspaceId: string): Promise<{
        success: boolean,
        data?: ReduxFolder[],
        error?: string
    }> => {
        if(!workspaceId) {
            return { success: false, error: "Workspace id required" };
        }

        // checking if data for this workspace is already in Redux
        // and if the folders array (allFolderIds) is not empty
        // This will avoid unnecessary API calls but allows refetch if state is cleared or partially loaded
        const existingFolders = folders;

        // 1. Return cached data if available
        if (hasFetchedFoldersByWorkspaceRef.has(workspaceId) && existingFolders.length > 0) {
            // Return existing Redux data mapped back to Mongoose-like structure if needed by caller
            return { 
                success: true, 
                data: existingFolders as ReduxFolder[] 
            }; 
        }
        
        dispatch(SET_FOLDER_LOADING({
            workspaceId,
            loading: true,
        }));
        dispatch(SET_FOLDER_ERROR(null));
        try {
            const fetchFolders = await getAllFolders(workspaceId);
            
            const transformedFolders = (Array.isArray(fetchFolders) 
            ? fetchFolders
            : [fetchFolders]
            ).filter(Boolean)
            .map(folder => transformFolder(folder as MongooseFolder))
           
            // 2. Batch update Redux state
            dispatch(SET_FOLDERS({
                workspaceId,
                folders: transformedFolders
            }));

                // 3. UX Logic: Auto-select context if current selection is invalid/empty
                if(!currentFolder || 
                    !transformedFolders.some((folder) => folder._id === currentFolder._id)){
                const firstFolder = transformedFolders[0];
                if(firstFolder && firstFolder._id){
                    dispatch(SET_CURRENT_FOLDER(firstFolder));
                    }
                }
             hasFetchedFoldersByWorkspaceRef.add(workspaceId);
            return{
                success: true,
                data: transformedFolders,
            }
        } catch (error: any) {
             console.error('Error while fetching workspace folders in hook in hook:', error);
            const errorMessage = error.message || "Failed to fetch all the folders of workspace";
            dispatch(SET_FOLDER_ERROR(errorMessage));
            hasFetchedFoldersByWorkspaceRef.delete(workspaceId);
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FOLDER_LOADING({
                workspaceId,
                loading: false,
            }));
        }

    }, [
        dispatch,
    ])


    /**
     * @method createFolder
     * Handles new entity persistence and updates both local state and caches.
     */
    const createFolder = useCallback(async( workspaceId: string ): Promise<{
        success: boolean,
        data?: ReduxFolder,
        error?: string
    }> => {
        if(!workspaceId)
            return {
                success: false,
                error: "WorkspaceId is required"
            }
            dispatch(SET_FOLDER_LOADING({
                workspaceId,
                loading: true,
            }));
            dispatch(SET_FOLDER_ERROR(null));
            try {
                const result = await addFolder(workspaceId);
                const newFolder = result.folder;
                // console.log("[ADD new Folder] newFolder: ",newFolder);
                if(!newFolder || !newFolder._id){
                    throw new Error("[Add new Folder] Server returned a folder without an ID");
                }
                const transformedFolder = transformFolder(newFolder as MongooseFolder);

                dispatch(ADD_FOLDER({
                    workspaceId,
                    folder: transformedFolder
                }));
                dispatch(SET_CURRENT_FOLDER(transformedFolder));
                // Invalidate cache to maintain data integrity
                if (workspaceId) {
                    hasFetchedFoldersByWorkspaceRef.delete(workspaceId);
                }
                return {
                    success: true,
                    data: transformedFolder,
                }
            } catch (error: any) {
                console.error('Error creating folder in hook:', error);
                const errorMessage = error.message || "Failed to create folder";
                dispatch(SET_FOLDER_ERROR(errorMessage));
                return { success: false, error: errorMessage };
            }finally{
                dispatch(SET_FOLDER_LOADING({
                    workspaceId,
                    loading: false
                }));
            }
    }, [dispatch])

    /**
     * @method updateFolder
     * Polymorphic update utility. Synchronizes changes with the 'dir' (directory) service.
     */
    const updateFolder = useCallback(async(folderId: string, updatedData: Partial<MongooseFolder>): Promise<{
        success: boolean,
        data?: ReduxFolder,
        error?: string
    }> => {
        if(!folderId){
            console.error("[Update Folder hook] folderId is required");
            return {
                success: false,
                error: "FolderId required", 
            }
        }
        if(!updatedData)
            return {
                success: false,
                error: "Folder data required"
            }
            if(!workspaceId){
                return {
                    success: false,
                    error: "WorkspaceId required"
                }
            }
            dispatch(SET_FOLDER_LOADING({
                workspaceId,
                loading: true
            }));
            dispatch(SET_FOLDER_ERROR(null));
        try {
            const result = await updateDir("folder", folderId , updatedData);
            const folder = result.folder;
            if(!result){
                return {
                    success: false,
                    error:"Failed to update folder"
                }
            }
            if( !folder){
                return {
                    success: false,
                    error: result?.error || "Failed to update folder or invalid response from service"
                }
            }
            const transformedReduxFolder = transformFolder(folder);

            dispatch(UPDATE_FOLDER({
                workspaceId,
                id: transformedReduxFolder._id,
                updates: transformedReduxFolder
            }));

            // hasFetchedCurrentFolderRef.current.delete(folderId);
            // If the folder's workspace ID is available, clear the workspace folders ref
            if (folder.workspaceId) { // Assuming folder object has workspaceId
                hasFetchedFoldersByWorkspaceRef.delete(folder.workspaceId.toString());
            }
            return {
                success: true,
                data: transformedReduxFolder,
            }
        } catch (error: any) {
            console.error('Error update folder in hook:', error);
            const errorMessage = error.message || "Failed to update folder";
            dispatch(SET_FOLDER_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FOLDER_LOADING({
                workspaceId,
                loading: false
            }));
        }
    }, [
        dispatch,
        // currentFolderId,
    ])

    /**
     * @method currentFolderDetail
     * @description Orchestrates a tiered data retrieval strategy (Local State -> Redux Cache -> API).
     * This is essential for 'Deep Linking' where a user might enter the app via a folder-specific URL.
     * * * Logic Flow:
     * 1. Identity Check: Returns immediately if the requested folder is already active.
     * 2. Cache Lookup: Scans the normalized Redux state for existing data to prevent network overhead.
     * 3. Remote Fetch: Performs an async fetch, transforms the Mongoose entity, and hydrates Redux.
     */
    const currentFolderDetail = useCallback(async (folderId: string): Promise<{
        success: boolean,
        data?: ReduxFolder,
        error?: string
    }> => {
        if(!folderId){
             return {
                success: false,
                error: "Folder id required"
            }
        }
        if(!workspaceId){
            return{
                success: false,
                error: "WorkspaceId required"
            }
        }
        // 1.Identity Check (Zero latency)
         if (currentFolder?._id === folderId) {
            return { success: true, data: currentFolder as ReduxFolder }; // Return existing Redux data mapped back to Mongoose-like
        }
        // 2. Redux Cache Lookup (Microsecond latency)
        const cachedFolder = folders.find(folder => folder._id === folderId);
        if(cachedFolder){
            dispatch(SET_CURRENT_FOLDER(cachedFolder));
            return {
                success: true,
                data: cachedFolder as ReduxFolder
            }
        }

        //3.  Remote Fetch (Network latency)
        dispatch(SET_FOLDER_LOADING({
            workspaceId,
            loading: true
        }));
        dispatch(SET_FOLDER_ERROR(null));
        
        try {
            const folder = await getCurrentFolder(folderId);
            if(!folder){
                return {
                    success: false,
                    error: "Failed to get current folder"
                }
            }
            const transformedFolder = transformFolder(folder);
            // Hydrate the normalized state with the newly fetched entity
            dispatch(ADD_FOLDER({
                workspaceId,
                folder: transformedFolder
            }));
            dispatch(SET_CURRENT_FOLDER(transformedFolder));
            
            return {
                success: true,
                data: transformedFolder,
            }
        } catch (error: any) {
             console.error('Error fetching current folder in hook:', error);
            const errorMessage = error.message || "Failed to fetch current folder";
            dispatch(SET_FOLDER_ERROR(errorMessage));
           
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_FOLDER_LOADING({
                workspaceId,
                loading: false
            }));
        }
    }, [
        dispatch,
        folders,
        currentFolder,
    ])

    const generateConceptGraph = useCallback(async (folderId: string): Promise<{
        success: boolean,
        data?: ReduxFolder,
        error?: string,
    }> => {
        if(!folderId || !workspaceId){
            return {
                success: false,
                error: "FolderId and WorkspaceId are required."
            }
        }

        // Set generating status in Redux immediately
        dispatch(UPDATE_FOLDER({
            workspaceId,
            id: folderId,
            updates: {
                conceptGraphStatus: "generating",
            }
        }));

        try {
            const result = await conceptGraphService(folderId);
            if(!result?.updatedFolder){
                return {
                    success: false,
                    error: result.message ||"Failed to generate concept graph",
                }
            }
            const folder = transformFolder(result.updatedFolder);

            // Update the folder in Redux with the new concept graph and set status to 'completed'
            dispatch(UPDATE_FOLDER({
                workspaceId,
                id: folderId,
                updates: folder,
            }));

            return {
                success: true,
                data: folder as ReduxFolder,
            }

        } catch (error) {
            console.error('Error generating concept graph in hook:', error);
            const errorMessage = error instanceof Error ? error.message : "Failed to generate concept graph";
            dispatch(UPDATE_FOLDER({
                workspaceId,
                id: folderId,
                updates: {
                    conceptGraphStatus: "error",
                }
            }));
            return {
                success: false,
                error: errorMessage,
            }
        }
    },[
        workspaceId,
    ])

    const getLearningPath = useCallback(async (folderId: string):Promise<{
        success: boolean,
        data?: LearningPathFileNode[],
        error?: string,
    }> => {
        if(!folderId){
            return {
                success: false,
                error: "FolderId is required",
            };
        }

        if(learningPathCacheRef.current.has(folderId)){
            return {
                success: true,
                data: learningPathCacheRef.current.get(folderId)!,
            };
        }

        try {
            const result = await learningPathService(folderId);
            if(!result){
                return {
                    success: false,
                    error: "Failed to load learning path",
                };
            }

            learningPathCacheRef.current.set(folderId, result.learningPath);
            
            return {
                success: true,
                data: result.learningPath,
            };
        } catch (error) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Failed to load learning path";
            return { success: false, error: errorMessage };
        }
    },[])

   /**
     * @method invalidateFolderCaches
     * @description Explicitly clears the fetch-tracking refs for a workspace.
     * Use this when performing bulk operations or forced refreshes to ensure 
     * the next 'getFolders' call hits the server.
     */
    const invalidateFolderCaches = useCallback((workspaceId: string) => {
        if(workspaceId){
            hasFetchedFoldersByWorkspaceRef.delete(workspaceId);
        }
    },[])
     // --- Derived States ---
   
    // To resolve above issue, use useMemo
    const allFoldersArray = folders;
   
    // --- Optimized Derived State ---
    const currentFolderObject = useMemo(() => {
        return currentFolder 
        ? folders.find(folder => folder === currentFolder) 
        : undefined;
    }, [ 
        currentFolder,
        folders,
     ]);

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
        generateConceptGraph,
        getLearningPath,
        invalidateFolderCaches,
     }

}
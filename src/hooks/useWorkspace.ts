/**
 * @hook useWorkspace
 * @description The primary controller for Workspace-level operations and global state synchronization.
 * * ARCHITECTURAL HIGHLIGHTS:
 * 1. Multi-Level Caching: Uses specialized Refs (`hasFetchedAllWorkspaceRef`, etc.) to prevent redundant network traffic.
 * 2. Auth-Integrated Logic: Automatically gates workspace operations based on the user's authentication status.
 * 3. Optimistic Updates: Dispatches title changes to Redux immediately while syncing with the server in the background.
 * 4. Resource Cleanup: Implemented `hardDeleteDir` for permanent removal of workspace trees.
 */
"use client";

import { WorkSpace as MongooseWorkSpace, WorkSpace} from "@/model/workspace.model";
import { hardDeleteDir } from "@/services/dirServices";
import { 
    addWorkspace,  
    getCurrentWorkspace, 
    getResearchGraphService, 
    getUserWorkspaces, 
    savingGoalService, 
    updateLogo, 
    updateWorkspace, 
    workspaceConceptGraphService,
    workspaceLearningPathService
} from "@/services/workspaceServices";
import { 
    ADD_WORKSPACE, 
    DELETE_WORKSPACE, 
    SET_CURRENT_WORKSPACE, 
    SET_WORKSPACE_ERROR, 
    SET_WORKSPACE_LOADING, 
    SET_WORKSPACES, 
    UPDATE_WORKSPACE, 
    UPDATE_WORKSPACE_PARTIAL
} from "@/store/slices/workspaceSlice";
import { RootState } from "@/store/store";
import { ConceptGraph, ReduxWorkSpace } from "@/types/state.type";
import { transformWorkspace } from "@/utils/data-transformers";
import { useCallback, useEffect, useMemo, useRef} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    hasFetchedAllWorkspaceRef,
    hasCheckedUserWorkspaceStatusRef,
    hasFetchedCurrentWorkspaceDetailsRef
} from "@/cache/workspaceCache";
import { selectAuthStatus, selectUserId } from "@/store/selectors/userSelector";
import { LearningPathFileNode } from "@/components/dashboard-shared/learning-path-view";
import { MARK_ACTIVITY_STALE } from "@/store/slices/activitySlice";
import { getLastWorkspace } from "@/lib/local-storage-workspace";

// ---GraphData type---
export interface GraphDayData{
    date: string;
    label: string;
    score: number;
    cardsReviewed: number;
    filesTouched: number;
}

export interface GraphData{
    days: GraphDayData[];
    dailyTarget: number;
    weeklyTotal: number;
    weeklyTargetTotal: number;
    percentComplete: number;
}

export function useWorkspace() {
    const currentUserId = useSelector(selectUserId);
    const authStatus = useSelector(selectAuthStatus);   
    const dispatch = useDispatch(); 

    // selector for workspace state
    const {
        byId: workspacesById,
        allIds: allWorkspaceIds,
        currentWorkspace,
        loading: loadingFromRedux,
        error: errorFromRedux,
    } = useSelector((state: RootState) => state.workspace);

    const currentWorkspaceRef = useRef(currentWorkspace);
    useEffect(() => {
        currentWorkspaceRef.current = currentWorkspace;
    },[currentWorkspace]);
    
    /**
     * @method getWorkspaces
     * Fetches all workspaces associated with the authenticated user.
     * Implements a singleton fetch pattern via `hasFetchedAllWorkspaceRef`.
     */
    const getWorkspaces = useCallback(async(): Promise<{
        success: boolean;
        data?: ReduxWorkSpace[];
        error?: string;
    }> => {

        // Handling auth logic inside the function
        if(!currentUserId || authStatus !== "authenticated"){
            return {
                success: false,
                error: "User not authenticated."
            }
        }
       
        // Guards against redundant calls for this specific fetch
        if(hasFetchedAllWorkspaceRef.has(currentUserId)){
            dispatch(SET_WORKSPACE_LOADING(false));
            return {
                success: true,
                data: allWorkspaceIds.map(id => workspacesById[id]).filter(Boolean) as ReduxWorkSpace[]
            }
        }
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));

        try {
            const response = await getUserWorkspaces(currentUserId);

            const transformedWorkspace = (Array.isArray(response)
            ? response
            : [response]
            ).filter(Boolean).map(workspace => transformWorkspace(workspace as MongooseWorkSpace));
            dispatch(SET_WORKSPACES(transformedWorkspace));

            const liveCurrentId = currentWorkspaceRef.current?._id;
            if(!liveCurrentId){
                // Nothing set yet - use last visited workspace or fallback to first
                const lastWorkspaceId = getLastWorkspace(currentUserId);
                const target = lastWorkspaceId
                    ? transformedWorkspace.find(w => w._id === lastWorkspaceId)
                    : null;
                dispatch(SET_CURRENT_WORKSPACE(target || transformedWorkspace[0]));
            }
            hasFetchedAllWorkspaceRef.add(currentUserId);
            return {
                success: true,
                data: transformedWorkspace
            }
        } catch (error: any) {
            console.error('Error while fetching user workspaces in hook:', error);
            dispatch(SET_WORKSPACE_ERROR(error.message || "Failed to fetch workspaces"));
            return { 
                success: false,
                 error: error.message || "Failed to fetch workspaces" 
            };
        } finally {
            dispatch(SET_WORKSPACE_LOADING(false)); // Clear loading state in Redux
        }
    }, [
        currentUserId,
        authStatus,
        dispatch
    ])

    /**
     * @method fetchCurrentWorkspace
     * Logic for deep-linking and direct navigation. 
     * Prioritizes the Redux 'byId' cache before initiating a network request.
     */
    const fetchCurrentWorkspace = useCallback(async ( workspaceId: string ): Promise<{
        success: boolean;
        data?: ReduxWorkSpace;
        error?: string;
    }> => {
        if(!workspaceId) {
            return {
                 success: false, 
                 error: "Workspace id required" 
            };
        }

        // 1. Cache Hit: Prevent unnecessary network latency
        if(workspacesById[workspaceId]){
            dispatch(SET_WORKSPACE_LOADING(false));
            dispatch(SET_CURRENT_WORKSPACE(workspacesById[workspaceId]));
            return { 
                success: true, 
                data: workspacesById[workspaceId] 
             };
        }
        
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));
        try {
            const workspace = await getCurrentWorkspace(workspaceId);
            if(!workspace){
                return {
                    success: false,
                    error: "Workspace not found."
                }
            }
             // Transform to Redux type before dispatching and returning
            const transformedWorkspace = transformWorkspace(workspace);

            // 2. Synchronize both 'current' pointer and the lookup table
            dispatch(SET_CURRENT_WORKSPACE(transformedWorkspace)); // Set current ID in Redux
            dispatch(UPDATE_WORKSPACE(transformedWorkspace)); // Also ensure the object is in byId map

            return {
                success: true,
                data: transformedWorkspace // Return the transformed Redux data
            };
        } catch (error: any) {
            console.error('Error while fetching current workspace in hook:', error);
            dispatch(SET_WORKSPACE_ERROR(error.message || "Failed to fetch current workspace"));
            dispatch(SET_CURRENT_WORKSPACE(null));
            return {
                success: false,
                error: error.message || "Failed to fetch current workspace"
            }
        } finally{
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    }, [
         dispatch,
        ])

    /**
     * @method createWorkspace
     * Handles multipart/form-data for workspace creation (Title + Logo).
     * Implements automatic cache invalidation for the user's workspace list.
     */
    const createWorkspace = useCallback(async ( formData: FormData ): Promise<{
         success: boolean; 
         data?: ReduxWorkSpace;
          error?: string
     }> => {
        if(authStatus !== "authenticated" || !currentUserId)
             return {success: false, error: "User is not authenticated"};
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));
        try {
            // Append ownership context if not present in the form payload
            if(!formData.has("userId")){
                formData.append("userId", currentUserId);
            }
            const newWorkspace = await addWorkspace(formData);

            const transformedWorkspace = transformWorkspace(newWorkspace as MongooseWorkSpace);
            dispatch(ADD_WORKSPACE(transformedWorkspace));
            dispatch(SET_CURRENT_WORKSPACE(transformedWorkspace));

            // Invalidate 'All' and 'Status' caches to trigger a fresh sidebar fetch
            if (currentUserId) {
                hasFetchedAllWorkspaceRef.delete(currentUserId);
                hasCheckedUserWorkspaceStatusRef.delete(currentUserId);
            }
            hasFetchedCurrentWorkspaceDetailsRef.delete(transformedWorkspace._id); 
            return {
                success: true,
                data: transformedWorkspace
            }
        } catch (error: any) {
            console.error('Error creating workspace in hook:', error);
            const errorMessage = error.message || "Failed to create workspace";
            dispatch(SET_WORKSPACE_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    }, [
        dispatch, 
        currentUserId, 
        authStatus,
    ])

    /**
     * @method currentWorkspaceDetails
     * @description High-performance fetch for a single workspace entity.
     * Implements a "Cache-First" strategy: 
     * 1. Checks Active Redux State.
     * 2. Checks Persistence Refs (hasFetchedCurrentWorkspaceDetailsRef).
     * 3. Falls back to Network Fetch only if necessary.
     */
    const currentWorkspaceDetails = useCallback(async (workspaceId: string): Promise<{
        success: boolean;
        data?: ReduxWorkSpace;
        error?: string
    }> => {
        if(!workspaceId){
            return { success: false, error: "Workspace id required" };
        }

        // 1. Immediate Return: If this workspace is already the current one in Redux
        if(currentWorkspace?._id === workspaceId && workspacesById[workspaceId]){
            dispatch(SET_WORKSPACE_LOADING(false));
            return { success: true, data: workspacesById[workspaceId] }; // Return Redux data from store
        }
        // 2. Cache Check: Prevent duplicate inflight requests for the same ID
        if (hasFetchedCurrentWorkspaceDetailsRef.has(workspaceId)) {
            dispatch(SET_WORKSPACE_LOADING(false));
            return { success: true, data: workspacesById[workspaceId] }; // Return Redux data from store
        }
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));
        try {
            const workspace = await getCurrentWorkspace(workspaceId);
            if(!workspace){
                return{
                    success: false,
                    error: "Workspace not found"
                }
            }
           const transformedWorkspace = transformWorkspace(workspace);

           // 3. Normalized Update: Update the specific entry in the 'byId' map 
            // and set it as the active workspace for the UI.
            dispatch(UPDATE_WORKSPACE(transformedWorkspace)); // Ensure this specific workspace is in the byId map
            dispatch(SET_CURRENT_WORKSPACE(transformedWorkspace)); // Also set it as current if not already
            
            // Mark this ID as fetched to prevent redundant calls in this session
            hasFetchedCurrentWorkspaceDetailsRef.add(workspaceId);
            return{
                success: true,
                data: transformedWorkspace // Return transformed Redux data
            };
        } catch (error: any) {
            console.error('Error fetching current workspace in hook:', error);
            const errorMessage = error.message || "Failed to fetch current workspace";
            dispatch(SET_WORKSPACE_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    }, [
        dispatch,
    ])

    /**
     * @method updateWorkspaceTitle
     * Demonstrates Optimistic UI: Updates local Redux state before API confirmation.
     */
    const updateWorkspaceTitle = useCallback(async (workspaceId: string, newTitle: string): Promise<{
        success: boolean;
        data?: ReduxWorkSpace;
        error?: string
    }> => {
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));
        try {
            const updateData: Partial<ReduxWorkSpace> = {_id: workspaceId, title: newTitle};
            dispatch(UPDATE_WORKSPACE(updateData as ReduxWorkSpace));
             const response = await updateWorkspace(newTitle, workspaceId);
             if(!response.success){
                 return {
                     success: false,
                     error: response.message
                 }
             }

             const transformedWorkspace = transformWorkspace(response.data as MongooseWorkSpace);
             dispatch(UPDATE_WORKSPACE(transformedWorkspace));
             hasFetchedCurrentWorkspaceDetailsRef.delete(workspaceId);
             if(currentUserId){
                hasFetchedAllWorkspaceRef.delete(currentUserId);
             }
             return {
                 success: true,
                 data: transformedWorkspace
             }
        } catch (error: any) {
            console.error("Error while updating the workspace name ", error);
            const errorMessage = error.message || "Failed to update current workspace";
            dispatch(SET_WORKSPACE_ERROR(errorMessage));
            return {
                success: false,
                error: errorMessage
            }
        }finally {
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    }, [
        dispatch,
        currentUserId,
    ]);

    /**
     * @method updateWorkspaceLogo
     * Handles binary file uploads (logos) while maintaining the normalized Redux state.
     */
    const updateWorkspaceLogo = useCallback(async (workspaceId: string, logo: File): Promise<{
        success: boolean;
        data?: ReduxWorkSpace;
        error?: string
    }> => {
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));
        try {
            const updateWorkspace = await updateLogo(workspaceId, logo);
            if(!updateWorkspace.success){
                const errorMessage = updateWorkspace.message || "Failed to update current workspace";
                dispatch(SET_WORKSPACE_ERROR(errorMessage));
                return {
                    success: false,
                    error: updateWorkspace.message
                }
            }
            const workspace = updateWorkspace.data as MongooseWorkSpace;

            const transformedWorkspace = transformWorkspace(workspace as MongooseWorkSpace);
            dispatch(UPDATE_WORKSPACE(transformedWorkspace));
            hasFetchedCurrentWorkspaceDetailsRef.delete(workspaceId);
            if(currentUserId){
                hasFetchedAllWorkspaceRef.delete(currentUserId);
            }
            return {
                success: true,
                data: transformedWorkspace,
            }

        } catch (error: any) {
            console.error("Error while updating the workspace logo ", error);
            const errorMessage = error.message || "Failed to update current workspace";
            dispatch(SET_WORKSPACE_ERROR(errorMessage));
            return {
                success: false,
                error: errorMessage
            }
            
        }finally {
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    }, [
        dispatch,
        currentUserId
    ])

    /**
     * @method deleteWorkspace
     * Orchestrates the permanent removal of a workspace.
     * Communicates with the directory service to ensure all nested folders/files are purged.
     */
    const deleteWorkspace = useCallback(async (workspaceId: string): Promise<{
        success: boolean;
        data?: MongooseWorkSpace;
        error?: string
    }> => {
            dispatch(SET_WORKSPACE_LOADING(true));
            dispatch(SET_WORKSPACE_ERROR(null));
            try {
                const response = await hardDeleteDir("workspace",workspaceId);
                if(!response.success){
                    const errorMessage = response.message || "Failed to delete current workspace";
                    return {
                        success: false,
                        error: errorMessage
                    }
                }
                dispatch(DELETE_WORKSPACE(workspaceId));
                return {
                    success: true,
                    data: response.data
                }
            } catch (error: any) {
                console.error("Error while deleting the workspace ", error);
                const errorMessage = error.message || "Failed to delete current workspace";
                dispatch(SET_WORKSPACE_ERROR(errorMessage));
                return {
                    success: false,
                    error: errorMessage
                }
            
            }finally {
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    },[dispatch])

    /**
     * @method checkUserHaveCreatedWorkspace
     * A lightweight 'Existence Check' used for routing logic (e.g., onboarding vs dashboard).
     * Uses a dedicated 'Status' cache to prevent repeated 'existence' queries.
     */
    const checkUserHaveCreatedWorkspace = useCallback( async (userIDToCheck: string): Promise<{
        success: boolean;
        data?: boolean;
        error?: string
    }> => {
        if(!userIDToCheck){
            return {
                success: false,
                error: "No user ID provided."
            }
        }

        if(hasCheckedUserWorkspaceStatusRef.has(userIDToCheck)){
            dispatch(SET_WORKSPACE_LOADING(false));
            return {
                success: true,
                data: allWorkspaceIds.length > 0
            }
        }

        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));

        try {
            const response = await getUserWorkspaces(userIDToCheck);

            const hasWorkspaces = Array.isArray(response) && response.length > 0;
            if(!response){
                dispatch(SET_WORKSPACES([]));
            }
            hasCheckedUserWorkspaceStatusRef.add(userIDToCheck);
            return {
                success: true,
                data: hasWorkspaces
            }
        } catch (error: any) {
            console.error("Error checking user workspace status:", error);
            dispatch(SET_WORKSPACE_ERROR(error.message || "Failed to check workspace status"));
            hasCheckedUserWorkspaceStatusRef.delete(userIDToCheck);
            return { success: false, error: error.message || "An unexpected error occurred." };
        } finally{
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    },[
        dispatch
    ])

    const generateWorkspaceConceptGraph = useCallback(async (workspaceId: string ): Promise<{
        success: boolean;
        data?: ConceptGraph;
        error?: string;
    }> => {

        if(!workspaceId) return {
            success: false,
            error: "WorkspaceId is required",
        }

        dispatch(UPDATE_WORKSPACE_PARTIAL({
            id: workspaceId,
            updates: {
                conceptGraphStatus: "generating",
            },
        }));
        try {
            const result = await workspaceConceptGraphService(workspaceId);
            if(!result.success || !result.data){
                dispatch(UPDATE_WORKSPACE_PARTIAL({
                    id: workspaceId,
                    updates: {
                        conceptGraphStatus: "error",
                    },
                }));
                return {
                    success: false,
                    error: result.message,
                };
            }

            const sanitized = {
                ...result.data,
                inTrash: result.data.inTrash ?? undefined,
                logo: result.data.logo ?? undefined, 
            }
            const workspace = transformWorkspace(sanitized as WorkSpace);
            dispatch(UPDATE_WORKSPACE(workspace));
            dispatch(MARK_ACTIVITY_STALE());
            return {
                success: true,
                data: workspace.conceptGraph ?? undefined,
            };
        } catch (error) {
            console.error("[useWorkspace] Failed to generateWorkspaceConceptGraph: ",error);
            dispatch(UPDATE_WORKSPACE_PARTIAL({
                id: workspaceId,
                updates: {
                    conceptGraphStatus: "error",
                },
            }));
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed",
            }
        }
    },[
        dispatch,
    ]);

    const getWorkspaceLearningPath = useCallback(async( workspaceId: string): Promise<{
        success: boolean;
        data?: LearningPathFileNode[];
        error?: string;
    }> => {
        if(!workspaceId) return {
            success: false,
            error: "WorkspaceId is required",
        }

        try {
            const result = await workspaceLearningPathService(workspaceId);
            if(!result) return {
                success: false,
                error: "Failed to fetch",
            }

            return {
                success: true,
                data: result.learningPath,
            }
        } catch (error) {   
            console.error("[useWorkspace] Failed to get workspace learning path: ",error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : "Failed" 
            };
        }
    },[])

    const saveGoal = useCallback(async(workspaceId: string, dailyTarget: number): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> => {
        if(!workspaceId || !dailyTarget) return {
            success: false,
            error: "[Save Goal] WorkspaceId and dailyTarget is required"
        }

        try {
            const result = await savingGoalService(workspaceId, dailyTarget);
             if(!result) return {
                success: false,
                error: "Failed to save goal",
            }

            return {
                success: true,
                data: result.data,
            }
        } catch (error: any) {
            console.error("[Save Goal] Failed: ",error.message);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : "Failed" 
            };
        }
    },[])

    const getResearchGraph = useCallback(async( workspaceId: string ): Promise<{
        success: boolean;
        data?: GraphData;
        error?: string;
    }> => {
        if(!workspaceId) return {
            success: false,
            error: "[getResearchGraph] WorkspaceId and dailyTarget is required"
        }
        try {
            const result = await getResearchGraphService(workspaceId);
             if(!result) return {
                success: false,
                error: "Failed to fetch research graph",
            }

            return {
                success: true,
                data: result.data as GraphData,
            }
        } catch (error: any) {
            console.error("[getResearchGraph] Failed: ",error.message);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : "Failed" 
            };
        }
    },[]);

    
    // --- Memoized Derived Exports ---
    const allWorkspacesArray = useMemo(() => {
        return allWorkspaceIds.map( id => workspacesById[id]);
    },[
        allWorkspaceIds,
        workspacesById
    ])

    return {
        // Data derived from Redux store
        workspaces: allWorkspacesArray,
        hasWorkspaces: allWorkspaceIds.length > 0,
        currentWorkspace: currentWorkspace,
        currentWorkspaceId: currentWorkspace?._id, // Expose the ID if needed

        // Loading and error states from Redux
        isLoadingWorkspaces: loadingFromRedux || authStatus === "loading", // Combine Redux loading with session loading
        workspaceError: errorFromRedux,

        // Functions to trigger actions
        getWorkspaces,
        createWorkspace,
        fetchCurrentWorkspace,
        currentWorkspaceDetails,
        updateWorkspaceTitle,
        updateWorkspaceLogo,
        checkUserHaveCreatedWorkspace,
        deleteWorkspace,
        generateWorkspaceConceptGraph,
        getWorkspaceLearningPath,
        saveGoal,
        getResearchGraph,
    }
}
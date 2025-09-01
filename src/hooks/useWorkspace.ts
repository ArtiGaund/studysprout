"use client";

import { WorkSpace as MongooseWorkSpace} from "@/model/workspace.model";
import { hardDeleteDir } from "@/services/dirServices";
import { addWorkspace, getCurrentWorkspace, getUserWorkspaces, updateLogo, updateWorkspace } from "@/services/workspaceServices";
import { ADD_WORKSPACE, DELETE_WORKSPACE, SET_CURRENT_WORKSPACE, SET_WORKSPACE_ERROR, SET_WORKSPACE_LOADING, SET_WORKSPACES, UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { RootState } from "@/store/store";
import { ReduxWorkSpace } from "@/types/state.type";
import { transformWorkspace } from "@/utils/data-transformers";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    hasFetchedAllWorkspaceRef,
    hasCheckedUserWorkspaceStatusRef,
    hasFetchedCurrentWorkspaceDetailsRef
} from "@/cache/workspaceCache";

export function useWorkspace() {
    const { data: session, status } = useSession();
    const dispatch = useDispatch(); 

    // selector for workspace state
    const {
        byId: workspacesById,
        allIds: allWorkspaceIds,
        currentWorkspace: currentWorkspaceId,
        loading: loadingFromRedux,
        error: errorFromRedux,
    } = useSelector((state: RootState) => state.workspace);
    
    // function to fetch all user workspaces and dispatch to Redux
    const getWorkspaces = useCallback(async(): Promise<{
        success: boolean;
        data?: ReduxWorkSpace[];
        error?: string;
    }> => {

        // Handling auth logic inside the function
        if(!session?.user?._id || status !== "authenticated"){
            console.log(`[useWorkspace] getWorkspaces: Not authenticated.`);
            return {
                success: false,
                error: "User not authenticated."
            }
        }
        // only proceed if session  is authenticated and userId is available
        if(status !== "authenticated" || !session?.user?._id) {
            console.log("[useWorkspace] getWorkspaces: Not authenticated or no user ID");
            return {
                success: false,
                error: "Not authenticated or no user ID."
            };
        }
       
        // Guards against redundant calls for this specific fetch
        if(hasFetchedAllWorkspaceRef.has(session.user._id)){
            console.log(`[useWorkspace] Skipping getWorkspaces for userID ${session.user._id}: already fetched.`);
            console.log(`[useWorkspace] getWorkspaces: workspacesById: `, workspacesById);
            return {
                success: true,
                data: allWorkspaceIds.map(id => workspacesById[id]).filter(Boolean) as ReduxWorkSpace[]
            }
        }
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));

        try {
            console.log(`[useWorkspace] Fetching all workspaces for user ID: ${session.user._id}`);
            const response = await getUserWorkspaces(session.user._id);

            // const workspaces = Array.isArray(response) 

            console.log(`[useWorkspace] getWorkspaces: response: `,response);

            const transformedWorkspace = (Array.isArray(response)
            ? response
            : [response]
            ).filter(Boolean).map(workspace => transformWorkspace(workspace as MongooseWorkSpace));

            console.log(`[useWorkspace] getWorkspaces: transformedWorkspace: `, transformedWorkspace);

            if(transformedWorkspace.length > 0){
                dispatch(SET_WORKSPACES(transformedWorkspace));
                if(!currentWorkspaceId && !transformedWorkspace.some(workspace => workspace._id === currentWorkspaceId)){
                    const firstWorkspace = transformedWorkspace[0];
                    console.log(`[useWorkspace] getWorkspaces: firstWorkspace: `, firstWorkspace);
                    if(firstWorkspace && firstWorkspace._id){
                        dispatch(SET_CURRENT_WORKSPACE(firstWorkspace._id));
                    }
                }
            }else{
                dispatch(SET_WORKSPACES([]));
                dispatch(SET_CURRENT_WORKSPACE(null));
            }
            hasFetchedAllWorkspaceRef.add(session.user._id);
            return {
                success: true,
                data: transformedWorkspace
            }
            // setWorkspaces(workspaces);
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
        session?.user?._id,
        status,
        // allWorkspaceIds,
        // workspacesById,
        // currentWorkspaceId,
        dispatch
    ])

    // function to fetch current workspace
    const fetchCurrentWorkspace = useCallback(async ( workspaceId: string ): Promise<{
        success: boolean;
        data?: ReduxWorkSpace;
        error?: string;
    }> => {
        if(!workspaceId) {
            console.log("[useWorkspace] fetchCurrentWorkspace: No workspaceId provided.");
            return {
                 success: false, 
                 error: "Workspace id required" 
            };
        }

        if(currentWorkspaceId === workspaceId && workspacesById[workspaceId]){
            console.log(`[useWorkspace] Skipping fetchCurrentWorkspace for ${workspaceId}: already set.`);
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
            dispatch(SET_CURRENT_WORKSPACE(transformedWorkspace._id)); // Set current ID in Redux
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
        //  currentWorkspaceId,
        //  workspacesById
        ])

    // function to create new workspace
    const createWorkspace = useCallback(async ( formData: FormData ): Promise<{
         success: boolean; 
         data?: ReduxWorkSpace;
          error?: string
     }> => {
        if(status !== "authenticated" || !session?.user?._id)
             return {success: false, error: "User is not authenticated"};
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));
        try {
            if(!formData.has("userId")){
                formData.append("userId", session.user._id);
            }
            const newWorkspace = await addWorkspace(formData);

            const transformedWorkspace = transformWorkspace(newWorkspace as MongooseWorkSpace);
            dispatch(ADD_WORKSPACE(transformedWorkspace));
            dispatch(SET_CURRENT_WORKSPACE(transformedWorkspace._id));

            if (session.user._id) {
                hasFetchedAllWorkspaceRef.delete(session.user._id);
                hasCheckedUserWorkspaceStatusRef.delete(session.user._id);
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
    }, [dispatch, session?.user?._id, status])
    const currentWorkspaceDetails = useCallback(async (workspaceId: string): Promise<{
        success: boolean;
        data?: ReduxWorkSpace;
        error?: string
    }> => {
        if(!workspaceId){
            console.log("[useWorkspace] currentWorkspaceDetails: No workspaceId provided.");
            return { success: false, error: "Workspace id required" };
        }

        if(currentWorkspaceId === workspaceId && workspacesById[workspaceId]){
            console.log(`[useWorkspace] Skipping currentWorkspaceDetails for ${workspaceId}: already set in Redux.`);
            return { success: true, data: workspacesById[workspaceId] }; // Return Redux data from store
        }
        // NEW: Add useRef guard for this specific function call
        if (hasFetchedCurrentWorkspaceDetailsRef.has(workspaceId)) {
            console.log(`[useWorkspace] Skipping currentWorkspaceDetails for ${workspaceId}: already initiated.`);
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
            dispatch(UPDATE_WORKSPACE(transformedWorkspace)); // Ensure this specific workspace is in the byId map
            dispatch(SET_CURRENT_WORKSPACE(transformedWorkspace._id)); // Also set it as current if not already
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
        // currentWorkspaceId,
        // workspacesById
    ])
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
             if(session?.user._id){
                hasFetchedAllWorkspaceRef.delete(session.user._id);
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
        session?.user._id
    ]);

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
            if(session?.user._id){
                hasFetchedAllWorkspaceRef.delete(session.user._id);
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
        session?.user._id
    ])

    // const deleteWorkspace = useCallback(async (workspaceId: string): Promise<{
    //     success: boolean;
    //     data?: MongooseWorkSpace;
    //     error?: string
    // }> => {
    //         dispatch(SET_WORKSPACE_LOADING(true));
    //         dispatch(SET_WORKSPACE_ERROR(null));
    //         try {
    //             const response = await hardDeleteDir("workspace",workspaceId);
    //             if(!response.success){
    //                 const errorMessage = response.message || "Failed to delete current workspace";
    //                 return {
    //                     success: false,
    //                     error: errorMessage
    //                 }
    //             }
    //             dispatch(DELETE_WORKSPACE(workspaceId));
    //             return {
    //                 success: true,
    //                 data: response.data
    //             }
    //         } catch (error: any) {
    //             console.error("Error while deleting the workspace ", error);
    //             const errorMessage = error.message || "Failed to delete current workspace";
    //             dispatch(SET_WORKSPACE_ERROR(errorMessage));
    //             return {
    //                 success: false,
    //                 error: errorMessage
    //             }
            
    //         }finally {
    //         dispatch(SET_WORKSPACE_LOADING(false));
    //     }
    // },[dispatch])

    const checkUserHaveCreatedWorkspace = useCallback( async (userIDToCheck: string): Promise<{
        success: boolean;
        data?: boolean;
        error?: string
    }> => {
        if(!userIDToCheck){
            console.log(`[useWorkspace] checkUserHaveCreatedWorkspace: No user ID provided.`);
            return {
                success: false,
                error: "No user ID provided."
            }
        }

        if(hasCheckedUserWorkspaceStatusRef.has(userIDToCheck)){
            console.log(`[useWorkspace] checkUserHaveCreatedWorkspace: Skipping checkUserHaveCreatedWorkspace
             for user ${userIDToCheck}, already checked.`);
            return {
                success: true,
                data: allWorkspaceIds.length > 0
            }
        }

        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));

        try {
            // console.log(`[useWorkspace] checkUserHaveCreatedWorkspace: Checking workspace existence for user ${userIDToCheck}.`);
            const response = await getUserWorkspaces(userIDToCheck);

            const hasWorkspaces = Array.isArray(response) && response.length > 0;

            console.log(`[useWorkspace] checkUserHaveCreatedWorkspace: Response for user ${userIDToCheck}:`, response);
            
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
        session?.user._id,
        status,
        // allWorkspaceIds.length,
        dispatch
    ])
      // --- EFFECT: Trigger initial fetch of all user workspaces ---
    useEffect(()=> {
        // const userId = session?.user._id
        const fetchWorkspaces = async () => {
           
            if(status !== "authenticated" || !session?.user?._id) return;
            const user = session.user._id as string;
            // if(hasCheckedUserWorkspaceStatusRef.current.has(user) || hasFetchedAllWorkspaceRef.current.has(user)){
            //     return;
            // }
             
            // Only call checkUserHaveCreatedWorkspace if not checked
            if(!hasCheckedUserWorkspaceStatusRef.has(user)){
                const checkResult = await checkUserHaveCreatedWorkspace(user);
                if(checkResult.success){
                    hasCheckedUserWorkspaceStatusRef.add(user);
                }
            }
            
            // Only call getWorkspace if not fetched
            if(!hasFetchedAllWorkspaceRef.has(user)){
                console.log(`[useWorkspace] useEffect: Attempting to fetch all workspaces for user ${user}.`);
                const fetchResult = await getWorkspaces();
                if(fetchResult.success){
                    hasFetchedAllWorkspaceRef.add(user);
                }
            }
            
        }
        fetchWorkspaces();
    },[ 
        session?.user._id, 
        status,
        //  getWorkspaces,
        //  checkUserHaveCreatedWorkspace
        ]);

     // --- Derived States ---
    const currentWorkspaceObject = useMemo(() => {
        return currentWorkspaceId ? workspacesById[currentWorkspaceId] : undefined;
    },[
        currentWorkspaceId,
        workspacesById
    ])
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
        currentWorkspace: currentWorkspaceObject,
        currentWorkspaceId: currentWorkspaceId, // Expose the ID if needed

        // Loading and error states from Redux
        isLoadingWorkspaces: loadingFromRedux || status === "loading", // Combine Redux loading with session loading
        workspaceError: errorFromRedux,

        // Functions to trigger actions
        getWorkspaces,
        createWorkspace,
        fetchCurrentWorkspace,
        currentWorkspaceDetails,
        updateWorkspaceTitle,
        updateWorkspaceLogo,
        checkUserHaveCreatedWorkspace,
        // deleteWorkspace,
    }
}
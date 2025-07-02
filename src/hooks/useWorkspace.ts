"use client";

import { WorkSpace as MongooseWorkSpace} from "@/model/workspace.model";
import { addWorkspace, getCurrentWorkspace, getUserWorkspaces, updateWorkspace } from "@/services/workspaceServices";
import { ADD_WORKSPACE, SET_CURRENT_WORKSPACE, SET_WORKSPACE_ERROR, SET_WORKSPACE_LOADING, SET_WORKSPACES, UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { RootState } from "@/store/store";
import { ReduxWorkSpace } from "@/types/state.type";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useWorkspace() {
    const { data: session, status } = useSession();
    const dispatch = useDispatch(); 

    // selector for workspace state
    const workspacesById = useSelector((state: RootState) => state.workspace.byId);
    const allWorkspaceIds = useSelector((state: RootState) => state.workspace.allIds);
    const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace);
    const loadingFromRedux = useSelector((state: RootState) => state.workspace.loading);
    const errorFromRedux = useSelector((state: RootState) => state.workspace.error);


    
    // function to fetch all user workspaces and dispatch to Redux
    const getWorkspaces = async() => {
        // only proceed if session  is authenticated and userId is available
        if(status !== "authenticated" || !session?.user?._id) return;
       
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));

        try {
            const response = await getUserWorkspaces(session.user._id);
            if(Array.isArray(response)){
                dispatch(SET_WORKSPACES(response))
                // setWorkspaces(response);
            }else if (response && typeof response === 'object') {
                dispatch(SET_WORKSPACES([response as MongooseWorkSpace]))
                // setWorkspaces([response]);
            }else {
                
               console.warn("getUserWorkspaces returned unexpected data:",response);
                dispatch(SET_WORKSPACES([]));
            }
            // setWorkspaces(workspaces);
        } catch (error: any) {
            console.error('Error while fetching user workspaces in hook:', error);
            dispatch(SET_WORKSPACE_ERROR(error.message || "Failed to fetch workspaces"));
        } finally {
            dispatch(SET_WORKSPACE_LOADING(false)); // Clear loading state in Redux
        }
    }

    // function to fetch current workspace
    const fetchCurrentWorkspace = async ( workspaceId: string ) => {
        if(!workspaceId) return;
        
        dispatch(SET_WORKSPACE_LOADING(true));
        dispatch(SET_WORKSPACE_ERROR(null));
        try {
            const workspace = await getCurrentWorkspace(workspaceId);
            dispatch(SET_CURRENT_WORKSPACE(workspace._id.toString()));
        } catch (error: any) {
            console.error('Error while fetching current workspace in hook:', error);
            dispatch(SET_WORKSPACE_ERROR(error.message || "Failed to fetch current workspace"));
            dispatch(SET_CURRENT_WORKSPACE(null));
        } finally{
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    }

    // function to create new workspace
    const createWorkspace = async ( formData: FormData ): Promise<{
         success: boolean; 
         data?: MongooseWorkSpace;
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
            dispatch(ADD_WORKSPACE(newWorkspace));
            dispatch(SET_CURRENT_WORKSPACE(newWorkspace._id.toString()));
            return {
                success: true,
                data: newWorkspace
            }
        } catch (error: any) {
            console.error('Error creating workspace in hook:', error);
            const errorMessage = error.message || "Failed to create workspace";
            dispatch(SET_WORKSPACE_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    }
    const currentWorkspaceDetails = async (workspaceId: string): Promise<{
        success: boolean;
        data?: MongooseWorkSpace;
        error?: string
    }> => {
        if(!workspaceId)
            return{
                success: false,
                error: "Workspace id required"
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
            dispatch(SET_CURRENT_WORKSPACE(workspace._id.toString()));
            return{
                success: true,
                data: workspace
            }
        } catch (error: any) {
            console.error('Error fetching current workspace in hook:', error);
            const errorMessage = error.message || "Failed to fetch current workspace";
            dispatch(SET_WORKSPACE_ERROR(errorMessage));
            return { success: false, error: errorMessage };
        }finally{
            dispatch(SET_WORKSPACE_LOADING(false));
        }
    }
    const updateWorkspaceTitle = useCallback(async (workspaceId: string, newTitle: string): Promise<{
        success: boolean;
        data?: MongooseWorkSpace;
        error?: string
    }> => {
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
             return {
                 success: true,
                 data: response.data
             }
        } catch (error: any) {
            console.error("Error while updating the workspace name ", error);
            const errorMessage = error.message || "Failed to update current workspace";
            return {
                success: false,
                error: errorMessage
            }
        }
    }, [dispatch]);

    const updateWorkspaceLogo = useCallback(async (workspaceId: string, logo: File) => {

    }, [])
      // --- EFFECT: Trigger initial fetch of all user workspaces ---
    useEffect(()=> {
        if(status === "authenticated" && session?.user?._id && allWorkspaceIds.length === 0){
            getWorkspaces();
        } 
    },[ session, status, allWorkspaceIds.length]);

     // --- Derived States ---
    const currentWorkspaceObject = currentWorkspaceId ? workspacesById[currentWorkspaceId] : undefined;
    const allWorkspacesArray = allWorkspaceIds.map( id => workspacesById[id]);

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
        updateWorkspaceLogo
    }
}
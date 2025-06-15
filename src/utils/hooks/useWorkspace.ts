"use client";

import { WorkSpace } from "@/model/workspace.model";
import { getCurrentWorkspace, getUserWorkspaces } from "@/services/workspaceServices";
import { SET_CURRENT_WORKSPACES, SET_WORKSPACES } from "@/store/slices/workspaceSlice";
import { useSession } from "next-auth/react";
import { useState } from "react";

export function useWorkspace() {
    const { data: session, status } = useSession();
    // const [ workspaces, setWorkspaces ] = useState<WorkSpace[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState<null | string>(null);

    const getWorkspaces = async() => {
        if(status !== "authenticated" || !session?.user?._id) return;
        setLoading(true);
        setError(null);
        try {
            const response = await getUserWorkspaces(session.user._id);
            if(Array.isArray(response)){
                SET_WORKSPACES(response)
                // setWorkspaces(response);
            }else if (response && typeof response === 'object') {
                SET_WORKSPACES([response])
                // setWorkspaces([response]);
            }else {
                // setWorkspaces([])
                console.log("Failed to set workspaces")
            }
            // setWorkspaces(workspaces);
        } catch (error: any) {
            setError(error.message || "Failed to fetch the workspace");
            console.log('Error while fetching user workspaces ',error)
        } finally{
            setLoading(false);
        }
    }

    const currentWorkspace = async ( workspaceId: string ) => {
        if(!workspaceId) return;
        let isMounted = true;
        setLoading(true);
        setError(null);
        try {
            const response = await getCurrentWorkspace(workspaceId);
            if(isMounted){
                SET_CURRENT_WORKSPACES(response);
            }else{
               console.log("Failed to set current workspace") ;
               setError("Failed to set current workspace")
            }
        } catch (error: any) {
            setError(error.message || "Failed to fetch the current workspace");
            console.log('Error while fetching user current workspaces ',error)
        }
    }

    return {
        getWorkspaces,
        currentWorkspace,
        loading,
        error,
    }
}
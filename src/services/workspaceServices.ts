/**
 * @module WorkspaceServices
 * @description specialized API service layer for Workspace entity management. 
 * Handles organizational hierarchy, metadata updates, and binary asset persistence.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Binary Asset Handling: Implements `FormData` patterns for `updateLogo`, 
 * ensuring seamless multipart/form-data transmission to the backend.
 * 2. Strict Return Types: Uses `Promise<WorkSpace>` and `Promise<Folder[]>` to ensure 
 * downstream hooks receive predictable, strongly-typed data.
 * 3. Error Normalization: Standardizes catch blocks to extract error messages 
 * from Axios responses, providing clear feedback to the UI via the `useWorkspace` hook.
 * 4. Resource Hierarchy: Orchestrates the retrieval of nested entities (Folders) 
 * scoped specifically to a Workspace ID.
 */
import { LearningPathFileNode } from "@/components/dashboard-shared/learning-path-view";
import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import { ReduxWorkSpace } from "@/types/state.type";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

/**
 * @method addWorkspace
 * @description Persists a new workspace entity. Accepts FormData to handle 
 * potential initial logo/banner uploads during creation.
 */
export async function addWorkspace(newWorkspace:FormData){
    const relativePath = `/api/workspace`
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.post(url, newWorkspace);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method getUserWorkspaces
 * @description Bulk retrieval of all workspaces owned by or shared with a specific user.
 */
export async function getUserWorkspaces(userId:string):Promise<WorkSpace[]>{
    const relativePath = `/api/workspace?userId=${userId}`;
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method getCurrentWorkspace
 * @description Fetches the full metadata for a single workspace.
 * * Implementation Note: Uses a RESTful ID-based route. The console log is 
 * strategically placed to trace the ID flow from the Redux selector through 
 * the service layer, ensuring the 'current' context is synchronized.
 */
export async function getCurrentWorkspace(workspaceId:string): Promise<WorkSpace>{
    const relativePath = `/api/workspace/${workspaceId}`;
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method getAllFolders
 * @description Retrieves all folders belonging to a specific workspace.
 * * Logic: This is the primary "Branch" fetcher. It allows the UI to populate 
 * the sidebar and dashboard tree for a specific workspace context.
 */
export async function getAllFolders(workspaceId:string):Promise<Folder[]> {
    const relativePath = `/api/folder?workspaceId=${workspaceId}`;
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method updateWorkspace
 * @description Performs a partial update on workspace metadata (primarily the Title).
 * * Strategy: Instead of throwing a generic error, this method catches exceptions 
 * and returns a standardized result object. This allows the calling hook to 
 * display a specific 'toast' message to the user rather than a generic crash.
 */
export async function updateWorkspace(newTitle: string, workspaceId:string): Promise<{
    success: boolean;
    data?: WorkSpace;
    message?: string;
}> {
    const updatedData: Partial<WorkSpace> = {
        _id: workspaceId,
        title: newTitle,
    }
    try {
        const relativePath = `/api/workspace/${workspaceId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } =  await axios.post(url, updatedData);
        if(!data.success) {
                return { success: false, message: data.message || "Failed to update workspace title." };
            }
        return { success: true, data: data.data };
    } catch (error: any) {
         console.error("Service error updating workspace:", error);
        return { 
            success: false,
             message: error.response?.data?.message || error.message || "An unexpected error occurred." 
        };
    }
}

/**
 * @method updateLogo
 * @description Specialized binary upload utility. Configures the 'Content-Type' 
 * header explicitly for multipart handling of workspace branding assets.
 */
export async function updateLogo(
   workspaceId: string,
   logoFile: File
): Promise<{
    success: boolean;
    data?: WorkSpace;
    message?: string;
}> {
    const formData = new FormData();
    formData.append("_id", workspaceId);
    formData.append("newLogo", logoFile);
    
   try {
    const relativePath = `/api/workspace/${workspaceId}/logo`;
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
     });
     if(!data.success){
        return {
            success: false,
            message: data.message || "Failed to update workspace logo."
        }
     }
     return {
        success: true,
        data: data.data,
     }
   } catch (error: any) {
        console.error('Service error uploading logo:', error);
        return {
            success: false,
            message: error.response?.data?.message || error.message || "An unexpected error occurred."
        };
   }
}

export async function fetchWorkspaceTermIndex(
    workspaceId: string,
    signal: any,
): Promise<{
    success: boolean;
    data?: any;
    message?: string;
}>{
    try {
        const relativePath = `/api/workspace/${workspaceId}/term-index`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.get(url, signal);
         if(!data.success){
            return {
                success: false,
                message: data.message || "Failed to fetch workspace term index."
            }
        }
        return {
            success: true,
            data: data.data,
        }
    } catch (error: any) {
        console.error('Service error in fetching workspace term index:', error);
        return {
            success: false,
            message: error.response?.data?.message || error.message || "An unexpected error occurred."
        };
    }
}

export async function workspaceConceptGraphService(workspaceId: string): Promise<{
    success: boolean;
    data?: ReduxWorkSpace;
    message?: string;
    statusCode?: number;
}>{
    try {
        const relativePath = `/api/workspace/${workspaceId}/concept-graph`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.post(url);
        if(!data.success) return {
            success: false,
            message: data.message,
            statusCode: data.statusCode,
        }
        return {
            success: true,
            data: data.data as ReduxWorkSpace,
        }
    } catch (error: any) {
        console.error("[Workspace Service] workspaceConceptGraphService failed: ",error.message);
        return {
            success: false,
            message: error.response?.data?.message || error.message || "An unexpected error occurred."
        };
    }
}

export async function workspaceLearningPathService(
    workspaceId: string
): Promise<{
    success: boolean;
    learningPath?: LearningPathFileNode[];
    message?: string;
    statusCode?: number;
} | undefined >{
    try {
        const relativePath = `/api/workspace/${workspaceId}/learning-path`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.get(url);
        if(!data.success) return {
            success: false,
            message: data.message,
            statusCode: data.statusCode,
        }
        return {
            success: true,
            learningPath: data.data.learningPath as LearningPathFileNode[],
            statusCode: data.statusCode,
        };
    } catch (error: any) {
        console.error("[Workspace Service] workspaceLearningPath failed: ",error.message);
        return {
            success: false,
            message: error.response?.data?.message || error.message || "An unexpected error occurred."
        };
    }
}
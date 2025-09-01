import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import axios from "axios";


// add workspace

export async function addWorkspace(newWorkspace:FormData){
    const { data } = await axios.post(`/api/create-new-workspace`, newWorkspace);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// users all workspaces
export async function getUserWorkspaces(userId:string):Promise<WorkSpace[]>{
    const { data } = await axios.get(`/api/check-user-have-created-workspace?userId=${userId}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}


// get current workspace

export async function getCurrentWorkspace(workspaceId:string): Promise<WorkSpace>{
    const { data } = await axios.get(`/api/get-current-workspace?workspaceId=${workspaceId}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// get all folders of workspace

export async function getAllFolders(workspaceId:string):Promise<Folder[]> {
    const { data } = await axios.get(`/api/get-all-workspace-folders?workspaceId=${workspaceId}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// update workspace

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
        const { data } =  await axios.post(`/api/update-workspace`, updatedData);
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

// logo

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
     const { data } = await axios.post(`/api/update-workspace-logo`, formData, {
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


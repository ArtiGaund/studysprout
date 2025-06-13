import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import axios from "axios";


// add workspace

export async function addWorkspace(newWorkspace:WorkSpace){
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

export async function updateWorkspace(newTitle: string, workspaceId:string) {
    const updatedData: Partial<WorkSpace> = {
        _id: workspaceId,
        title: newTitle,
    }
    const { data } =  await axios.post(`/api/update-workspace`, updateWorkspace);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// logo

export async function updateLogo(
   newData: Partial<WorkSpace>
) {
    const { data } = await axios.post(`/api/update-workspace-logo`, newData);
    if(!data.success) throw new Error(data.message);
    return data.data;
}
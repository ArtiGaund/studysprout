import { File } from "@/model/file.model";
import axios from "axios";


export async function addFile(newFile:File) {
    const { data } = await axios.post(`/api/create-file`,newFile);
    if(!data.success) throw new Error(data.message);
    return data.data.file;
}

export async function getCurrentFile(fileId:string){
    const { data } = await axios.get(`/api/get-current-file?fileId=${fileId}`);
    console.log(`[getCurrentFile] data: ${JSON.stringify(data)}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// get all files by workspace id
export async function getAllFilesByWorkspaceId(workspaceId: string){
    const { data } = await axios.get(`/api/get-workspace-all-files?workspaceId=${workspaceId}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}
import { File } from "@/model/file.model";
import axios from "axios";


const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
export async function addFile(payload:Partial<File>) {
   try {
    const relativePath = `/api/create-file`;
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.post(url,payload);
    if(!data.success) throw new Error(data.message);
    return data.data.file;
   } catch (error) {
    console.warn("[FileServices] Failed to add file due to following error: ",error);
   }
}

export async function getCurrentFile(fileId:string){
    try {
        const relativePath = `/api/get-current-file?fileId=${fileId}`
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to get current file due to following error: ",error);
    }
}

// get all files by workspace id
export async function getAllFilesByWorkspaceId(workspaceId: string){
    try {
        const relativePath = `/api/get-workspace-all-files?workspaceId=${workspaceId}`
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to get current file due to following error: ",error);
    }
}
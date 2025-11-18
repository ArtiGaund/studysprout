import { Folder } from "@/model/folder.model";
import axios from "axios"


const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
export async function getCurrentFolder(folderId:string) {
   try {
    const relativePath = `/api/get-current-folder?folderId=${folderId}`
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
   } catch (error) {
    console.warn("[FolderServices] Failed to get current folder due to following error: ",error);
   }
}

// get all files in a folder
export async function getAllFiles(folderId:string) {
   try {
    const relativePath = `/api/get-all-folder-files?folderId=${folderId}`;
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
   } catch (error) {
    console.warn("[FolderServices] Failed to get current folder due to following error: ",error);
   }
}

export async function addFolder(workspaceId: string) {
   try {
    const relativePath = '/api/create-folder';
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.post(url,{ workspaceId});
    if(!data.success) throw new Error(data.message);
    return data.data;
   } catch (error) {
    console.warn("[FolderServices] Failed to add folder due to following error: ",error);
   }
}

// export async function updateFolder(updateData:Partial<Folder>) {
//     const { data } = await axios.post('/api/update-folder', updateData);
//     if(!data.success) throw new Error(data.message);
//     return data.data;
// }
 

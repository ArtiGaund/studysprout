import { Folder } from "@/model/folder.model";
import axios from "axios"



export async function getCurrentFolder(folderId:string) {
    const { data } = await axios.get(`/api/get-current-folder?folderId=${folderId}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// get all files in a folder
export async function getAllFiles(folderId:string) {
    const { data } = await axios.get(`/api/get-all-folder-files?folderId=${folderId}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

export async function addFolder(newFolder:Folder) {
    const { data } = await axios.post('/api/create-folder', newFolder);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// export async function updateFolder(updateData:Partial<Folder>) {
//     const { data } = await axios.post('/api/update-folder', updateData);
//     if(!data.success) throw new Error(data.message);
//     return data.data;
// }
 

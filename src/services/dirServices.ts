import { File } from "@/model/file.model";
import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import axios from "axios";

type DirType = "workspace" | "folder" | "file";



export async function restoreDir(
    dirType: DirType,
    dirId: string,
) {
    const body  = {
        _id: dirId,
        inTrash: "",
    }
    const { data } = await axios.post(`/api/update-${dirType}`,body);
    if(!data.success) throw new Error(data.message);
    return data.data
}


export async function hardDeleteDir(
    dirType: DirType,
    dirId: string,
) {
    const { data } =  await axios.delete(`/api/delete-${dirType}?${dirType}=${dirId}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// Banners

export async function getBanner(bannerUrl:string){
    const { data } = await axios.get(`/api/get-image?imageId=${bannerUrl}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}
export async function deleteBanner(
    dirType: DirType,
    dirId: string,
) {
    const { data } = await axios.delete(`/api/delete-${dirType}-banner?${dirType}=${dirId}`);
    if(!data.success) throw new Error(data.message);
    return data.data;
}


export async function uploadBanner(
    dirType: DirType,
    body: any
) {
    const { data } = await axios.post(`/api/${dirType}-upload-banner`,body);
    if(!data.success) throw new Error(data.message);
    return data.data;    
}
// icon

export async function updateDirIcon(
    dirType: DirType,
    dirId: string,
    icon: string,
    // payload: Partial<WorkSpace | Folder | File>
) {
    const updatedData: Partial<WorkSpace | Folder | File> = {
        _id: dirId,
        // ...payload, 
        iconId: icon,
    }
    const { data } = await axios.post(`/api/update-${dirType}`,updatedData);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// update

export async function updateDir(
    dirType: DirType,
    dirId: string,
    payload: Partial<WorkSpace | Folder | File>
) {
    const updatedData: Partial<WorkSpace | Folder | File> = {
        _id: dirId,
        ...payload, 
    }
    const { data } = await axios.post(`/api/update-${dirType}`,updatedData);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

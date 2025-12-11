import { File } from "@/model/file.model";
import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import axios from "axios";

type DirType = "workspace" | "folder" | "file";


const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
export async function restoreDir(
    dirType: DirType,
    dirId: string,
) {
    const body  = {
        _id: dirId,
        inTrash: "",
    }
    const relativePath = `/api/update-${dirType}`;
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.post(url,body);
    if(!data.success) throw new Error(data.message);
    return data.data
}


export async function hardDeleteDir(
    dirType: DirType,
    dirId: string,
) {
   const relativePath = `/api/delete-${dirType}?${dirType}Id=${dirId}`;
   const url = `${BASE_URL}${relativePath}`
    const { data } =  await axios.delete(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

// Banners

export async function getBanner(bannerUrl:string){
    const relativePath = `/api/get-image?imageId=${bannerUrl}`;
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}
export async function deleteBanner(
    dirType: DirType,
    dirId: string,
) {
    const relativePath = `/api/delete-${dirType}-banner?${dirType}Id=${dirId}`;
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.delete(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}


export async function uploadBanner(
    dirType: DirType,
    body: any
) {
    const relativePath = `/api/${dirType}-upload-banner`;
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.post(url,body);
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
    const relativePath = `/api/update-${dirType}`;
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.post(url,updatedData);
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
    const relativePath = `/api/update-${dirType}`;
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.post(url,updatedData);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

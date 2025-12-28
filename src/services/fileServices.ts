import { File, IBlock } from "@/model/file.model";
import { UIBlock } from "@/utils/block/normalizeBlock";
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

// Block services
export async function addBlock(
    fileId: string,
     block: UIBlock, 
     afterBlockId?: string | null
){
    try {
        // console.log("[fileService] addBlock block: ",block);
        const relativePath = `/api/files/${fileId}/blocks`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.post(url, {
           block: {
            id: block.id,
            type: block.type,
            props: block.props ?? {},
            content: block.content
           },
           afterBlockId
        });
        // console.log("[fileServices] addBlock data: ",data);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to add block due to following error: ",error);

    }
}

export async function updateBlock(fileId: string, blockId: string, updates: Partial<UIBlock>){
    try {
        // console.log("[fileServices] updateBlock blockId: ",blockId);
        const relativePath = `/api/files/${fileId}/blocks/${blockId}`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.patch(url, updates);
        // console.log("[fileServices] updateBlock data: ",data);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to update block due to following error: ",error);
    }
}

export async function deleteBlock(fileId: string, blockId: string){
    try {
        const relativePath = `/api/files/${fileId}/blocks/${blockId}`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.delete(url);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to delete block due to following error: ",error);
    }
}
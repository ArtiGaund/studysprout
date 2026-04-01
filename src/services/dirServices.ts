/**
 * @module DirectoryService
 * @description Centralized API service for managing shared directory operations 
 * (Workspaces, Folders, and Files). 
 * * KEY ARCHITECTURAL PATTERNS:
 * 1. Polymorphic Routing: Uses 'dirType' to dynamically construct API endpoints, 
 * reducing the need for separate service files.
 * 2. Resource Lifecycle Management: Handles "Soft Recovery" (restoring from trash) 
 * and "Hard Deletion" (permanent removal).
 * 3. Asset Management: Orchestrates banner and icon updates across the entire hierarchy.
 * 4. Environment-Driven Configuration: Leverages `BASE_URL` from environment variables 
 * for seamless staging/production transitions.
 */

import { File } from "@/model/file.model";
import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import axios from "axios";

type DirType = "workspace" | "folder" | "file";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

/**
 * @method restoreDir
 * @description Recovers a deleted item by clearing the 'inTrash' timestamp.
 * Demonstrates a safe update pattern using Partial types.
 */
export async function restoreDir(
    dirType: DirType,
    dirId: string,
) {
    const updatedData: Partial<WorkSpace | Folder | File> = {
        _id: dirId,
        inTrash: null,
    }
    let relativePath = ``;
    if(dirType === "workspace"){
        relativePath = `/api/workspace/${dirId}`;
    }else if(dirType === "folder"){
        relativePath = `/api/folder/${dirId}`; 
    }else if(dirType === "file"){
        relativePath = `/api/file/${dirId}`;
    }
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.post(url,updatedData);
    if(!data.success) throw new Error(data.message);
    return data.data
}

/**
 * @method hardDeleteDir
 * @description Permanently removes a resource from the database.
 */
export async function hardDeleteDir(
    dirType: DirType,
    dirId: string,
) {
    let relativePath = ``;
        if(dirType === "workspace"){
            relativePath = `/api/workspace/${dirId}`;
        }else if(dirType === "folder"){
            relativePath = `/api/folder/${dirId}`; 
        }else if(dirType === "file"){
            relativePath = `/api/file/${dirId}`;
        }
   const url = `${BASE_URL}${relativePath}`
    const { data } =  await axios.delete(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method getBanner
 * @description Retrieves metadata or a signed URL for a specific banner image.
 * Uses a query parameter pattern to fetch assets by their unique imageId.
 */
export async function getBanner(bannerUrl:string){
    const relativePath = `/api/get-image?imageId=${bannerUrl}`;
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method deleteBanner
 * @description Removes a banner association from a specific directory entity.
 * Uses a RESTful nested route pattern (e.g., /api/banner/file/[id]) 
 * to target the correct asset store.
 */
export async function deleteBanner(
    dirType: DirType,
    dirId: string,
) {
    let relativePath = ``;
    if(dirType === "workspace"){
        relativePath = `/api/banner/workspace/${dirId}`;
    }else if(dirType === "folder"){
        relativePath = `/api/banner/folder/${dirId}`; 
    }else if(dirType === "file"){
        relativePath = `/api/banner/file/${dirId}`;
    }
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.delete(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method uploadBanner
 * @description Handles multipart/form-data or JSON payloads for asset updates.
 */
export async function uploadBanner(
    dirType: DirType,
    dirId: string,
    body: any
) {
    let relativePath = ``;
    if(dirType === "workspace"){
        relativePath = `/api/banner/workspace/${dirId}`;
    }else if(dirType === "folder"){
        relativePath = `/api/banner/folder/${dirId}`; 
    }else if(dirType === "file"){
        relativePath = `/api/banner/file/${dirId}`;
    }
    const url = `${BASE_URL}${relativePath}`;
    const { data } = await axios.post(url,body);
    if(!data.success) throw new Error(data.message);
    return data.data;    
}

/**
 * @method updateDirIcon
 * @description Updates the emoji or icon ID for a workspace, folder, or file.
 * This is a specialized wrapper around the standard update logic, 
 * ensuring the 'iconId' field is prioritized.
 */
export async function updateDirIcon(
    dirType: DirType,
    dirId: string,
    icon: string,
) {
    const updatedData: Partial<WorkSpace | Folder | File> = {
        _id: dirId,
        iconId: icon,
    }
   
    let relativePath = ``;
    if(dirType === "workspace"){
        relativePath = `/api/workspace/${dirId}`;
    }else if(dirType === "folder"){
        relativePath = `/api/folder/${dirId}`; 
    }else if(dirType === "file"){
        relativePath = `/api/file/${dirId}`;
    }
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.post(url,updatedData);
    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @method updateDir
 * @description Generic update utility used for renaming, re-parenting, or 
 * changing metadata across all directory entities.
 */
export async function updateDir(
    dirType: DirType,
    dirId: string,
    payload: Partial<WorkSpace | Folder | File>
) {
    const updatedData: Partial<WorkSpace | Folder | File> = {
        _id: dirId,
        ...payload, 
    }
  
    if(!dirId){
        console.error("[UpdateDir Service] dirId is required");
        return;
    }
    let relativePath = ``;
    if(dirType === "workspace"){
        relativePath = `/api/workspace/${dirId}`;
    }else if(dirType === "folder"){
        relativePath = `/api/folder/${dirId}`; 
    }else if(dirType === "file"){
        relativePath = `/api/file/${dirId}`;
    }
    const url = `${BASE_URL}${relativePath}`
    const { data } = await axios.post(url,updatedData);

    if(!data.success) throw new Error(data.message);
    return data.data;
}

/**
 * @module FileServices
 * @description specialized API layer for managing individual File entities and 
 * their constituent Block data.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Nested RESTful Routes: Implements a clean `/api/file/[id]/blocks/[id]` pattern 
 * for targeted updates, improving backend performance and cacheability.
 * 2. Block-Level Granularity: Supports atomic CRUD operations on individual blocks, 
 * essential for high-performance, collaborative text editing.
 * 3. Traceability: Maintains a strict link between UI blocks and the persistent 
 * storage layer using unique IDs.
 * 4. Resilient Error Handling: Uses `console.warn` for non-blocking UI failures 
 * while throwing errors for critical data-loss scenarios.
 */
import { File, IBlock } from "@/model/file.model";
import { UIBlock } from "@/utils/block/normalizeBlock";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

/**
 * @method addFile
 * @description Persists a new file record associated with a specific Folder.
 */
export async function addFile(payload:Partial<File>) {
   try {
    const folderId = payload.folderId;
    const relativePath = `/api/file?folderId=${folderId}`;
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.post(url,payload);
    if(!data.success) throw new Error(data.message);
    return data.data.file;
   } catch (error) {
    console.warn("[FileServices] Failed to add file due to following error: ",error);
   }
}

/**
 * @method getCurrentFile
 * @description Fetches the full document model for a specific file. 
 * This is a "Heavy Fetch" that retrieves all blocks and potential binary content 
 * (contentBinary) to hydrate the editor state.
 */
export async function getCurrentFile(fileId:string){
    try {
        const relativePath = `/api/file/${fileId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to get current file due to following error: ",error);
    }
}

/**
 * @method getAllFilesByWorkspaceId
 * @description Retrieves a flattened list of all files across all folders in a workspace.
 * Used primarily for global search, workspace-wide flashcard generation, 
 * or populating the sidebar navigation tree.
 */
export async function getAllFilesByWorkspaceId(workspaceId: string){
    try {
        const relativePath = `/api/file?workspaceId=${workspaceId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to get current file due to following error: ",error);
    }
}

/**
 * @method addBlock
 * @description Appends a new UI component (text, image, etc.) to a file's content.
 * Supports positional insertion via 'afterBlockId' for accurate document flow.
 */
export async function addBlock(
    fileId: string,
     block: UIBlock, 
     afterBlockId?: string | null
){
    try {
        const relativePath = `/api/file/${fileId}/blocks`;
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
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to add block due to following error: ",error);

    }
}

/**
 * @method updateBlock
 * @description Performs a PATCH update on a single block. 
 * This is crucial for collaborative editing to avoid overwriting the entire document.
 */
export async function updateBlock(fileId: string, blockId: string, updates: Partial<UIBlock>){
    try {
        const relativePath = `/api/file/${fileId}/blocks/${blockId}`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.patch(url, updates);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to update block due to following error: ",error);
    }
}

/**
 * @method deleteBlock
 * @description Safely removes a block from the database and updates the file's blockOrder.
 */
export async function deleteBlock(fileId: string, blockId: string){
    try {
        const relativePath = `/api/file/${fileId}/blocks/${blockId}`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.delete(url);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FileServices] Failed to delete block due to following error: ",error);
    }
}

export async function detectFilePrerequisitesService(fileId: string){
    try {
        const relativePath = `/api/file/${fileId}/prerequisites`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.post(url);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
         console.warn("[FileServices] Failed to detect file prerequisites due to following error: ",error);
    }
}
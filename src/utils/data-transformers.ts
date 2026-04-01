/**
 * @module DataTransformers
 * @description specialized utility for synchronizing Backend (Mongoose) models with Frontend (Redux) state.
 * * CORE RESPONSIBILITIES:
 * 1. Serialization: Converts non-serializable types like `ObjectId` and `Date` into standard strings.
 * 2. Default State Enforcement: Guarantees fallback values (e.g., 'Untitled', default icons) 
 * so the UI components don't have to handle null-checks for every property.
 * 3. Data Normalization: Flattens complex MongoDB Maps into plain JavaScript Objects 
 * for Redux Toolkit compatibility.
 * 4. Error Resilience: Implements defensive parsing for JSON fields and block data.
 */
import { Types } from "mongoose";
import { WorkSpace } from "@/model/workspace.model";
import { Folder } from "@/model/folder.model";
import { File, IBlock } from "@/model/file.model";
import { 
    ReduxWorkSpace,
    ReduxFolder,
    ReduxFile
 } from "@/types/state.type";

/**
 * @helper toStr
 * Standardizes the conversion of MongoDB IDs and Dates to strings.
 * This prevents the "SerializableStateInvariantMiddleware" errors in Redux.
 */
const toStr = (value : any): string | undefined => {
    if(value === undefined || value === null) return undefined;
    if(typeof value === 'string') return value;
    if(value instanceof Types.ObjectId) return value.toString();
    if(value instanceof Date) return value.toISOString();
    return String(value); // Fallback for other types, though not ideal for complex objects
}

/**
 * @method transformWorkspace
 * Maps a Workspace document to a Redux-friendly plain object.
 * Standardizes the 'members' and 'folders' arrays into flat string/object arrays.
 */
export const transformWorkspace = (workspace: WorkSpace): ReduxWorkSpace => {
    return{
        _id: toStr(workspace._id) as string,
        workspace_owner: toStr(workspace.workspace_owner) as string,
        title: workspace.title || 'Untitled Workspace',
        iconId: workspace.iconId || '📄',
        data: workspace.data || '',
        inTrash: workspace.inTrash === null ? undefined : workspace.inTrash,
        logo: toStr(workspace.logo) as string,
        bannerUrl: workspace.bannerUrl || '',
        folders: (workspace.folders || []).map(id => toStr(id) as string),
        isPublic: workspace.isPublic ?? false,
        members: (workspace.members ?? []).map(m => ({
        userId: toStr(m.userId) as string,
        role: m.role,
        })),
    }
}

/**
 * @method transformFile
 * Transforms the File document, with specific focus on the Block-based content.
 * Normalizes the 'blocks' Map into an Object entry for Redux.
 */
export const transformFolder = (folder: Folder): ReduxFolder => {
    if(!folder){
        throw new Error("transformFolder: received undefined or null folder object");
    }
    return{
        _id: toStr(folder._id) as string,
        createdAt: toStr(folder.createdAt) as string,
        title: folder.title || 'Untitled',
        iconId: folder.iconId || '📁',
        data: folder.data || '',
        inTrash: folder.inTrash || undefined,
        bannerUrl: folder.bannerUrl || undefined,
        workspaceId: toStr(folder.workspaceId) as string,
        files: (folder.files || []).map(id => toStr(id) as string),
    }
}

/**
 * @helper parseDataSafety
 * @description A defensive JSON parsing utility. 
 * Used for "Data" fields or legacy stringified content to ensure that 
 * malformed strings don't crash the Redux hydration process.
 * * Why this is Recruit-Ready:
 * - Includes a try/catch block for runtime safety.
 * - Enforces an 'Array' return type, providing "Referential Stability" 
 * for components using .map().
 */
const parseDataSafety = (dataString: string | undefined): any[] => {
    if(!dataString) return [];
    try {
        const parsed = JSON.parse(dataString);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Error parsing JSON data field during transformation: ",error);
        return [];
    }
}

/**
 * @method transformFile
 * @description Standardizes the File entity for the Redux store. 
 * This is the most complex transformation in StudySprout as it handles 
 * the Block-based content dictionary and binary synchronization.
 * * Key Transformation Tasks:
 * - Block Normalization: Converts Mongoose Maps to serializable Plain Objects.
 * - Timestamp Serialization: Ensures `contentLastModified` and `lastUpdated` 
 * are ISO strings for easy comparison in the UI.
 * - Order Persistence: Guarantees `blockOrder` is always an array to prevent 
 * iterator errors in the Editor component.
 */
export const transformFile = (file: File): ReduxFile => {
    return{
        _id: toStr(file._id) as string,
        title: file.title || 'Untitled',
        iconId: file.iconId || '📄',
       
        blocks: convertBlockMap(file.blocks),
        blockOrder: Array.isArray(file.blockOrder) ? file.blockOrder : [],

        contentBinary: file.contentBinary ?? null,
        contentLastModified: (file.contentLastModified 
        ? toStr(file.contentLastModified)
        : new Date().toISOString()) ?? new Date().toISOString(),

         createdAt: toStr(file.createdAt) as string,
          lastUpdated: toStr(file.lastUpdated) as string,
           workspaceId: toStr(file.workspaceId) as string,
        folderId: toStr(file.folderId) as string,
         inTrash: file.inTrash ?? undefined,
        bannerUrl: file.bannerUrl ?? undefined,
       deletedAt: file.deletedAt?.toString(),
       
    }
}

/**
 * @helper convertBlockMap
 * Converts Mongoose Maps to Plain Objects.
 * Since Redux cannot store Map objects, this ensures the block-based content 
 * is accessible via standard key-value lookups in the UI.
 */
function convertBlockMap(
    blocks: Map<string, IBlock> | any
): Record<string, IBlock>{
    if(!blocks) return {};
    if(blocks instanceof Map){
        return Object.fromEntries(blocks);
    }
    return blocks;
}
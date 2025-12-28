import { Types } from "mongoose";
import { WorkSpace } from "@/model/workspace.model";
import { Folder } from "@/model/folder.model";
import { File, IBlock } from "@/model/file.model";
import { 
    ReduxWorkSpace,
    ReduxFolder,
    ReduxFile
 } from "@/types/state.type";

//  Helper to safely convert to string (for objectId and Date)
const toStr = (value : any): string | undefined => {
    if(value === undefined || value === null) return undefined;
    if(typeof value === 'string') return value;
    if(value instanceof Types.ObjectId) return value.toString();
    if(value instanceof Date) return value.toISOString();
    return String(value); // Fallback for other types, though not ideal for complex objects
}

export const transformWorkspace = (workspace: WorkSpace): ReduxWorkSpace => {
    return{
        _id: toStr(workspace._id) as string,
        workspace_owner: toStr(workspace.workspace_owner) as string,
        title: workspace.title || 'Untitled Workspace',
        iconId: workspace.iconId || '📄',
        data: workspace.data || '',
        inTrash: workspace.inTrash || undefined,
        logo: toStr(workspace.logo) as string,
        bannerUrl: workspace.bannerUrl || '',
        folders: (workspace.folders || []).map(id => toStr(id) as string),
    }
}

export const transformFolder = (folder: Folder): ReduxFolder => {
    return{
        _id: toStr(folder._id) as string,
        createdAt: toStr(folder.createdAt) as string,
        title: folder.title || 'Untitled Folder',
        iconId: folder.iconId || '📁',
        data: folder.data || '',
        inTrash: folder.inTrash || undefined,
        bannerUrl: folder.bannerUrl || undefined,
        workspaceId: toStr(folder.workspaceId) as string,
        files: (folder.files || []).map(id => toStr(id) as string),
    }
}

// Helper function to safety parse JSON and return an array
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
export const transformFile = (file: File): ReduxFile => {
    return{
        _id: toStr(file._id) as string,
        title: file.title || 'Untitled File',
        iconId: file.iconId || '📄',
       
        blocks: convertBlockMap(file.blocks),
        blockOrder: Array.isArray(file.blockOrder) ? file.blockOrder : [],

         createdAt: toStr(file.createdAt) as string,
          lastUpdated: toStr(file.lastUpdated) as string,
           workspaceId: toStr(file.workspaceId) as string,
        folderId: toStr(file.folderId) as string,
         inTrash: file.inTrash ?? undefined,
        bannerUrl: file.bannerUrl ?? undefined,

        // version + sync fields
        version: file.version ?? 1,
        contentHash: file.contentHash ?? "",
        localChangeId: file.localChangeId,
        lastLocalChangeId: file.lastLocalChangeId ?? 0,
        lastSyncedAt: file.lastSyncedAt?.toString(),
       updatedAtLocal: file.updatedAtLocal?.toString(),
       conflictState: file.conflictState,
    //    isLocked?: file.isLocked,
       deletedAt: file.deletedAt?.toString(),

    //    history: file.history  || [],       
       
    }
}

function convertBlockMap(
    blocks: Map<string, IBlock> | any
): Record<string, IBlock>{
    if(!blocks) return {};
    if(blocks instanceof Map){
        return Object.fromEntries(blocks);
    }
    return blocks;
}
/**
 * @module FolderServices
 * @description specialized API layer for managing Folder entities and 
 * retrieving nested child resources (Files).
 * * * KEY ARCHITECTURAL FEATURES:
 * 1. Relationship-Based Retrieval: Implements `getAllFiles` using query parameters 
 * to fetch children belonging to a specific parent folder ID.
 * 2. Scope-Bound Creation: The `addFolder` method strictly requires a `workspaceId`, 
 * enforcing data integrity within the workspace hierarchy.
 * 3. Unified API Pattern: Follows a consistent RESTful pattern used across the 
 * StudySprout service layer, facilitating easier debugging and maintenance.
 * 4. Observability: Includes strategic logging (e.g., `console.log`) to monitor 
 * folder-to-file data flow during development.
 */
import { ConceptGraph } from "@/types/state.type";
import axios from "axios"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

/**
 * @method getCurrentFolder
 * @description Retrieves metadata for a specific folder. 
 * Used primarily for breadcrumb generation and header synchronization.
 */
export async function getCurrentFolder(folderId:string) {
   try {
   const relativePath = `/api/folder/${folderId}`;
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
   } catch (error) {
    console.warn("[FolderServices] Failed to get current folder due to following error: ",error);
   }
}

/**
 * @method getAllFiles
 * @description Fetches all file entities nested within a specific folder.
 * This is a critical method for populating the sidebar and dashboard file lists.
 */
export async function getAllFiles(folderId:string) {
   try {
   const relativePath = `/api/file?folderId=${folderId}`;
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.get(url);
    if(!data.success) throw new Error(data.message);
    return data.data;
   } catch (error) {
    console.warn("[FolderServices] Failed to get current folder due to following error: ",error);
   }
}

/**
 * @method addFolder
 * @description Creates a new folder record bound to the provided Workspace.
 * Demonstrates a standard POST pattern with workspace context.
 */
export async function addFolder(workspaceId: string) {
   try {
   const relativePath = `/api/folder?workspaceId=${workspaceId}`;
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.post(url,{ workspaceId});
    if(!data.success) throw new Error(data.message);
    return data.data;
   } catch (error) {
    console.warn("[FolderServices] Failed to add folder due to following error: ",error);
   }
}


export async function conceptGraphService(folderId: string){
   try {
      const relativePath = `/api/folder/${folderId}/concept-graph`;
      const url = `${BASE_URL}${relativePath}`
      const { data } = await axios.post(url);
      
      if(!data.success){
         throw new Error(data.message);
      }
      return data.data;

   } catch (error: any) {
      console.error("[FolderServices] Failed to generate concept graph due to following error: ",
         error);
   }
}

export async function learningPathService(folderId: string) {
   try {
      const relativePath = `/api/folder/${folderId}/learning-path`;
      const url = `${BASE_URL}${relativePath}`;
      const { data } = await axios.get(url);

      if(!data.success){
         throw new Error(data.message);
      }
      return data.data;
   } catch (error) {
      console.error("[FolderService] Failed to generate learning path for folder due to following error: ",
         error
      );
   }
}
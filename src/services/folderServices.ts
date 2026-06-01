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
import { StudyPlanFile } from "@/components/folder-view/weekly-learning-goal";
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

// ---- Learning Goal Services ----

export interface LearningGoalData{
   hoursThisWeek: number;
   weeklyTargetHours: number;
   progressPercent: number;
   subConceptsToday: number;
   subjectLabel: string | null;
   goalExists: boolean;
}

/**
 * @method getLearningGoalService
 * Fetches weekly learning goal progress for a folder.
 * Powers the circular progress ring on the folder dashboard.
 * 
 * GET /api/folder/[folderId]/learing-goal?workspaceId=xxx
 */

export async function getLearningGoalService(
   folderId: string,
   workspaceId: string,
): Promise<{
   success: boolean;
   data?: LearningGoalData;
   message?: string;
   statusCode?: number;
}>{
   try {
      const relativePath = `/api/folder/${folderId}/learning-goal?workspaceId=${workspaceId}`;
      const url = `${BASE_URL}${relativePath}`;
      const { data } = await axios.get(url);
      if(!data.success) return {
         success: false,
         message: data.message || "[GetLearningGoalService] Failed to fetch learnig goal",
         statusCode: data.statusCode,
      } 
      return {
         success: true,
         data: data.data as LearningGoalData,
         statusCode: data.statusCode,
      }
   } catch (error: any) {
      console.error("[GetLearningGoalService] Failed: ",error.message);
      return {
         success: false,
         message: error.response?.data?.message || error.message || "An unexpected error occurred.",
      }
   }
}

/**
 * @method updateLearningGoalService
 * Creates or updates the weekly hour target and subject label for a folder
 * Called by the "Adjust Goal" modal.
 * 
 * PATCH /api/folder/[folderId]/learing-goal
 */

export async function updateLearningGoalService(
   folderId: string,
   workspaceId: string,
   weeklyTargetHours: number,
   subjectLabel?: string,
): Promise<{
   success: boolean;
   data?: LearningGoalData;
   message?: string;
   statusCode?: number;
}>{
   try {
      const relativePath = `/api/folder/${folderId}/learing-goal`;
      const url = `${BASE_URL}${relativePath}`;
      const { data } = await axios.patch(url, {
         weeklyTargetHours,
         subjectLabel,
         workspaceId,
      });
      if (!data.success)
      return {
        success: false,
        message: data.message || "Failed to update learning goal.",
        statusCode: data.statusCode,
      };
    return {
      success: true,
      data: data.data as LearningGoalData,
      statusCode: data.statusCode,
    };
   } catch (error: any) {
      console.error("[UpdateLearningGoalService] Failed: ", error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "An unexpected error occurred.",
    };
   }
}

// ---- Study plan Service (Deep Session button) ----

/**
 * @method getStudyPlanService
 * Fetched a prerequisites-aware ordered file list for a Deep session.
 * 
 * GET /api/folder/[folderId]/study-plan?minutes=60
 */

export async function getStudyPlanService(
   folderId: string,
   availableMinutes: number,
): Promise<{
   success: boolean;
   data?: {
      files: StudyPlanFile[];
      totalMinutes: number;
      remainingFiles: number;
      message: string;
   };
   message?: string;
   statusCode?: number;
}> {
   try {
      const relativePath = `/api/folder/${folderId}/study-plan?minutes=${availableMinutes}`;
      const url = `${BASE_URL}${relativePath}`;
      const { data } = await axios.get(url);

      if (!data.success)
      return {
        success: false,
        message: data.message || "Failed to generate study plan.",
        statusCode: data.statusCode,
      };
      return {
         success: true,
         data: data.data,
         statusCode: data.statusCode,
      };
   } catch (error: any) {
      console.error("[GetStudyPlanService] Failed: ", error.message);
      return {
         success: false,
         message: error.response?.data?.message || error.message || "An unexpected error occurred.",
      };
   }
}

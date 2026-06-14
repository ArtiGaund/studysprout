/**
 * SERVICE: PDF Import Services
 * ----------------------------
 * Role: Handles network requests for PDF processing.
 */

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

export const inspectPDFService = async (
    file:File,
    excludeIntro: boolean,
) => {
    try {
        const formData = new FormData();
        formData.append("file",file);
        formData.append("excludeIntro", String(excludeIntro));

        const relativePath = `/api/pdf/inspect`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.post(url, formData, {
            headers: {
                'Content-Type' : 'multipart/form-data',
            },
        });
       
        if(!data.success) throw new Error(data.message);

        return data.data;
    } catch (error) {
        console.error("[PDF Service Error] InspectPDF service failed: ",error);
        throw error;
    }
}

export const generatePDFFolderService = async(
    file: File,
    metadata: any,
    workspaceId: string,
    startOffset: number,
    endOffset: number,
    parentFolderId?: string, 
) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", metadata.title);

        const effectivePageCount = 
        metadata?.activePageCount ||
        metadata?.totalPages ||
        metadata?.pageCount ||
        0; 
        formData.append("pageCount", effectivePageCount.toString());
        formData.append("workspaceId", workspaceId);
        formData.append("startOffset", startOffset.toString());
        formData.append("endOffset", endOffset.toString());
        if(parentFolderId) formData.append("parentFolderId", parentFolderId);
        const relativePath = `/api/pdf/generate`;
        const url = `${BASE_URL}${relativePath}`;
        const{ data } = await axios.post(url, formData, {
            headers: {
                'Content-Type' : 'multipart/form-data',
            },
        });

        if(!data.success) throw new Error(data.message);
        
        return data.data;
    } catch (error) {
        console.error("[PDF Service] generatePDFFolder service error: ",error);
        throw error;
    }
}

export const retryPDFToFolderGenerationService = async(
    folderId: string,
    workspaceId: string,
) => {
    try {
        const pdfData = {
            folderId,
            workspaceId,
        }
        const relativePath = `/api/pdf/retry`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.post(url, pdfData);
        if(!data.success) throw new Error(data.message);

        return data.data;
    } catch (error) {
        console.error("[PDF Service] retry error: ",error);
        throw error;
    }
}
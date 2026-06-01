import axios from "axios";


const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function getLastStudiedService(){
    try {
        const relativePath = `/api/user/last-studied`;
        const url = `${BASE_URL}${relativePath}` 
        const { data } = await axios.get(relativePath);
        if(!data.success) return {
            success: false,
            message: data.message,
        }
        return {
            success: true,
            data: data.data,
        }
    } catch (error: any) {
        console.error("[GetLastStudiedService] Failed: ",error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

export async function updateLastStudiedService(
    payload: {
        setId: string;
        setTitle: string;
        cardIndex: number;
        totalCards: number;
        resourceType: "Workspace" | "Folder" | "File";
        workspaceId: string;
        folderId?: string;
    }
){
    try {
        const relativePath = `/api/user/last-studied`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.patch(relativePath, payload);
        if(!data.success) return {
            success: false,
            message: data.message,
        }
        return {
            success: true,
            data: data.data,
        }
    } catch (error: any) {
        console.error("[UpdateLastStudiedService] Failed: ",error.message);
        return {
            success: false,
            message: error.message
        };
    }
}
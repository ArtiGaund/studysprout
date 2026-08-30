import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function getInboxDataService(){
    try {
        const relativePath = `/api/inbox`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);
        if(!data.success) throw new Error(data.message);
        return data.data; 
    } catch (error) {
        console.warn("[InboxServices] Failed to get Inbox Data: ",error);
    }
}

export async function deleteInboxItemService(itemId: string){
    try {
        const relativePath = `/api/inbox/${itemId}`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.delete(url);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[InboxService] Failed to delete inbox item: ",error);
    }
}

export async function getInboxCountService(){
    try {
        const relativePath = `/api/inbox/count`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.get(url);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[InboxService] Failed to get inbox count: ",error);
    }
}

export async function mergeInboxItemService(inboxId: string, fileId: string){
    try {
        const relativePath = `/api/inbox/${inboxId}/merge`;
        const url = `${BASE_URL}${relativePath}`;
        const { data } = await axios.post(url, { fileId });
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {   
        console.warn("[InboxService] Failed to merge inbox item: ",error);
    }
}
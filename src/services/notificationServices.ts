import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function getNotificationsService(){
    try {
        const relativePath = `/api/notifications`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.error("[getNotificationsService] Failed to get all notifications: ",error);
    }
}

export async function markNotificationReadService(notificationId: string){
    try {
        const relativePath = `/api/notifications/${notificationId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.patch(url);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.error("[markNotificationReadService] Failed to mark notification as read: ",error);
    }
}

export async function markAllNotificationReadService(){
    try {
        const relativePath = `/api/notifications/mark-all`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.patch(url);
        if(!data.success) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.error("[markNotificationReadService] Failed to mark all notification as read: ",error)
    }
}
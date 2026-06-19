import { useSocket } from "@/lib/providers/socket-provider";
import { NotificationType } from "@/model/notification.model";
import { getNotificationsService, markAllNotificationReadService, markNotificationReadService } from "@/services/notificationServices";
import { useCallback, useEffect, useRef, useState } from "react";

export interface AppNotification{
    _id: string;
    recipientId: string;
    senderId: string;
    senderUsername: string;
    type: NotificationType;
    workspaceId: string;
    workspaceTitle: string;
    invitationId?: string;
    role?: "editor" | "viewer";
    read: boolean;
    createdAt: string;
}

interface NotificationState{
    invitations: AppNotification[];
    unread: AppNotification[];
    recentRead: AppNotification[];
}

export function useNotification(){
    const [ state, setState ] = useState<NotificationState>({
        invitations: [],
        unread: [],
        recentRead: [],
    });
    const [ loading, setLoading ] = useState(false);
    const { socket, isConnected } = useSocket();
    const fetchRef = useRef(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getNotificationsService();
            if(result) setState(result);
        } catch (error) {
            console.error("[useNotification] Fetch failed: ",error);
        }finally{
            setLoading(false);
        }
    },[]);

    const markAsRead = useCallback(async(notificationId: string) => {
        try {
            await markNotificationReadService(notificationId);
            setState((prev) => {
                // Move from unread -> recentRead
                const target = prev.unread.find((n) => n._id === notificationId);
                if(!target) return prev;
                const updated = { ...target, read: true };
                return {
                    ...prev,
                    unread: prev.unread.filter((n) => n._id !== notificationId),
                    recentRead: [ updated, ...prev.recentRead].slice(0,10),
                };
            });
        } catch (error) {
            console.error("[useNotification] Failed to mark as read: ",error);
        }
    },[]);

    const markAllAsRead = useCallback(async() => {
        try {
            await markAllNotificationReadService();
            setState((prev) => {
                const nowRead = prev.unread.map((n) => ({ ...n, read: true }));
                return{
                    ...prev,
                    unread: [],
                    recentRead: [...nowRead, ...prev.recentRead].slice(0,10),
                };
            });
        } catch (error) {
            console.error("[useNotification] Failed to mark all notification as read: ",error);
        }
    },[]);

    // Handle invitation acted on (remove from invitation section) ---
    const removeInvitation = useCallback((invitationId: string) => {
        setState((prev) => ({
            ...prev,
            invitations: prev.invitations.filter((n) => n.invitationId !== invitationId),
        }));
    },[]);

    // Initial fetch
    useEffect(() => {
        if(fetchRef.current) return;
        fetchRef.current = true;
        fetchNotifications();
    },[ fetchNotifications]);

    // Real time: socket push
    useEffect(() => {
        if(!socket || !isConnected) return;

        socket.off("notification:new");
        const handleNew = (notification: AppNotification) => {
            setState((prev) => {
                if(notification.type === "invitation_received"){
                    // Avoid duplicates
                    const exists = prev.invitations.some((n) => n._id === notification._id);
                    if(exists) return prev;
                    return {
                        ...prev,
                        invitations: [ notification, ...prev.invitations ],
                    };
                }
                // activity notification -> unread
                const exists = prev.unread.some((n) => n._id === notification._id);
                if(exists) return prev;
                return {
                    ...prev, 
                    unread: [ notification, ...prev.unread ],
                };
            });
        };

        socket.on("notification:new", handleNew);
        return () => {
            socket.off("notification:new", handleNew);
        };
    },[
        socket,
        isConnected,
    ]);

    const totalUnread = state.invitations.length + state.unread.length;

    return {
        ...state,
        loading,
        totalUnread,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        removeInvitation,
    };
}
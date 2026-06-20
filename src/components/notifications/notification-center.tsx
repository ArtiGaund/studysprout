"use client";

import { AppNotification, useNotification } from "@/hooks/useNotification";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, ChevronDown, ChevronUp, Loader2, UserCheck, UserX, X } from "lucide-react";
import { Button } from "../ui/button";
import clsx from "clsx";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";
import { useWorkspaceInvitations } from "@/hooks/workspace-members/useWorkspaceInvitations";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";

/* --- Breakpoint hook */
function useIsMobile(breakpoint = 768){
    const [ isMobile, setIsMobile ] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const onChange = () => setIsMobile(mql.matches);
        onChange();
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    },[ breakpoint ]);

    return isMobile;
}

/* --- Relative timestamp --- */
function TimeAgo({ date }: { date: string }){
    return(
        <span className="text-[10px] text-zinc-500 shrink-0">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </span>
    );
}

/* --- Single invitation card --- */
function InvitationCard({
    notification,
    onRespond,
    responding,
}: {
    notification: AppNotification;
    onRespond: (invitationId: string, action: "accepted" | "rejected") => void;
    responding: boolean;
}){
    return(
        <div className="px-4 py-3 space-y-2 hover:bg-zinc-800/40 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">
                        <span className="font-semibold">
                            {notification.senderUsername}
                        </span>
                        {" invited you to join "}
                        <span className="font-semibold">
                            {notification.workspaceTitle}
                        </span>
                    </p>
                    <p className="text-xs text-zinc-400 capitalize">
                        Role: {notification.role}
                    </p>
                </div>
                <TimeAgo date={notification.createdAt}/>
            </div>

            {responding ? (
               <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                    <span>Saving...</span>
               </div>
            ) : (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="h-8 px-3 text-xs flex-1 min-w-0"
                        onClick={() => onRespond(notification.invitationId!, "accepted")}
                    >   
                        <UserCheck className="w-3 h-3 mr-1 shrink-0"/>
                        Accept
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-3 text-xs flex-1 text-red-400 hover:text-red-400
                        hover:bg-red-500/10"
                        onClick={() => onRespond(notification.invitationId!, "rejected")}
                    >
                        <UserX className="w-3 h-3 mr-1 shrink-0"/>
                        Decline
                    </Button>
                </div>
            )}
        </div>
    );
}

/* --- Single activity notification row --- */
function ActivityRow({
    notification,
    onRead,
}: {
    notification: AppNotification;
    onRead?: (id: string) => void;
}){
    const isAccepted = notification.type === "invitation_accepted";

    return (
        <div
            className={clsx(
                "px-4 py-3 flex items-start gap-3 hover:bg-zinc-800/40 transition-colors",
                !notification.read && "bg-zinc-800/20"
            )}
        >
            {/* Icon */}
            <div
                className={clsx(
                    "mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                    isAccepted ? "bg-green-500/15" : "bg-red-500/15"
                )}
            >
                {isAccepted ? (
                    <UserCheck className="w-3.5 h-3.5 text-green-400"/>
                ) : (
                    <UserX className="w-3.5 h-3.5 text-red-400"/>
                )}
            </div>

            {/* Text */}
            <div className="flex-1 space-y-0.5">
                <p className="text-sm text-foreground leading-snug">
                    <span className="font-semibold">{notification.senderUsername}</span>
                    {isAccepted
                        ? " accepted your invitation to "
                        : " declined your invitation to "
                    }
                    <span className="font-semibold">{notification.workspaceTitle}</span>
                </p>
                <TimeAgo date={notification.createdAt}/>
            </div>

            {/* Mark read button */}
            {!notification.read && onRead && (
                <button
                    onClick={() => onRead(notification._id)}
                    className="mt-0.5 p-1 rounded hover:bg-zinc-700 text-zinc-500 
                    hover:text-zinc-300 transition-colors shrink-0"
                    title="Mark as read"
                >   
                    <Check className="w-3.5 h-3.5"/>
                </button>
            )}
        </div>
    );
}

/* --- Section Header --- */
function SectionHeader({
    label,
    count,
}: {
    label: string;
    count?: number;
}){
    return(
        <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {label}
            </p>    
            {count !== undefined && count > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {count}
                </Badge>
            )}
        </div>
    );
}

interface NotificationBodyProps{
    invitations: AppNotification[];
    unread: AppNotification[];
    recentRead: AppNotification[];
    loading: boolean;
    respondingId: string | null;
    showRead: boolean;
    setShowRead: (v: boolean | ((p: boolean) => boolean)) => void;
    onRespond: (invitationId: string, action: "accepted" | "rejected") => void;
    onRead: (id: string) => void;
    onMarkAllRead: () => void;
    onClose?: () => void;
}
/* --- Shared notification body */
function NotificationBody({
    invitations,
    unread,
    recentRead,
    loading,
    respondingId,
    showRead,
    setShowRead,
    onRespond,
    onRead,
    onMarkAllRead,
    onClose,
}: NotificationBodyProps){

    const isEmpty = 
        invitations.length === 0 && unread.length === 0 && recentRead.length === 0;

    return (
        <>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                <div className="flex items-center gap-2">
                    {unread.length > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            className="flex items-center gap-1 text-xs text-zinc-400
                            hover:text-zinc-200 transition-colors"
                        >
                            <CheckCheck className="w-3.5 h-3.5"/>
                            <span className="hidden sm:inline">Mark all read</span>
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-zinc-700 text-zinc-500 
                            hover:text-zinc-300 transition-colors"
                        >
                            <X className="w-4 h-4"/>
                        </button>
                    )}
                </div>
            </div>
            <Separator className="bg-zinc-800"/>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-500"/>
                    </div>
                )}

                {!loading && isEmpty && (
                    <div className="px-4 py-12 text-center space-y-2">
                        <Bell className="w-8 h-8 text-zinc-600 mx-auto"/>
                        <p className="text-xs text-zinc-500">{`You're all caught up`}</p>
                    </div>
                )}

                {/* Section 1: Invitations */}
                {!loading && invitations.length > 0 && (
                    <>
                        <SectionHeader label="Invitations" count={invitations.length}/>
                        {invitations.map((n, i) => (
                            <div key={n._id}>
                                <InvitationCard 
                                    notification={n}
                                    responding={respondingId === n.invitationId}
                                    onRespond={onRespond}
                                />
                                {i < invitations.length - 1 && (
                                    <Separator className="bg-zinc-800"/>
                                )}
                            </div>
                        ))}
                        {(unread.length > 0 || recentRead.length > 0) && (
                            <Separator className="bg-zinc-800 mt-1"/>
                        )}
                    </>
                )}

                {/* Section 2: Unread activity */}
                {!loading && unread.length > 0 && (
                    <>
                        <SectionHeader label="Unread" count={unread.length}/>
                        {unread.map((n) => (
                            <ActivityRow 
                                key={n._id}
                                notification={n}
                                onRead={onRead}
                            />
                        ))}
                        {recentRead.length > 0 && (
                            <Separator className="bg-zinc-800 mt-1"/>
                        )}
                    </>
                )}

                {/* Section 3: Read (collapsed) */}
                {!loading && recentRead.length > 0 && (
                    <>
                        <button
                            onClick={() => setShowRead((p) => !p)}
                            className="w-full px-4 py-2 flex items-center justify-between
                            hover:bg-zinc-800/40 transition-colors"
                        >
                            <p className="text-xs font-semibold text-zinc-500 uppercase
                            tracking-wider">
                                Recent
                            </p>
                            {showRead ? (
                                <ChevronUp className="w-3.5 h-3.5 text-zinc-500"/>
                                ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-500"/>
                            )}
                        </button>
                        {showRead && 
                            recentRead.map((n) => (
                                <ActivityRow 
                                    key={n._id}
                                    notification={n}
                                />
                            ))
                        }
                    </>
                )}
            </div>
        </>
    )
}

/* --- Main Component --- */
export function NotificationCenter(){
    const [ open, setOpen ] = useState(false);
    const [ showRead, setShowRead ] = useState(false);
    const [ respondingId, setRespondingId ] = useState<string | null>(null);

    const isMobile = useIsMobile();

    const {
        invitations,
        unread,
        recentRead,
        loading,
        totalUnread,
        markAsRead,
        markAllAsRead,
        removeInvitation,
    } = useNotification();
    
    const { respondToInvite } = useWorkspaceInvitations("");

    const handleRespond = async (
        invitationId: string,
        action: "accepted" | "rejected",
    ) => {
        setRespondingId(invitationId);
        try {
            const notif = invitations.find((n) => n.invitationId === invitationId);
            if(!notif) return;
            await respondToInvite(invitationId, action);
            removeInvitation(invitationId);
        } catch (error) {
            console.error("[NotificationCenter] respond failed: ",error);
        }finally{
            setRespondingId(null);
        }
    };

    const TriggerButton = (
        <button
            className="relative p-1.5 rounded-md hover:bg-zinc-800/60 transition-colors"
            aria-label={`Notification (${totalUnread} unread)`}
            onClick={() => setOpen(true)}
        >
            <Bell className="w-5 h-5 text-muted-foreground"/>
            {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white
                text-[9px] font-bold min-w-[16px] rounded-full flex items-center justify-center 
                px-0.5">
                    {totalUnread > 9 ? "9+" : totalUnread}
                </span>
            )}
        </button>
    );

    const bodyProps = {
        invitations,
        unread,
        recentRead,
        loading,
        respondingId,
        showRead,
        setShowRead,
        onRespond: handleRespond,
        onRead: markAsRead,
        onMarkAllRead: markAllAsRead,
    }

    /* --- Mobile: bottom sheet drawer */
    if(isMobile){
        return(
            <>
                {TriggerButton}
                <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerContent className="bg-zinc-900 border-zinc-700 max-h-[85svh]
                    flex flex-col">
                        <DrawerHeader className="sr-only">
                            <DrawerTitle>Notification</DrawerTitle>
                        </DrawerHeader>
                        {/* Drag handle */}
                        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-1
                        shrink-0"/>
                        <NotificationBody 
                            {...bodyProps}
                            onClose={() => setOpen(false)}
                        />
                    </DrawerContent>
                </Drawer>
            </>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
            <PopoverContent
                className={clsx(
                    "p-0 bg-zinc-900 border-zinc-700 shadow-xl flex flex-col",
                    "w-[min(320px,calc(100vw-2rem))]", // never overflows viewport
                    "md:w-[360px]", 
                    "max-h-[min(480px, calc(100svh-6rem))]" // never taller than viewport
                )}
                align="end"
                sideOffset={8}
                // On smaller viewports keep it within bounds
                avoidCollisions
                collisionPadding={12}
            >
                <NotificationBody {...bodyProps}/>
            </PopoverContent>
        </Popover>
    )
}
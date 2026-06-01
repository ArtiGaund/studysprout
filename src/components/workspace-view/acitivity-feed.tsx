/**
 * ActivityFeed - Full "View All Activity" page
 * 
 * Features:
 * - Infinite scroll pagination (load 20 at a time)
 * - Filter by event type (dropdown)
 * - Filter by Folder (dropdown, populated from your existing folders API)
 * - Timeline layout with data separators
 */

"use client";

import { useWorkspaceActivity } from "@/hooks/useWorkspaceActivity";
import { Archive, FileQuestion, FileText, Folder, Link2, Sparkle, Target, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ActivityEvent{
    _id: string;
    type: string;
    description: string;
    fileId?: string;
    folderId?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface ActivityPagination{
   page: number;
   limit: number;
   total: number;
   totalPages: number;
   hasNextPage: boolean;
}

interface ActivityFeedProps{
    workspaceId: string;
}

// --- Constants---
const EVENTS_TYPES_LABELS: Record<string, string> = {
    FILE_CREATED: "File Created",
    FILE_UPDATED: "File Updated",
    FILE_ARCHIVED: "File Archived",
    FLASHCARD_SET_GENERATED: "Flashcard Set Generated",
    FLASHCARD_SET_DELETED: "Flashcard Set Deleted",
    FLASHCARD_SET_REGENERATED: "Flashcard Set Regenerated",
    SYNTHESIS_COMPLETED: "Synthesis Completed",
    FOLDER_CREATED: "Folder Created",
    FOLDER_DELETED: "Folder Deleted",
    CONNECTION_CREATED: "Connection Created",
    GOAL_UPDATED: "Goal Updated",
    MEMBER_JOINED: "Member Joined",
    MEMBER_REMOVED: "Member Removed",
};

const EVENTS_ICONS: Record<string, React.ComponentType<any>> ={
    SYNTHESIS_COMPLETED: Sparkle,
    FLASHCARD_SET_GENERATED: Zap,
    FLASHCARD_SET_DELETED: Zap,
    FLASHCARD_SET_REGENERATED: Zap,
    FILE_UPDATED: FileText,
    FILE_CREATED: FileText,
    FILE_ARCHIVED: Archive,
    CONNECTION_CREATED: Link2,
    FOLDER_CREATED: Folder,
    FOLDER_DELETED: Folder,
    GOAL_UPDATED: Target,
    MEMBER_JOINED: Users,
    MEMBER_REMOVED: Users,
}

const EVENT_COLORS: Record<string, string> = {
  SYNTHESIS_COMPLETED: "#a78bfa",
  FLASHCARD_SET_GENERATED: "#6ee7b7",
  FLASHCARD_SET_DELETED: "#f87171",
  FLASHCARD_SET_REGENERATED: "#6ee7b7",
  FILE_UPDATED: "#93c5fd",
  FILE_CREATED: "#93c5fd",
  FILE_ARCHIVED: "#fbbf24",
  CONNECTION_CREATED: "#34d399",
  FOLDER_CREATED: "#60a5fa",
  FOLDER_DELETED: "#f87171",
  GOAL_UPDATED: "#f472b6",
  MEMBER_JOINED: "#34d399",
  MEMBER_REMOVED: "#f87171",
};

function formatDateTime(dateStr: string): string{
    return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateGroup(dateStr: string): string{
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if(d.toDateString() === today.toDateString()) return "Today";
    if(d.toDateString() === yesterday.toDateString()) return "Yesterday";

    return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

function ActivityRow({ event }: { event: ActivityEvent}){
    const color = EVENT_COLORS[event.type] ?? "#6b7280";
    const Icon = EVENTS_ICONS[event.type] ?? FileQuestion;
    const metadata = event.metadata ?? {};

    return (
        <div className="flex gap-3.5 items-start py-3 border-b border-[#1f2937]">
            <div 
            className="w-8 h-8 bg-[#1f2937] rounded-full flex items-center 
            justify-center text-[14px] flex-shrink-0 mt-[2px] transition-colors"
            style={{ border: `1px solid ${color}40`}}
            >   
                <Icon size={14} style={{ color: color }}/>
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <p className="m-0 text-[14px] text-[#e2e2f0] font-medium">
                        {event.description}
                    </p>
                    <span className="text-[11px] text-[#4b5563] whitespace-nowrap ml-3.5
                    mt-[2px]">
                        {formatDateTime(event.createdAt)}
                    </span>
                </div>

                <div className="flex gap-2 mt-[6px] flex-wrap">
                    {/* Type badge */}
                    <span 
                    className="text-[11px] py-[2px] px-[8px] rounded-[99px]"
                    style={{
                        background: `${color}18`,
                        color,
                        border: `1px solid ${color}30`,
                    }}
                    >
                        {EVENTS_TYPES_LABELS[event.type] ?? event.type}
                    </span>

                    {/* Meta chips */}
                    {metadata.nodeCount !== undefined && (
                        <span className="text-[11px] text-[#6b7280]">
                            {metadata.nodeCount} nodes
                        </span>
                    )}
                    {metadata.cardCount !== undefined && (
                        <span className="text-[11px] text-[#6b7280]">
                            {metadata.cardCount} cards
                        </span>
                    )}
                    {metadata.fileCount !== undefined && (
                        <span className="text-[11px] text-[#6b7280]">
                            {metadata.fileCount} files
                        </span>
                    )}
                    {metadata.memberName !== undefined && (
                        <span className="text-[11px] text-[#6b7280]">
                            {metadata.memberName}
                        </span>
                    )}
                    {metadata.setTitle !== undefined && (
                        <span className="text-[11px] text-[#6b7280]">
                            {metadata.setTitle}
                        </span>
                    )}
                    {metadata.folderTitle !== undefined && (
                        <span className="text-[11px] text-[#6b7280]">
                            {metadata.folderTitle}
                        </span>
                    )}
                    {metadata.fileTitle !== undefined && (
                        <span className="text-[11px] text-[#6b7280]">
                            {metadata.fileTitle}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export const ActivityFeed = ({ workspaceId }: ActivityFeedProps) => {
    const router = useRouter();
    const [ events, setEvents ] = useState<ActivityEvent[]>([]);
    const [ pagination, setPagination ] = useState<ActivityPagination | null>(null);
    const [ loading, setLoading ] = useState(true);
    const [ loadingMore, setLoadingMore ] = useState(false);
    const [ typeFilter, setTypeFilter ] = useState("");
    const [ page, setPage ] = useState(1);
    const loadRef = useRef<HTMLDivElement>(null);

    const { getActivity } = useWorkspaceActivity(workspaceId);

    useEffect(() => {
        setLoading(true);
        setEvents([]);
        setPage(1);

        const load = async () => {
            try {
                const result = await getActivity({
                    page: 1,
                    limit: 20,
                    type: typeFilter || undefined,
                });
                if(!result.success && !result.data){
                    console.error("[Activity Page] Failed to load ",result.error);
                    return;
                }
                setEvents(result.data?.events ?? []);
                if(result.data?.pagination){
                    setPagination(result.data?.pagination);
                }
                
            } catch (error: any) {
                console.error("[Activity Page] Failed: ",error.message);
            }finally{
                setLoading(false);
            }
        }

        load();
    },[
        workspaceId,
        typeFilter,
    ]);

    // Infinite scroll: watch the sentinel div at the bottom
    useEffect(() => {
        const observer = new IntersectionObserver(
            async (entries) => {
                if(entries[0].isIntersecting && pagination?.hasNextPage && !loadingMore){
                    const nextPage = page + 1;
                    setLoadingMore(true);
                    setPage(nextPage);

                    const result = await getActivity({
                        page: nextPage,
                        limit: 20,
                        type: typeFilter || undefined,
                    });

                    if(!result.success || !result.data){
                        console.error("[Activity Page] Failed to load another page: ",result.error);
                        return;
                    }
                    setEvents((prev) => [
                        ...prev,
                        ...result.data!.events
                    ]);
                    setPagination(result.data.pagination);
                    setLoadingMore(false);
                }
            },
            { threshold: 0.5 }
        );
        if(loadRef.current) observer.observe(loadRef.current);
        return () => observer.disconnect();
    },[
        pagination,
        loadingMore,
        page,
        typeFilter,
        workspaceId,
    ]);

    // Group events by data label
    const grouped: { dateLabel: string, events: ActivityEvent[] }[] = [];
    for(const event of events){
        const label = formatDateGroup(event.createdAt);
        const last = grouped[grouped.length - 1];
        if(last && last.dateLabel === label) last.events.push(event);
        else grouped.push({
            dateLabel: label,
            events: [ event ],
        });
    }

    return (
        <div className="max-w-[760px] mx-auto py-10 px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="bg-[#0f172a] border border-white/5 hover:border-white/10 
                        text-gray-400 hover:text-white transition-all rounded-xl py-1.5
                        px-3.5 text-xs font-medium cursor-pointer"
                    >
                        ← Back
                    </button>
                    <h1 className="m-0 text-xl font-bold tracking-tight">
                        All Activity
                    </h1>
                </div>
                {pagination && (
                    <span className="bg-[#0f172a] border border-white/5 text-xs
                     text-gray-500 font-medium px-2.5 py-1 rounded-lg">
                        {pagination.total} events
                    </span>
                )}
            </div>
            

            {/* Filter Section Container */}
            <div className="mb-6 flex items-center justify-start">
                <div className="relative inline-block w-full sm:w-64">
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-[#0f172a] border border-white/5 hover:border-white/10
                    rounded-xl text-gray-300 hover:text-white py-2.5 pl-3.5 pr-10 text-xs font-medium
                    cursor-pointer appearance-none outline-none transition-all"
                >
                    <option value="" className="bg-[#161616]">
                        All event types
                    </option>
                    {Object.entries(EVENTS_TYPES_LABELS).map(([val, label]) => (
                        <option
                            key={val}
                            value={val}
                            className="bg-[#161616]"
                        >
                            {label}
                        </option>
                    ))}
                </select>
                {/* Visual indicator replacement for missing default dropdown caret */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center
                px-3.5 text-gray-500">
                    <svg 
                        className="fill-current h-3 w-3" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                </div>
            </div>

            </div>
            
            {/* Timeline */}
            {loading ? (
                <div className="text-[#4b5563] text-xs py-12 text-center font-medium animate-pulse">
                    Loading activities...
                </div>
            ) : events.length === 0 ? (
                <div className="bg-[#0f172a] border border-white/5 rounded-2xl py-14 px-6 text-center
                text-gray-500 text-xs font-medium">
                    No activity found{typeFilter 
                        ? ` for "${EVENTS_TYPES_LABELS[typeFilter]}"` 
                        : ""
                    }
                </div>
            ): (
                <div className="flex flex-col gap-y-6">
                    {grouped.map(({ dateLabel, events: dayEvents }) => (
                    <div
                        key={dateLabel}
                        className="flex flex-col"
                    >
                        <p className="mb-3 text-[10px] font-bold text-gray-500
                        uppercase tracking-widest">
                            {dateLabel}
                        </p>
                        <div className="bg-[#0f172a] border border-white/5 rounded-2xl px-5
                        divide-y divide-white/5">
                            {dayEvents.map((event) => (
                                <ActivityRow 
                                    key={event._id}
                                    event={event}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                </div>
            )}

            {/* Infinite scroll sential */}
            <div 
                ref={loadRef}
                className="h-14 flex items-center justify-center mt-4"
            >   
                {loadingMore && (
                    <span className="text-xs text-gray-500 font-medium animate-pulse">
                        Loading more...
                    </span>
                )}
            </div>
        </div>
    )

}
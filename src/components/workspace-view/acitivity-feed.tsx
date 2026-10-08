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
import { MARK_ACTIVITY_FRESH } from "@/store/slices/activitySlice";
import { 
    Archive, 
    ChevronDown, 
    FileQuestion, 
    FileText, 
    Folder, 
    Link2, 
    Sparkle, 
    Target, 
    Users, 
    Zap 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

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
        <div className="flex gap-3.5 items-start py-3 hover:bg-white/[0.02] 
        transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-white/5 
        last:border-none">
            <div 
            className="w-8 h-8 bg-purple-950/30 border border-purple-500/20 rounded-full  
            items-center text-purple-300 flex justify-center text-[14px] flex-shrink-0  
            transition-colors mt-[2px]"
            style={{ border: `1px solid ${color}40`}}
            >   
                <Icon size={14} style={{ color: color }}/>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-x-2">
                    <p className="m-0 text-xs text-zinc-100 leading-snug truncate font-mono">
                        {event.description}
                    </p>
                    <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap 
                    ml-3.5 mt-[2px] shrink-0">
                        {formatDateTime(event.createdAt)}
                    </span>
                </div>

                <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                    {/* Type badge */}
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded-md bg-white/5
                     text-purple-300 border border-white/10">
                        {EVENTS_TYPES_LABELS[event.type] ?? event.type}
                    </span>

                    {/* Meta chips */}
                    {Object.entries({
                        nodeCount: metadata.nodeCount !== undefined ? `${metadata.nodeCount} nodes` : null,
                        cardCount: metadata.cardCount !== undefined ? `${metadata.cardCount} cards` : null,
                        fileCount: metadata.fileCount !== undefined ? `${metadata.fileCount}` : null,
                        memberName: metadata.memberName,
                        setTitle: metadata.setTitle,
                        folderTitle: metadata.folderTitle,
                        fileTitle: metadata.fileTitle,
                    }).map(([key, val]) => val ? (
                        <span key={key} className="text-[10px] font-mono text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                            {val}
                        </span>
                    ) : null)}
                </div>
            </div>
        </div>
    )
}

export const ActivityFeed = ({ workspaceId }: ActivityFeedProps) => {
    const router = useRouter();
    // UI-only local state
    const [ typeFilter, setTypeFilter ] = useState("");
    const loadRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch();

    /**
     * autoRefreshOnStale: false - opt this page out of the hooks internal "always fetch 4 recent
     * items on staleness" behavior, which would otherwise clobber this page's paginated/filtered
     * list.
     */
    const { 
        events,
        pagination,
        loading,
        activityStale,
        getActivity,
        loadMore, 
    } = useWorkspaceActivity(workspaceId);

    const [ loadingMore, setLoadingMore ] = useState(false);
    
    const loadFirstPage = useCallback(async () => {
        const result = await getActivity({
            page: 1,
            limit: 20,
            type: typeFilter || undefined,
        });
        if(!result.success || !result.data){
            console.error("[Activity Page] Failed to load first page: ",result.error);
        }
    },[
        getActivity,
        typeFilter,
    ]);
 
    useEffect(() => {
        loadFirstPage();
    },[
        workspaceId,
        typeFilter,
        loadFirstPage,
    ]);

    /**
     * @effect Real-time refresh
     * Whenever another number performs an activity while this page is open, activity_created
     * flips activityStale true (through registerWorkspaceEvents). This resets to page 1 and
     * refreshes with the current type filter, then marks the flag fresh. Chose a full reset-to-
     * page-1 refetch over trying to splice a single event into a infinite scrolled, filtered list-
     * simpler and matches the pattern already used for MARK_FLASHCARD_SETS_STALE.
     */
    useEffect(() => {
        if(!activityStale) return;

        loadFirstPage();
        dispatch(MARK_ACTIVITY_FRESH());
    },[
        activityStale,
        dispatch,
        loadFirstPage,
    ]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            async (entries) => {
                if(entries[0].isIntersecting && pagination?.hasNextPage && !loadingMore){
                    setLoadingMore(true);
                    await loadMore();
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
        loadMore,
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
        <div className="max-w-[800px] mx-auto py-10 px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b 
            border-white/10">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="bg-[#110A10] border border-white/10 hover:border-purple-500/30 
                        text-zinc-400 hover:text-white transition-all rounded-xl py-1.5
                        px-3.5 text-xs font-mono cursor-pointer flex items-center gap-x-1"
                    >
                        ← Back
                    </button>
                    <h1 className="m-0 text-xl font-bold tracking-tight text-zinc-100">
                        All Activity
                    </h1>
                </div>
                {pagination && (
                    <span className="bg-[#110A10] border border-white/10 text-xs
                     text-zinc-400 font-mono px-2.5 py-1 rounded-lg">
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
                    className="w-full bg-[#110A10] border border-white/10 hover:border-purple-500/30
                    rounded-xl text-zinc-400 hover:text-white py-2.5 pl-3.5 pr-10 text-xs font-mono
                    cursor-pointer appearance-none outline-none transition-all"
                >
                    <option value="" className="bg-[#0A0507]">
                        All event types
                    </option>
                    {Object.entries(EVENTS_TYPES_LABELS).map(([val, label]) => (
                        <option
                            key={val}
                            value={val}
                            className="bg-[#0A0507]"
                        >
                            {label}
                        </option>
                    ))}
                </select>
                {/* Visual indicator replacement for missing default dropdown caret */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center
                px-3.5 text-zinc-500">
                    <ChevronDown size={14}/>
                </div>
            </div>

            </div>
            
            {/* Timeline */}
            {loading ? (
                <div className="text-zinc-500 text-xs py-12 text-center font-mono animate-pulse">
                    Loading activities...
                </div>
            ) : events.length === 0 ? (
                <div className="bg-[#110A10] border border-white/10 rounded-2xl py-14 px-6
                 text-center text-zinc-500 text-xs font-mono">
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
                        <p className="mb-3 text-[10px] font-mono font-semibold text-zinc-500
                        uppercase tracking-widest">
                            {dateLabel}
                        </p>
                        <div className="bg-[#110A10] border border-white/10 rounded-2xl px-5
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
                    <span className="text-xs text-zinc-500 font-mono animate-pulse">
                        Loading more...
                    </span>
                )}
            </div>
        </div>
    );
}
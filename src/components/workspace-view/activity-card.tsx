'use client';

import { Archive, FileText, Folder, Link2, Sparkle, Target, Zap } from "lucide-react";
import { ActivityEvent } from "./acitivity-feed";
import React from "react";

function relativeTime(dateStr: string): string{
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor( diff / 3600000);
    const days = Math.floor( diff / 86400000);

    if(mins < 1) return "Just now";
    if(mins < 60) return `${mins}m ago`;
    if(hours < 24) return `${hours}h ago`;
    if(days === 1) return "Yesterday";
    return `${days}d ago`;
}

// Icon map - return an SVG string for every event type
function EventIcon({ type }: { type: string }){
    const icons: Record<string, { bg: string; icon: React.ComponentType<any>; color: string; }> = {
        SYNTHESIS_COMPLETED: { bg: "#purple-950/60", color: "text-purple-300", icon: Sparkle },
        FLASHCARDS_GENERATED: { bg: "bg-emerald-950/60", color: "text-emerald-300", icon: Zap },
        FILE_UPDATED: { bg: "bg-white/[0.04]", color: "text-zinc-300", icon: FileText },
        FILE_CREATED: { bg: "bg-white/[0.04]", color: "text-zinc-300", icon: FileText },
        FILE_ARCHIVED: { bg: "bg-zinc-900", color: "text-zinc-400", icon: Archive },
        CONNECTION_CREATED: { bg: "bg-blue-950/60", color: "text-blue-300", icon: Link2 },
        FOLDER_CREATED: { bg: "bg-purple-950/40", color: "text-purple-300", icon: Folder },
        GOAL_UPDATED: { bg: "bg-amber-950/60", color: "text-amber-300", icon: Target },
    };

    const cfg = icons[type] ?? { bg: "bg-white/[0.04]", color: "text-zinc-300", icon: FileText };
    const Icon = cfg.icon;
    return (
        <div className={`w-8 h-8 rounded-lg ${cfg.bg} border border-white/10 flex items-center 
        justify-center shrink-0`}>
            <Icon size={14} className={cfg.color}/>
        </div>
    );
}

export const ActivityCard = ({event}: {event: ActivityEvent }) => {
    const m = event.metadata ?? {};

    const hasStatesMetadata =
        m.fileCount !== undefined ||
        m.cardCount !== undefined ||
        m.nodeCount !== undefined ||
        m.fileId !== undefined;

    return (
        <div className="bg-[#110A10] border border-white/10 rounded-2xl p-4 flex flex-col
        justify-between gap-3 w-full min-w-0 transition-all duration-150 hover:border-purple-500/20">
            {/* Top Row: Info and Timestamp */}
            <div className="flex justify-between items-start gap-x-2 w-full">
                <EventIcon type={event.type}/>
                <span className="text-[11px] font-mono text-zinc-500 shrink-0 mt-0.5">
                    {relativeTime(event.createdAt)}
                </span>
            </div>
           
            {/* Description */}
            <p className="m-0 text-xs font-mono text-zinc-200 leading-snug flex-1 mt-1">
                {event.description}
            </p>

            {/* Stats row */}
            {hasStatesMetadata && (
                <div className="flex items-center gap-x-3 text-[12px] font-mono text-zinc-500
                border-t border-white/5 pt-2.5 mt-1">
                    {m.fileCount !== undefined && (
                        <span className="flex items-center gap-x-1">
                            <FileText size={14}/> {m.fileCount}
                        </span>
                    )}
                    {/* Fallback for single targeted entries like reference files */}
                    {m.fileCount === undefined && m.fileId && (
                        <span className="flex items-center gap-x-1">
                            <FileText size={12}/> 1 file
                        </span>
                    )}
                    {m.cardCount !== undefined && (
                        <span className="flex items-center gap-x-1 text-emerald-400 font-medium">
                            <Zap size={14} className="fill-emerald-400/20"/> {m.cardCount} cards
                        </span>
                    )}
                    {m.nodeCount !== undefined && (
                        <span className="flex items-center gap-x-1">
                            <Sparkle size={14}/> {m.nodeCount} nodes
                        </span>
                    )}
                </div>
            )}
        </div>
    );
} 
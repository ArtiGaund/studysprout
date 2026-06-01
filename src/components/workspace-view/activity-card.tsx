'use client';

import { Archive, Brain, FileText, Folder, Link2, Sparkle, Target, Zap } from "lucide-react";
import { ActivityEvent } from "./acitivity-feed";
import React from "react";

interface ActivityCardProps{
    title: string;
    lastActive: string;
    description: string;
    activeDocuments: number;
    flashcards: number;
    thumbnailUrl?: string;
    collaborators?: {
        name: string;
        image?: string;
        color?: string;
    }[];
}

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
    const iconStyle = {
        width: 40,
        height: 40,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    } as React.CSSProperties;

    const icons: Record<string, { bg: string; icon: React.ComponentType<any> }> = {
        SYNTHESIS_COMPLETED: { bg: "#1e1b4b", icon: Sparkle },
        FLASHCARDS_GENERATED: { bg: "#1e3a2e", icon: Zap },
        FILE_UPDATED: { bg: "#1e293b", icon: FileText },
        FILE_CREATED: { bg: "#1e293b", icon: FileText },
        FILE_ARCHIVED: { bg: "#1f2937", icon: Archive },
        CONNECTION_CREATED: { bg: "#1e2e1b", icon: Link2 },
        FOLDER_CREATED: { bg: "#1e2938", icon: Folder },
        GOAL_UPDATED: { bg: "#2e1b2e", icon: Target },
    };

    const cfg = icons[type] ?? { bg: "#1f2937", icon: FileText };
    const Icon = cfg.icon;
    return (
        <div style={{ 
            ...iconStyle,
            background: cfg.bg,
            fontSize: 18,
        }}>
            <Icon size={14} className="text-gray-300"/>
        </div>
    )
}

export const ActivityCard = ({event}: {event: ActivityEvent }) => {
    const m = event.metadata ?? {};

    const hasStatesMetadata =
        m.fileCount !== undefined ||
        m.cardCount !== undefined ||
        m.nodeCount !== undefined ||
        m.fileId !== undefined;

    return (
        <div className="bg-[#0f172a] border border-[#1e2d45] rounded-2xl p-4 flex flex-col
        justify-between gap-3 w-full min-w-0 transition-all duration-150 hover:border-white/10">
            {/* Top Row: Info and Timestamp */}
            <div className="flex justify-between items-start gap-x-2 w-full">
                <EventIcon type={event.type}/>
                <span className="text-[11px] text-[#4b5563] shrink-0 mt-0.5">
                    {relativeTime(event.createdAt)}
                </span>
            </div>
           
            {/* Description */}
            <p className="m-0 text-[13px] font-medium text-[#e2e2f0] leading-relaxed flex-1 mt-1">
                {event.description}
            </p>

            {/* Stats row */}
            {hasStatesMetadata && (
                <div className="flex items-center gap-x-3 text-[12px] text-gray-500
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
    )
} 
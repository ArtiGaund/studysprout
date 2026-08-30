"use client";

import { useInbox } from "@/hooks/inbox/useInbox";
import { useInboxItems } from "@/hooks/inbox/useInboxItems";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { InboxItem } from "@/types/state.type";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function InboxSidebar(){
      
    const { getInboxItems } = useInbox();
    const { 
        isInboxSidebarOpen,
        setInboxSidebarOpen,
        setInboxCount, 
        inboxVersion,
    } = useRevisionSidebar();

    const { items, loading } = useInboxItems(isInboxSidebarOpen, inboxVersion);
    const router = useRouter();

    // Keep the shared badge count in sync whenever the sidebar's own fetch resolves
    useEffect(() => {
       if(isInboxSidebarOpen && !loading){
        setInboxCount(items.length);
       }
    },[
        isInboxSidebarOpen,
        loading,
        items.length,
        setInboxCount,
    ]);

    const goToInboxPage = () => {
        router.push("/dashboard/inbox");
    }

    if(!isInboxSidebarOpen) return null;

    return (
        <div className="w-64 h-full bg-[#0f0f14] border-r border-white/5 p-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-white font-semibold text-base">Inbox</h2>
                <button
                   onClick={() => setInboxSidebarOpen(false)}
                   className="text-gray-500 hover:text-white text-sm"
                   aria-label="Close inbox"
                >
                    x
                </button>
            </div>
            <p className="text-xs text-gray-500 mb-6">
                {items.length} item{items.length !== 1 ? "s" : ""} to file
            </p>

            {/* Loading state */}
            {loading && <p className="text-gray-500 text-xs">Loading...</p>}

            {/* Empty state */}
            {!loading && items.length === 0 && (
                <p className="text-gray-500 text-xs leading-relaxed">
                    Nothing captured yet. Right-click any text on the web and choose{" "}
                    <span className="text-[#63FF9D]">Save to Studysprout</span>
                </p>
            )}

            {/* List */}
            <ul className="space-y-2 overflow-y-auto flex-1">
                {items.map((item) => (
                    <li
                        key={item._id}
                        onClick={goToInboxPage}
                        className="bg-white/[0.03] border border-white/5 rounded-xl p-3 
                        cursor-pointer hover:bg-white/[0.06] transition-colors group relative"
                    >
                        <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] uppercase tracking-wide text-[#63FF9D]">
                                {item.type}
                            </span>
                           <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                                {item.content}
                           </p>
                           <span className="text-[10px] text-gray-600 mt-1 block">
                                {formatRelativeTime(item.createdAt)}
                           </span>
                        </div>
                    </li>
                ))}
            </ul>

            {items.length > 0 && (
                <button
                    onClick={goToInboxPage}
                    className="mt-4 text-center text-xs text-[#63FF9D] hover:underline"
                >   
                    Open full view
                </button>
            )}
        </div>
    )
}
"use client";

import { useInbox } from "@/hooks/inbox/useInbox";
import { useInboxItems } from "@/hooks/inbox/useInboxItems";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function InboxSidebar(){
      
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
        <div className="w-64 h-full bg-[#0A0507] border-r border-white/10 p-4 flex flex-col
        font-mono text-white select-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                <h2 className="text-white font-bold text-sm uppercase tracking-wider">Inbox</h2>
                <button
                   onClick={() => setInboxSidebarOpen(false)}
                   className="text-neutral-500 hover:text-white p-1 rounded-lg transition-colors"
                   aria-label="Close inbox"
                >
                    x
                </button>
            </div>
            <p className="text-[10px] text-neutral-400 mb-6">
                {items.length} item{items.length !== 1 ? "s" : ""} to file
            </p>

            {/* Loading state */}
            {loading && <p className="text-neutral-500 text-xs">Loading...</p>}

            {/* Empty state */}
            {!loading && items.length === 0 && (
                <p className="text-neutral-500 text-xs leading-relaxed">
                    Nothing captured yet. Right-click any text on the web and choose{" "}
                    <span className="text-purple-400 font-bold">Save to Studysprout</span>
                </p>
            )}

            {/* List */}
            <ul className="space-y-2 overflow-y-auto flex-1 pr-1 custom-insights-scrollbar">
                {items.map((item) => (
                    <li
                        key={item._id}
                        onClick={goToInboxPage}
                        className="bg-[#110A10] border border-white/5 rounded-xl p-3 
                        cursor-pointer hover:border-purple-500/40 hover:bg-white/5 
                        transition-colors group relative"
                    >
                        <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider 
                            text-purple-400">
                                {item.type}
                            </span>
                           <p className="text-neutral-300 text-xs mt-1 line-clamp-2 leading-relaxed">
                                {item.content}
                           </p>
                           <span className="text-[10px] text-neutral-500 mt-1 block">
                                {formatRelativeTime(item.createdAt)}
                           </span>
                        </div>
                    </li>
                ))}
            </ul>

            {items.length > 0 && (
                <button
                    onClick={goToInboxPage}
                    className="mt-4 text-center text-xs font-bold text-purple-400 hover:text-purple-300 
                    hover:underline transition-colors py-2 border-t border-white/10"
                >   
                    Open full view
                </button>
            )}
        </div>
    )
}
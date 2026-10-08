"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ActivityCard } from "./activity-card";
import { useWorkspaceActivity } from "@/hooks/useWorkspaceActivity";

interface RecentActivityProps{
    workspaceId: string;
}

export const RecentActivity = ({
    workspaceId
}: RecentActivityProps) => {
    const router = useRouter();
    const { 
        getRecentActivity,
        events,
        loading 
    } = useWorkspaceActivity(workspaceId);

    useEffect(() => {
        getRecentActivity(4);
    },[workspaceId]);

    return (
        <div className="flex flex-col text-zinc-100 w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="m-0 text-sm font-mono text-zinc-100">
                    Recent Activity
                </h2>
                {events.length !== 0 && <button
                    onClick={() => router.push(`/dashboard/${workspaceId}/activity`)}
                    className={`bg-transparent border-none text-purple-400 hover:text-purple-300 
                    cursor-pointer transition-colors text-xs font-mono p-0`}
                >
                    View All Activity
                </button>}
            </div>

            {/* Cards row */}
            {loading ? (
                <div className="text-zinc-500 text-xs font-mono py-4">
                    Loading activity...
                </div>
            ) : events.length === 0 ? (
                <div className="bg-[#110A10] border border-white/10 rounded-xl py-8 px-6 
                text-center text-zinc-500 text-xs font-mono">
                    No activity yet. Start editing files or reviewing flashcards!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 w-full 
                items-stretch">
                    {events.map((event) => (
                        <div key={event._id} className="flex min-w-0 h-full">
                            <ActivityCard event={event}/>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


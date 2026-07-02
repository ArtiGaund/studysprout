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
        <div className="text-[#e2e2f0]">
            <div className="flex justify-between items-center mb-[16px]">
                <h2 className="m-0 text-base font-semibold">
                    Recent Activity
                </h2>
                {events.length !== 0 && <button
                    onClick={() => router.push(`/dashboard/${workspaceId}/activity`)}
                    className={`bg-transparent border-none text-[#7c3aed] cursor-pointer 
                    text-[13px] font-[500px] p-0`}
                >
                    View All Activity
                </button>}
            </div>

            {/* Cards row */}
            {loading ? (
                <div className="text-[#4b5563] text-[13px]">
                    Loading...
                </div>
            ) : events.length === 0 ? (
                <div className="bg-[#0f172a] rounded-[10px] py-8 px-6 text-center text-gray-600
                text-[13px]">
                    No activity yet. Start editing files or reviewing flashcards!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 w-full items-stretch">
                    {events.map((event) => (
                        <div key={event._id} className="flex min-w-0 h-full">
                            <ActivityCard event={event}/>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}


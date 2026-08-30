'use client';

import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import TooltipComponent from "../global/tooltip-component";
import CypressInboxIcon from "../icons/CypressInboxIcon";

export default function InboxButton(){
    const { 
        isRevisionSidebarOpen, 
        setInboxSidebarOpen,
        isInboxSidebarOpen, 
        inboxCount,
    } = useRevisionSidebar();

    const isCollapsed = isRevisionSidebarOpen || isInboxSidebarOpen;

    const badge = inboxCount > 0 && (
        <span className="ml-auto bg-[#63FF9D] text-black text-[10px] font-bold rounded-full
        min-w-[16px] h-4 px-1 flex items-center justify-center">
            { inboxCount > 99 ? "99+" : inboxCount }
        </span>
    )

    return(
        <button onClick={() => setInboxSidebarOpen(true)}>
            <div className="flex flex-row gap-2 text-Neutrals/neutrals-7 transition-all cursor-pointer">
                {isCollapsed ? (
                    <TooltipComponent message="Inbox">
                        <span className="relative inline-flex">
                            <CypressInboxIcon />
                            {inboxCount > 0 && (
                                <span className="absolute -top-1 -right-1  bg-[#63FF9D] 
                                text-black text-[9px] font-bold rounded-full
                                min-w-[14px] h-3.5 px-0.5 flex items-center justify-center">
                                    {inboxCount > 9 ? "9+" : inboxCount}
                                </span>
                            )}
                        </span>
                    </TooltipComponent>
                ) : (
                    <>
                        <CypressInboxIcon />
                        <span>Inbox</span>
                        {badge}
                    </>
                )}
            </div>
        </button>
    );
}
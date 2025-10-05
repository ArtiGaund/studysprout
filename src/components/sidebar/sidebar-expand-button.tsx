'use client';

import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import TooltipComponent from "../global/tooltip-component";

const SidebarExpandButton = () => {
    const { isRevisionSidebarOpen, setRevisionSidebarOpen} = useRevisionSidebar();
    return(
        <>
       { isRevisionSidebarOpen && (   
        <TooltipComponent message="Open Sidebar">
            <button
            onClick={() => setRevisionSidebarOpen(false)}
            className="p-2 flex flex-col items-center justify-center space-y-1 hover:bg-gray-800 rounded-md transition"
            >
                    <span className="block w-6 h-0.5 bg-gray-200"></span>
                    <span className="block w-6 h-0.5 bg-gray-200"></span>
                    <span className="block w-6 h-0.5 bg-gray-200"></span>
            </button>
            </TooltipComponent>
            )}
       </>
    )
}

export default SidebarExpandButton;
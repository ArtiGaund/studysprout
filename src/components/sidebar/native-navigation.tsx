"use client"
import Link from "next/link";
import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import CypressHomeIcon from "../icons/CypressHomeIcon";
import CypressTrashIcon from "../icons/CypressTrashIcon";
import Trash from "../trash/trash";
import RevisionButton from "../revision/revision-button";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import TooltipComponent from "../global/tooltip-component";
import { GlobalSearch } from "../global-search/global-search";
import { usePathname, useRouter } from "next/navigation";
import InboxButton from "../inbox/inbox-button";

interface NativeNavigationProps{
    myWorkspaceId: string;
    className?: string;
}
const NativeNavigation: React.FC<NativeNavigationProps> = ({
    myWorkspaceId,
    className
}) => {
    const { isRevisionSidebarOpen, isInboxSidebarOpen } = useRevisionSidebar();
    const isPannelOpen = isRevisionSidebarOpen || isInboxSidebarOpen;
    const router = useRouter();
    const pathname = usePathname();

    const [ isSearchOpen, setIsSearchOpen ] = useState(false);
    const [ isTrashOpen, setIsTrashOpen ] = useState(false);

    const getNavItemClass = (isActive: boolean) => {
        return twMerge(
            `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-mono font-medium text-xs
             transition-all duration-150 cursor-pointer group w-full select-none`,
            isActive 
                ? "text-[#C9A227] bg-white/[0.06]" 
                : "text-zinc-400 hover:text-[#F5F0EB] hover:bg-white/[0.04]"
        );
    }

    const isWorkspaceActive = pathname === `/dashboard/${myWorkspaceId}`;

    return(
        <nav className={twMerge('my-2',className)}>
            <ul className={`flex flex-col gap-2 
                ${isPannelOpen && 'justify-center items-center gap-4'}`}>
                <li className={getNavItemClass(isSearchOpen)}>
                    {isPannelOpen ? (
                        <TooltipComponent message="Search">
                            <GlobalSearch 
                                isOpen={isSearchOpen}
                                onOpenChange={setIsSearchOpen}
                                onNavigateToWorkspace={(id) => router.push(`/dashboard/${id}`)}
                                onNavigateToFolder={(wsId, folderId) => 
                                    router.push(`/dashboard/${wsId}/${folderId}`)}
                                onNavigateToFile={(wsId, folderId, fileId) => 
                                    router.push(`/dashboard/${wsId}/${folderId}/${fileId}`)}
                            />
                        </TooltipComponent>
                    ): (
                        <GlobalSearch 
                            isOpen={isSearchOpen}
                            onOpenChange={setIsSearchOpen}
                            onNavigateToWorkspace={(id) => router.push(`/dashboard/${id}`)}
                            onNavigateToFolder={(wsId, folderId) => 
                                router.push(`/dashboard/${wsId}/${folderId}`)}
                            onNavigateToFile={(wsId, folderId, fileId) => 
                                router.push(`/dashboard/${wsId}/${folderId}/${fileId}`)}
                        />
                    )}
                </li>
                <li>
                    <Link 
                        className={getNavItemClass(isWorkspaceActive)} 
                        href={`/dashboard/${myWorkspaceId}`}
                    >        
                        {isPannelOpen ?
                        (
                            <TooltipComponent message="My Workspace">
                                <CypressHomeIcon />
                            </TooltipComponent>
                        ) : (
                            <>
                                <CypressHomeIcon />
                                <span>My Workspace</span>
                            </>
                        )}
                    </Link>
                </li>
                <Trash isOpen={isTrashOpen} onOpenChange={setIsTrashOpen}>
                    <li className={getNavItemClass(isTrashOpen)}>                            
                        {isPannelOpen ? 
                            ( 
                                <TooltipComponent message="Trash">
                                    <CypressTrashIcon />
                                </TooltipComponent>
                           ) : (
                             <>
                                <CypressTrashIcon />
                                <span>Trash</span>
                            </>
                           )
                        }
                    </li>
                </Trash>
                <li className={getNavItemClass(isRevisionSidebarOpen)}>
                    <RevisionButton />
                </li>
                <li className={getNavItemClass(isInboxSidebarOpen)}>
                    <InboxButton />
                </li>
            </ul>
        </nav>
    )
}

export default NativeNavigation
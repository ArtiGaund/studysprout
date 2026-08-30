"use client"
import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";
import CypressHomeIcon from "../icons/CypressHomeIcon";
import CypressTrashIcon from "../icons/CypressTrashIcon";
import Trash from "../trash/trash";
import RevisionButton from "../revision/revision-button";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import TooltipComponent from "../global/tooltip-component";
import { GlobalSearch } from "../global-search/global-search";
import { useRouter } from "next/navigation";
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
    return(
        <nav className={twMerge('my-2',className)}>
            <ul className={`flex flex-col gap-2 ${isPannelOpen && 'justify-center items-center gap-4'}`}>
                    <li 
                    className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2 cursor-pointer"
                    >
                        {isPannelOpen ? (
                            <>
                                <TooltipComponent message="Search">
                                    <GlobalSearch 
                                        onNavigateToWorkspace={(id) => 
                                            router.push(`/dashboard/${id}`)}
                                        onNavigateToFolder={(wsId, folderId) => 
                                            router.push(`/dashboard/${wsId}/${folderId}`)}
                                        onNavigateToFile={(wsId, folderId, fileId) => 
                                            router.push(`/dashboard/${wsId}/${folderId}/${fileId}`)}
                                    />
                                </TooltipComponent>
                            </>
                        ): (
                            <>
                                 <GlobalSearch 
                                    onNavigateToWorkspace={(id) => 
                                        router.push(`/dashboard/${id}`)}
                                    onNavigateToFolder={(wsId, folderId) => 
                                        router.push(`/dashboard/${wsId}/${folderId}`)}
                                    onNavigateToFile={(wsId, folderId, fileId) => 
                                        router.push(`/dashboard/${wsId}/${folderId}/${fileId}`)}
                                />
                            </>
                        )}
                    </li>
                <li>
                    <Link 
                    className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2"
                    href={`/dashboard/${myWorkspaceId}`}
                    >
                        
                        {isPannelOpen ?
                         (
                            <>
                                <TooltipComponent message="My Workspace">
                                    <CypressHomeIcon />
                                </TooltipComponent>
                            </>
                         ) 
                        : (
                            <>
                                <CypressHomeIcon />
                                <span>My Workspace</span>
                            </>
                        )}
                    </Link>
                </li>
                    <Trash>
                        <li 
                        className="flex group/native text-Neutrals/neutrals-7 transition-all 
                        gap-2 cursor-pointer"
                        >
                            
                           {isPannelOpen ? 
                           ( 
                            <>
                                <TooltipComponent message="Trash">
                                    <CypressTrashIcon />
                                </TooltipComponent>
                            </>
                           )
                           :(
                            <>
                                <CypressTrashIcon />
                                <span>Trash</span>
                            </>
                           )
                        }
                        </li>
                    </Trash>
                    <li  className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2">
                        <RevisionButton />
                    </li>
                    <li className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2">
                        <InboxButton />
                    </li>
            </ul>
        </nav>
    )
}

export default NativeNavigation
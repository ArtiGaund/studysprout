"use client"
import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";
import CypressHomeIcon from "../icons/CypressHomeIcon";
import CypressTrashIcon from "../icons/CypressTrashIcon";
import Trash from "../trash/trash";
import Search from "../search/search";
import CypressSearchIcon from "../icons/CypressSearchIcon";
import RevisionButton from "../revision/revision-button";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import TooltipComponent from "../global/tooltip-component";


interface NativeNavigationProps{
    myWorkspaceId: string;
    className?: string;
}
const NativeNavigation: React.FC<NativeNavigationProps> = ({
    myWorkspaceId,
    className
}) => {
    const { isRevisionSidebarOpen } = useRevisionSidebar();
    return(
        <nav className={twMerge('my-2',className)}>
            <ul className={`flex flex-col gap-2 ${isRevisionSidebarOpen && 'justify-center items-center gap-4'}`}>
                {/* <Search> */}
                    <li 
                    className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2 cursor-pointer"
                    >
                        {isRevisionSidebarOpen ? (
                            <>
                                <TooltipComponent message="Search">
                                    <CypressSearchIcon />
                                </TooltipComponent>
                            </>
                        ): (
                            <>
                                <CypressSearchIcon />
                                <span>Search</span>
                            </>
                        )}
                    </li>
                {/* </Search> */}
                <li>
                    <Link 
                    className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2"
                    href={`/dashboard/${myWorkspaceId}`}
                    >
                        
                        {isRevisionSidebarOpen ?
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
                        className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2"
                        >
                            
                           {isRevisionSidebarOpen ? 
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
            </ul>
        </nav>
    )
}

export default NativeNavigation
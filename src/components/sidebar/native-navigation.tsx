"use client"
import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";
import CypressHomeIcon from "../icons/CypressHomeIcon";
import CypressTrashIcon from "../icons/CypressTrashIcon";
// import Settings from "../settings/settings";
import Trash from "../trash/trash";


interface NativeNavigationProps{
    myWorkspaceId: string;
    className?: string;
}
const NativeNavigation: React.FC<NativeNavigationProps> = ({
    myWorkspaceId,
    className
}) => {
    return(
        <nav className={twMerge('my-2',className)}>
            <ul className="flex flex-col gap-2">
                <li>
                    <Link 
                    className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2"
                    href={`/dashboard/${myWorkspaceId}`}
                    >
                        <CypressHomeIcon />
                        <span>My Workspace</span>
                    </Link>
                </li>
                    <Trash>
                        <li 
                        className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2"
                        >
                            <CypressTrashIcon />
                            <span>Trash</span>
                        </li>
                    </Trash>
            
                    
            </ul>
        </nav>
    )
}

export default NativeNavigation
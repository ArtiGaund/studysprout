"use client"
import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";
import CypressHomeIcon from "../icons/CypressHomeIcon";
import CypressTrashIcon from "../icons/CypressTrashIcon";
import Trash from "../trash/trash";
import Search from "../search/search";
import CypressSearchIcon from "../icons/CypressSearchIcon";


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
                {/* <Search> */}
                    <li 
                    className="flex group/native text-Neutrals/neutrals-7 transition-all gap-2 cursor-pointer"
                    >
                        {/* <CypressSettingsIcon /> */}
                        <CypressSearchIcon />
                        <span>Search</span>
                    </li>
                {/* </Search> */}
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
/**
 * @component SelectedWorkspaces
 * @description A specialized navigation component representing an individual workspace entry.
 * Primarily used within workspace switchers or sidebar lists.
 * * Key Technical Features:
 * - Async Asset Resolution: Fetches signed or private image URLs from an internal API based on image IDs.
 * - Robust Fallbacks: Implements a character-based avatar (Initial of Workspace Title) if no logo exists.
 * - UX/UI Polish: Uses Next.js `Link` for client-side routing, `next/image` for optimization, 
 * and CSS ellipsis for long workspace titles.
 */
"use client"

import { ReduxWorkSpace } from "@/types/state.type";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface SelectedWorkspacesProps {
    workspace: ReduxWorkSpace;
    onClick?: (option: ReduxWorkSpace) => void;
}
const SelectedWorkspaces: React.FC<SelectedWorkspacesProps> = ({ workspace, onClick }) => {
    const [ workspaceLogo, setWorkspaceLogo ] = useState('')

    /**
     * @effect FetchWorkspaceLogo
     * Logic to resolve the image path. Since logos are stored as IDs/Keys, 
     * we query the internal API to get a temporary or public URL for the Next.js Image component.
     */
    useEffect(() => {
        if(workspace.logo){
            const fetchWorkspaceLogoPath = async() => {
                const imageId = workspace.logo
                const response = await axios.get(`/api/get-image?imageId=${imageId}`)
                const imageUrl = response.data.data
                if(imageUrl){
                    setWorkspaceLogo(imageUrl)
                } 
            }
            fetchWorkspaceLogoPath()
        }
    }, [workspace.logo])
    return(
        <Link href={`/dashboard/${workspace._id}`}
         onClick={() => {
            if(onClick) 
                onClick(workspace)
            }}
            className="flex rounded-md hover:bg-muted transition-all flex-row p-2 gap-2 
            justify-start cursor-pointer items-center my-1 group/item overflow-hidden"
            >
                {/* --- WORKSPACE ICON SECTION --- */}
                { workspaceLogo ? (
                    <div className="relative w-[26px] h-[26px] flex-shrink-0 rounded-full overflow-hidden">
                        <Image 
                        src={workspaceLogo}
                        alt="workspace logo"
                        width="26" 
                        height="26" 
                        objectFit="cover" 
                        priority={true}
                        style={{ objectFit: 'cover'}}
                        className="rounded-full"
                        />
                      </div>
                ): (
                    /* Fallback UI: Renders the first letter of the workspace title */
                    <div className="w-[26px] h-[26px] flex-shrink-0 items-center justify-center bg-gray-200
                     text-gray-700 rounded-full text-sm font-bold">
                        {workspace.title?.toUpperCase() || 'W'}
                    </div>
                )}

                {/* --- WORKSPACE INFO SECTION --- */}
                <div className="flex flex-col flex-grow min-w-0">
                    <p className="text-lg w-[170px] overflow-hidden
                     whitespace-nowrap text-white text-ellipsis">
                        {workspace.title}
                    </p>
                </div>
        </Link>
    )
}

export default SelectedWorkspaces
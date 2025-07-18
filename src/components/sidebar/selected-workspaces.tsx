"use client"
import ImageModel from "@/model/image.model";
import  { WorkSpace } from "@/model/workspace.model";
import { WorkSpaceModel } from "@/model/index";
import axios from "axios";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface SelectedWorkspacesProps {
    workspace: WorkSpace;
    onClick?: (option: WorkSpace) => void;
}
const SelectedWorkspaces: React.FC<SelectedWorkspacesProps> = ({ workspace, onClick }) => {
    const {data: session} = useSession()
    const [ workspaceLogo, setWorkspaceLogo ] = useState('')

    // console.log("Workspace in selected workspaces ",workspace)
    // console.log("Workspace logo in selected workspace ",workspace.logo)

    useEffect(() => {
        if(workspace.logo){
            const fetchWorkspaceLogoPath = async() => {
                const imageId = workspace.logo
                const response = await axios.get(`/api/get-image?imageId=${imageId}`)
                // console.log("Response of selected workspace ",response.data)
                const imageUrl = response.data.data
                console.log("public id for image ",imageUrl)
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
                    <div className="w-[26px] h-[26px] flex-shrink-0 items-center justify-center bg-gray-200
                     text-gray-700 rounded-full text-sm font-bold">
                        {workspace.title?.toUpperCase() || 'W'}
                    </div>
                )}
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
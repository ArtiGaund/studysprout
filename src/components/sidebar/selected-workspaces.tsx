"use client"
import ImageModel from "@/model/image.model";
import WorkSpaceModel, { WorkSpace } from "@/model/workspace.model";
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
    }, [])
    return(
        <Link href={`/dashboard/${workspace._id}`}
         onClick={() => {
            if(onClick) 
                onClick(workspace)
            }}
            className="flex rounded-md hover:bg-muted transition-all flex-row p-2 gap-4 
            justify-center cursor-pointer items-center my-2"
            >
                <Image src={`${workspaceLogo}`} alt="workspace logo" width="26" height="26" objectFit="cover"/>
                <div className="flex flex-col">
                    <p className="text-lg w-[170px] overflow-hidden overflow-ellipsis whitespace-nowrap text-white">
                        {workspace.workspaceName}
                    </p>
                </div>
        </Link>
    )
}

export default SelectedWorkspaces
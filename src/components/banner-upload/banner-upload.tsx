"use client"
import { File } from "@/model/file.model";
import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import React from "react"
import CustomDialogTrigger from "../global/custom-dialog";
import BannerUploadForm from "./banner-upload-form";

interface BannerUploadProps{
    children: React.ReactNode;
    className?: string;
    details: WorkSpace | Folder | File;
    dirType: 'workspace' | 'folder' | 'file';
    id: string;
}

const BannerUpload: React.FC<BannerUploadProps> = ({
    children,
    className,
    details,
    dirType,
    id
}) => {
    return(
       <CustomDialogTrigger 
       header="Upload Banner"
       content={<BannerUploadForm 
       details={details}
       dirType={dirType}
       id={id}
       ></BannerUploadForm>}
       className={className}
       >
        {children}
       </CustomDialogTrigger>
    )
}

export default BannerUpload
"use client"
import React, { useState } from "react"
import CustomDialogTrigger from "../global/custom-dialog";
import BannerUploadForm from "./banner-upload-form";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { useDir } from "@/hooks/useDir";

interface BannerUploadProps{
    children: React.ReactNode;
    className?: string;
    details: ReduxWorkSpace | ReduxFolder | ReduxFile;
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
    const [ isOpen, setIsOpen ] = useState(false);
    const { handleBannerUpload, isSaving} = useDir({
        dirType,
        dirId: id,
    })

    const handleUploadComplete = async (file: File) => {
        await handleBannerUpload(file);
        setIsOpen(false);
    }
    return(
       <CustomDialogTrigger 
       header="Upload Banner"
       content={<BannerUploadForm
                    onUpload={handleUploadComplete}
                    isUploading={isSaving} // Pass isSaving from useDir as isUploading
                />}
       className={className}
       >
        {children}
       </CustomDialogTrigger>
    )
}

export default BannerUpload
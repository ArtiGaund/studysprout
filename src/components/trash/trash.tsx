"use client"
import React from "react";
import CustomDialogTrigger from "../global/custom-dialog";
import TrashRestore from "./trash-restore";

interface TrashProps{
    children: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const Trash: React.FC<TrashProps> = ({ children, isOpen, onOpenChange }) => {
    return(
       <CustomDialogTrigger
            header="Trash" 
            content={<TrashRestore />}
            { ...(isOpen !== undefined && { open: isOpen })}
            { ...(onOpenChange !== undefined && { onOpenChange })}
            className="font-mono"
        >
            {children}
       </CustomDialogTrigger>
    )
}

export default Trash
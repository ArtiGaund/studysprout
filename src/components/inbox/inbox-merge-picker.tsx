"use client";

import { useCallback, useState } from "react";
import { Dialog, DialogTrigger } from "../ui/dialog";
import InboxMergeHierarchyList from "./inbox-merge-hierarchy-list";

interface InboxMergePickerProps{
    children: React.ReactNode;
    onConfirm: (fileId: string, fileTitle: string) => void;
}

const InboxMergePicker: React.FC<InboxMergePickerProps> = ({
    children,
    onConfirm,
}) => {
    const [ isOpen, setIsOpen ] = useState(false);

    const handleConfirm = useCallback((fileId: string, fileTitle: string) => {
        onConfirm(fileId, fileTitle);
        setIsOpen(false);
    },[onConfirm]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="cursor-pointer">{children}</div>
            </DialogTrigger>
            <InboxMergeHierarchyList onConfirm={handleConfirm}/>
        </Dialog>
    );
}

export default InboxMergePicker;
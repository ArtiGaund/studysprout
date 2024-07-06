"use client"
import { File } from "@/model/file.model";
import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import { RootState } from "@/store/store";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";


interface TextEditorProps{
    dirDetails: WorkSpace | Folder | File;
    fileId: string;
    dirType: "workspace" | "folder" | "file";

}
const TextEditor: React.FC<TextEditorProps> = ({
    dirDetails,
    fileId,
    dirType
}) => {
    const state = useSelector((state: RootState) => state.workspace)
    const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace?._id)
    const folderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    const dispatch = useDispatch()

    const wrapperRef = useCallback((wrapper) => {
        
    }, [])

    return(
        <>
            <div 
            id="container" 
            ref={wrapperRef}
            className="max-w-[800]"
            >

            </div>
        </>
    )
}

export default TextEditor
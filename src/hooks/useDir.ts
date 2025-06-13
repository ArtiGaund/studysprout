"use client";

import { useToast } from "@/components/ui/use-toast";
import { RootState } from "@/store/store";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

type DirType = "workspace" | "folder" | "file";

export function useDir(
    dirType: DirType,
    dirId: string,
    workspaceId?: string,
    folderId?: string,
    fileId?: string
){
    const dispatch = useDispatch();
    const { toast } = useToast();

    const state = useSelector((state: RootState) => state);
    const dirDetails = useMemo(() => {
        if(dirType === "workspace")
            return state.workspace.workspaces.find(workspace => workspace._id === dirId);
        if(dirType === "folder")
            return state.folder.folders.find(folder => folder._id === dirId);
        if(dirType === "file")
            return state.file.files.find(file => file._id === dirId);
    },[ state, dirType, dirId]);

    
}
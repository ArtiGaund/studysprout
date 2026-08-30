"use client";

import DashboardShell from "@/components/dashboard-shared/dashboard-shell";
import { useFile } from "@/hooks/useFile";
import { useFolder } from "@/hooks/useFolder";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getLastWorkspace } from "@/lib/local-storage-workspace";
import { selectUserId } from "@/store/selectors/userSelector";
import { selectCurrentWorkspace, selectWorkspaces } from "@/store/selectors/workspaceSelector";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface InboxLayoutProps{
    children: React.ReactNode;
}

const InboxLayout: React.FC<InboxLayoutProps> = ({ children }) => {
    const userId = useSelector(selectUserId);
    const workspaces = useSelector(selectWorkspaces);
    const currentWorkspace = useSelector(selectCurrentWorkspace);

    const { getWorkspaces, fetchCurrentWorkspace } = useWorkspace();
    const { getFolders } = useFolder();
    const { getWorkspaceFiles } = useFile();

    const [ resolvedWorkspaceId, setResolvedWorkspaceId ] = useState<string | null>(null);

    useEffect(() => {
        if(!userId) return;
        if(workspaces.length > 0) return;
        getWorkspaces();
    },[ userId, workspaces.length, getWorkspaces ]);

    useEffect(() => {
        if(!userId || workspaces.length === 0) return;

        const lastWorkspaceId = getLastWorkspace(userId);
        const stillExists = lastWorkspaceId && workspaces.some((ws) => ws._id === lastWorkspaceId);

        setResolvedWorkspaceId(stillExists ? lastWorkspaceId : workspaces[0]._id);
    },[ userId, workspaces ]);

    useEffect(() => {
        if(!resolvedWorkspaceId) return;
        if(currentWorkspace?._id === resolvedWorkspaceId) return;

        fetchCurrentWorkspace(resolvedWorkspaceId, true);
        getFolders(resolvedWorkspaceId);
        getWorkspaceFiles(resolvedWorkspaceId);
    },[
        resolvedWorkspaceId,
        currentWorkspace?._id,
    ]);

    useEffect(() => {
        if(workspaces.length === 0) return;

        workspaces.forEach((ws) => {
            getFolders(ws._id, true);
            getWorkspaceFiles(ws._id, true);
        });
    },[workspaces]);

    if(!resolvedWorkspaceId){
        return (
            <div className="flex items-center justify-center h-screen w-screen">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500"/>
            </div>
        )
    }
    return (
        <DashboardShell workspaceId={resolvedWorkspaceId}>
            {children}
        </DashboardShell>
    );
}

export default InboxLayout;
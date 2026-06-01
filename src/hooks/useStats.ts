"use client";

import { 
    FolderStats, 
    getFolderStatsService, 
    getWorkspaceStatsService, 
    WorkspaceStats 
} from "@/services/statsService";
import { selectCurrentFolder } from "@/store/selectors/folderSelector";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { MARK_FOLDER_STATS_FRESH } from "@/store/slices/folderSlice";
import { MARK_STATS_FRESH } from "@/store/slices/workspaceSlice";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useFolderStats(folderId: string | undefined){
    const dispatch = useDispatch();
    const currentFolder = useSelector(selectCurrentFolder);
    const readingTimeMinutes = currentFolder?.readingTimeMinutes;
    const statsStale = useSelector((state: RootState) => state.folder.statsStale);
    
    const [ stats, setStats ] = useState<FolderStats | null>(null);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);


    useEffect(() => {
        if(!folderId) return;
        let cancelled = false;

        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getFolderStatsService(folderId);
                if(cancelled) return;
                if(result.success && result.data){
                    dispatch(MARK_FOLDER_STATS_FRESH());
                    setStats(result.data);
                }else{
                    setError(result.message ?? "Failed to load folder stats");
                }
            } catch (error: any) {
                if(!cancelled) setError("Unexpected error");
                console.error("[useFolderStats] Failed: ",error.message);
            }finally{
                if(!cancelled) setLoading(false);
            }
        }

        fetch();
        return () => {
            cancelled = true;
        }
    },[
        folderId,
        dispatch,
        statsStale,
    ])

    return {
        readingTimeMinutes: readingTimeMinutes ?? stats?.readingTimeMinutes ?? 0,
        readingTimeHours: parseFloat(((readingTimeMinutes ?? 0) / 60).toFixed(1)),
        stats,
        loading,
        error,
    }
}

export function useWorkspaceStats(workspaceId: string | undefined){
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const readingTimeMinutes = currentWorkspace?.readingTimeMinutes;

    const statsStale = useSelector((state: RootState) => state.workspace.statsStale);

    const [stats, setStats] = useState<WorkspaceStats | null>(null);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);
    const dispatch = useDispatch();

    useEffect(() => {
        if(!workspaceId) return;
        let cancelled = false;

        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getWorkspaceStatsService(workspaceId);
                if(cancelled) return;
                if(result.success && result.data){
                    setStats(result.data);
                    dispatch(MARK_STATS_FRESH());
                }else{
                    setError(result.message ?? "Failed to load workspace stats");
                }
            } catch (error: any) {
                if(!cancelled) setError("Unexpected error");
                console.error("[useWorkspaceStats] Failed: ",error.message);
            }finally{
                if(!cancelled) setLoading(false);
            }
        }

        fetch();
        return () => {
            cancelled = true;
        }
    },[
        workspaceId,
        dispatch,
        statsStale,
    ])

    const minutes = readingTimeMinutes ?? stats?.readingTimeMinutes ?? 0;
    return {
        readingTimeMinutes: minutes,
        readingTimeHours: parseFloat(((readingTimeMinutes ?? 0) / 60).toFixed(1)),
        stats,
        loading,
        error,
    }
}
"use client";

import { getLastStudiedService, updateLastStudiedService } from "@/services/lastStudiedService";
import { selectLastStudied } from "@/store/selectors/lastStudiedSelector";
import { setLastStudied } from "@/store/slices/lastStudiedSlice";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useLastStudied(){
    const dispatch = useDispatch();
    const lastStudied = useSelector(selectLastStudied);
    const [ loading, setLoading ] = useState(false);

    const fetchLastStudied = useCallback(async() => {
        setLoading(true);
        try {
            const response = await getLastStudiedService();
            if(response.success){
                dispatch(setLastStudied(response.data.lastStudied));
            }
        } catch (error: any) {
            console.error("[useLastStudied] fetchLastStudied failed: ",error.message);
        }finally{
            setLoading(false);
        }
    },[dispatch]);

    const updateLastStudied = useCallback(async(
        payload: {
            setId: string;
            setTitle: string;
            cardIndex: number;
            totalCards: number;
            resourceType: "Workspace" | "Folder" | "File";
            workspaceId: string;
            folderId?: string;
        }
    ) => {
        dispatch(setLastStudied({
            ...payload,
            studiedAt: new Date().toISOString(),
        }));
        await updateLastStudiedService(payload);
    },[dispatch]);

    return {
        lastStudied,
        lastStudiedLoading: loading,
        fetchLastStudied,
        updateLastStudied,
    }
}
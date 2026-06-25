import { getFlashcardUsageService } from "@/services/flashcardSetServices";
import { useCallback, useEffect, useState } from "react";

export interface FlashcardUsage {
    used: number;
    limit: number;
    resetAt: string;
};

export function useFlashcardUsage(workspaceId: string | undefined){
    const [ usage, setUsage ] = useState<FlashcardUsage | null>(null);
    const [ loadingUsage, setLoadingUsage ] = useState(false);

    const fetchUsage = useCallback(async () => {
        if(!workspaceId) return;
        setLoadingUsage(true);
        try {
            const result = await getFlashcardUsageService(workspaceId);
            if(result){
                setUsage(result.data ?? result);
            }
        } catch (error) {
            console.error("[useFlashcardUsage] fetchUsage Failed: ",error);
        }finally{
            setLoadingUsage(false);
        }
    },[workspaceId]);

    useEffect(() => {
        fetchUsage();
    },[fetchUsage]);

    const refreshUsage = fetchUsage;

    const isAtLimit = usage ? usage.used >= usage.limit : false;

    return {
        usage,
        loadingUsage,
        refreshUsage,
        isAtLimit,
    };
}
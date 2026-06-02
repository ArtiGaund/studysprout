/**
 * @hook useClickDifferentiator
 * @description Intercepts rapid user mouse interactions to explicitly separate single click
 * execution tracks from double click triggers, preventing event collisions.
 */

import { useCallback, useRef } from "react";

interface UseClickDifferentiatorProps{
    onSingleClickAction: () => void;
    onDoubleClickAction: () => void;
    clickDelayMs?: number;
}

export const useClickDifferentiator = ({
    onSingleClickAction,
    onDoubleClickAction,
    clickDelayMs = 300,
}: UseClickDifferentiatorProps) => {
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const consecutiveClicksTracker = useRef<number>(0);

    const handleMouseClickInterception = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        consecutiveClicksTracker.current += 1;

        if(consecutiveClicksTracker.current === 1){
            //Open a timing safety window to watch for a second incoming click
            clickTimeoutRef.current = setTimeout(() => {
                if(consecutiveClicksTracker.current === 1){
                    onSingleClickAction();
                } 
                consecutiveClicksTracker.current = 0;
                clickTimeoutRef.current = null;
            }, clickDelayMs); 
        }else if(consecutiveClicksTracker.current === 2){
            // A second click has arrived before the delay closed-abort the single click track
            if(clickTimeoutRef.current){
                clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = null;
            }
            consecutiveClicksTracker.current = 0;
            onDoubleClickAction();
        }
    },[
        onSingleClickAction,
        onDoubleClickAction,
        clickDelayMs,
    ]);

    return {
        handleMouseClickInterception
    }
}
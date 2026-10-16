/**
 * @component ProgressBar
 * @description A specialized progress visualization component designed for the StudySprout flashcard system.
 * It supports a "polymorphic" visual state to distinguish between the user's primary progress and 
 * background/other user activities.
 * * * Features:
 * - Dynamic Styling: Uses `twMerge` to swap between "Primary" (Purple) and "Secondary" (Gray) themes.
 * - Fluid Animations: Implements `transition-all duration-500` for smooth width updates.
 * - Robust Defaults: Uses nullish coalescing (`?? 0`) to prevent UI breakage if data is missing.
 * - Optional Interactivity: Includes an optional `onMinimize` callback for collapsible dashboard layouts.
 */
'use client';

import { twMerge } from "tailwind-merge";

interface ProgressBarProps{
    title: string;
    currentProgress: number; // Percentage value (0-100)
    currentCount: number;    // Absolute number of cards completed
    totalCards: number;      // Total size of the set
    others?: boolean;        // If true, applies a muted/de-emphasized "background activity" style
    onMinimize?: () => void  // Optional callback for UI state management
}

export const ProgressBar = ({
    title,
    currentProgress,
    currentCount,
    totalCards,
    others,
    onMinimize,
}: ProgressBarProps) => {
    return (
         <div className={twMerge(
            "flex flex-col w-full gap-2 p-3 px-4 border rounded-xl mb-4 transition-all font-mono",
            // Conditional logic for theme switching
            others 
            ? "bg-[#110A10] border-white/5 opacity-80"
            : "bg-purple-950/20 border-purple-500/20"
         )}>
            <div className="flex justify-between items-center">
                <span className={twMerge(
                    "text-[10px] font-semibold uppercase tracking-wider truncate pr-2",
                    others
                    ? "text-neutral-400"
                    : "text-purple-300"
                )}>
                    {title}
                </span>

                {/* Conditional rendering of control elements */}
               {onMinimize && ( <button
                onClick={onMinimize}
                className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
                >   
                Minimize
                </button>)}
            </div>

            {/* Progress Track */}
            <div className="w-full bg-[#0A0507] h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                className={twMerge(
                    "h-full transition-all duration-500 rounded-full",
                    others
                    ? "bg-neutral-500"
                    : "bg-purple-500"
                )}
                style={{ width: `${currentProgress ?? 0}%`}}
                />
                </div>
                {/* Quantitative Metadata */}
                <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>{currentCount ?? 0} / {totalCards ?? 0}</span>
                    <span>{currentProgress}%</span>
                </div>
        </div>
    )
}
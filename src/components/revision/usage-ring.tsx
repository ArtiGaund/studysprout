"use client";

import { FlashcardUsage } from "@/hooks/flashcard/useFlashcardUsage";

interface UsageRingProps{
    usage: FlashcardUsage;
    isAtLimit: boolean;
}

export const UsageRing = ({ usage, isAtLimit }: UsageRingProps) => {
    const percent = usage.limit > 0
        ? Math.min((usage.used /usage.limit) * 100, 100)
        : 0;
    
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashOffset = circumference - (percent / 100) * circumference;

    const color = isAtLimit
        ? "#ef4444"
        : usage.used >= usage.limit - 1
            ? "#eab308"
            : "#a855f7";

    const resetData = new Date(usage.resetAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    return (
        <div className="flex items-center gap-3 px-2 py-2">
            {/* Ring */}
            <div className="relative shrink-0 w-12 h-12">
                <svg 
                    width="48" height="48"
                    viewBox="0 0 48 48"
                    className="-rotate-90"
                >
                    {/* Track */}
                    <circle 
                        cx="24" cy="24"
                        r={radius}
                        fill="none"
                        stroke="#27272a"
                        strokeWidth="5"
                    />
                    {/* Fill */}
                    <circle 
                        cx="24" cy="24"
                        fill="none"
                        r={radius}
                        stroke={color}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashOffset}
                        style={{ transition: "stroke-dashoffset 0.3s ease"}}
                    />
                </svg>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white leading-none">
                        {usage.used}/{usage.limit} 
                    </span>
                </div>
            </div>

            {/* Text Info */}
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider
                truncate">
                    Sets this month
                </span>
                {isAtLimit ? (
                    <span className="text-[10px] text-red-400 mt-0.5 truncate">
                        Limit reached · Resets {resetData}
                    </span>
                ) : (
                    <span className="text-[10px] text-zinc-600 mt-0.5 truncate">
                        {usage.limit - usage.used} remaining · Resets {resetData}
                    </span>
                )}
            </div>
        </div>
    )
}
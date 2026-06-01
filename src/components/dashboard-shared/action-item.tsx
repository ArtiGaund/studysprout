'use client';

import { ChevronRight, LucideIcon } from "lucide-react";

interface ActionItemProps{
    icon: LucideIcon;
    label: string;
    handleAction?: () => void;
    disabled?: boolean;
    iconClassName?: string | null;
    isGenerating?: boolean;
}

export const ActionItem = ({
    icon: Icon,
    label,
    handleAction,
    disabled,
    iconClassName,
    isGenerating,
}: ActionItemProps) => {
    return (
        <button
        onClick={handleAction}
        disabled={disabled}
        className="w-full flex items-center justify-between p-4 bg-[#0d0d0d] hover:bg-zinc-800/50
        border border-white/5 rounded-xl transition-all group"
        >
            <div className="flex items-center gap-x-2 min-w-0 flex-1">
                <Icon className={`${iconClassName ?? "w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition-colors"}`}/>
                <span className="text-xs sm:text-sm font-medium text-zinc-300
                 group-hover:text-white transition-colors leading-tight">
                    {label}
                </span>
                {isGenerating && (
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                        This may take a moment
                    </span>
                )}
            </div>
            <ChevronRight 
            className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors"
            />
        </button>
    )
}
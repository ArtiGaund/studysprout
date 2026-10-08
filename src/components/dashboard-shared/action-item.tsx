'use client';

import { ChevronRight, LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface ActionItemProps{
    icon: LucideIcon;
    label: string;
    handleAction?: () => void;
    disabled?: boolean;
    disabledMessage?: string;
    tooltipClassName?: string;
    tooltipSide?: "top" | "bottom" | "left" | "right";
    iconClassName?: string | null;
    isGenerating?: boolean;
}

export const ActionItem = ({
    icon: Icon,
    label,
    handleAction,
    disabled,
    disabledMessage,
    tooltipClassName,
    tooltipSide = "top",
    iconClassName,
    isGenerating,
}: ActionItemProps) => {

    const button = (
        <button
            type="button"
            onClick={() => {
                if(disabled) return;
                handleAction?.();
            }}
            aria-disabled={disabled}
            className={`w-full flex items-center justify-between p-4 bg-[#110A10]
            border border-white/10 rounded-xl transition-all group ${disabled
                ? "cursor-not-allowed opacity-60"
                : "hover:bg-[#160d15] hover:border-purple-500/30 cursor-pointer"
            }`}
        >
            <div className="flex items-center gap-x-2 min-w-0 flex-1">
                <Icon className={`${iconClassName ?? "w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors shrink-0"}`}/>
                <span className="text-xs sm:text-sm font-mono font-medium text-zinc-300
                 group-hover:text-white transition-colors leading-tight truncate">
                    {label}
                </span>
                {isGenerating && (
                    <span className="text-[10px] font-mono text-zinc-500 mt-0.5 shrink-0">
                        This may take a moment
                    </span>
                )}
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-300 
                group-hover:translate-x-0.5 transition-all shrink-0 ml-2"/>
        </button>
    );

    if(disabled && disabledMessage){
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {button}
                    </TooltipTrigger>
                    <TooltipContent side={tooltipSide} className={tooltipClassName}>
                        {disabledMessage}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return button;
}
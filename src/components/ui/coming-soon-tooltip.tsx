import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface ComingSoonTooltipProps{
    children: React.ReactNode;
    disabled?: boolean;
    side?: "top" | "right" | "bottom" | "left";
    label?: string;
    variant?: "purple" | "blue" | "orange";
    // from?: string;  //tailwind gradient from color
    // to?: string;    //tailwind gradient to color
    // textColor?: string;
    // dotColor?: string;  //tailwind dot color
}

const variantStyle: Record<string,string> = {
    purple: "from-purple-600 to-violet-500 ring-purple-400/40 shadow-purple-900/40",
    blue: "from-blue-600 to-cyan-500 ring-blue-400/40 shadow-blue-900/40",
    orange: "from-orange-500 to-amber-400 ring-orange-400/40 shadow-orange-900/40",
};

export function ComingSoonTooltip({
    children,
    disabled = false,
    side = "top",
    label = "Coming Soon",
    variant = "purple",
    // from = "from-purple-600",
    // to = "to-violet-500",
    // textColor = "text-white",
    // dotColor = "bg-white/80",
}: ComingSoonTooltipProps){
    const trigger = disabled 
        ? <span className="cursor-not-allowed">{children}</span>
        : children;
    return(
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {trigger}
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    sideOffset={8}
                    collisionPadding={16}
                    avoidCollisions={true}
                    className={`
                        border-0 p-0 shadow-none
                        bg-transparent
                        data-[state=delayed-open]:bg-transparent
                        data-[state=instant-open]:bg-transparent
                        z-[9999]    
                    `}
                >
                    <div className={`
                        flex items-center gap-1.5 bg-gradient-to-r ${variantStyle[variant]}
                        text-white text-xs font-semibold px-3 py-1.5 rounded-full ring-1
                        shadow-lg whitespace-nowrap    
                    `}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse
                        flex-shrink-0" />
                        <span className="flex-shrink-0">{label}</span>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
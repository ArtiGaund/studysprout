'use client';

import { LucideIcon } from "lucide-react";

interface StatsCardProps{
    title: string;
    value: string;
    subValue: string;
    icon: LucideIcon;
    iconColor?: string;
}

export const StatsCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    iconColor,
}: StatsCardProps) => {
    return (
        <div className="w-full bg-[#110A10] border border-white/10 p-4 sm:p-6 rounded-2xl
        flex flex-col gap-y-3 transition-colors hover:border-purple-500/20">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-semibold text-purple-300 
                tracking-widest uppercase">
                    {title}
                </span>
                <Icon className={`w-5 h-5 ${iconColor || 'text-zinc-400'}`}/>
            </div>
            <div className="flex flex-col gap-y-0.5">
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                    {value}
                </h2>
                <span className="text-xs font-mono text-zinc-500 truncate">
                    {subValue}
                </span>
            </div>
        </div>
    )
}
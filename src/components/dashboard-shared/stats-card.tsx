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
        <div className="w-full bg-[#161616] border border-white/5 p-4 sm:p-6 rounded-2xl
        flex flex-col gap-y-4">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
                    {title}
                </span>
                <Icon className={`w-5 h-5 ${iconColor || 'text-zinc-400'}`}/>
            </div>
            <div className="flex flex-col gap-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    {value}
                </h2>
                <span className="text-xs text-zinc-500 font-medium">
                    {subValue}
                </span>
            </div>
        </div>
    )
}
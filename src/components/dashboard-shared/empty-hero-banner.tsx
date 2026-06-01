"use client";

import { PlayCircle } from "lucide-react";

export const EmptyHero = () => {
    return(
        <div className="rounded-2xl border border-dashed border-white/10 p-4 flex flex-col 
        items-center justify-center gap-y-2 bg-white/[0.02] min-h-[100px]">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <PlayCircle size={16} className="text-zinc-600"/>
            </div>
            <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
                Nothing playing yet.<br />
                <span className="text-zinc-500">Pick a set below to start.</span>
            </p>
        </div>
    )
}
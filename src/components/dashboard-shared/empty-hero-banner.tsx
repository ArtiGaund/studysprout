"use client";

import { PlayCircle } from "lucide-react";

export const EmptyHero = () => {
    return(
        <div className="rounded-2xl border border-dashed border-white/10 p-4 flex flex-col 
        items-center justify-center gap-y-2 bg-[#110A10] min-h-[100px]">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center 
            border border-white/5">
                <PlayCircle size={16} className="text-zinc-500"/>
            </div>
            <p className="text-xs font-mono text-zinc-500 text-center leading-relaxed">
                Nothing playing yet.<br />
                <span className="text-purple-300">Pick a set below to start.</span>
            </p>
        </div>
    )
}
'use client';

import { Folder } from "lucide-react";

export const BannerSection = () => {
    return (
         <div className="flex items-center justify-between px-6 py-3 border-b border-[#2A1E22] 
         bg-[#0E090B]/80 backdrop-blur-md transform-gpu will-change-transform backface-hidden 
         sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <span className="text-stone-400 flex items-center gap-2 text-[11px] font-mono
                 font-bold">
                    <Folder size={12} className="text-[#C9A227]" /> 
                    Collaboration 
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {/* User Avatar Circle */}
                    <div className="w-6 h-6 rounded-full bg-[#C9A227] border
                     border-[#E5C158] flex items-center justify-center text-[10px] font-mono
                     font-black text-[#0E090B] shadow-lg">
                        A
                    </div>
                </div>
            </div>
        </div>
    )
}
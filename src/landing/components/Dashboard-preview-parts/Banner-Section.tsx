'use client';

import { Folder } from "lucide-react";

export const BannerSection = () => {
    return (
         <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 
         bg-[#080C0C]/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <span className="text-gray-500 flex items-center gap-2 text-[11px] font-bold">
                    <Folder size={12} className="text-gray-600" /> 
                    Collaboration 
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {/* User Avatar Circle */}
                    <div className="w-6 h-6 rounded-full bg-orange-600 border
                     border-white/10 flex items-center justify-center text-[10px] font-black
                      text-white shadow-lg">
                        A
                    </div>
                </div>
            </div>
        </div>
    )
}
'use client';

import { History, Layout, Search, Settings, Trash2 } from "lucide-react";

export const CollapsedNavigation = () => {
    return (
         <div className="w-16 border-r border-[#2A1E22] bg-[#120C0E] flex flex-col 
         items-center py-8 gap-10 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#C9A227]/10 flex items-center 
            justify-center text-[#C9A227] border border-[#C9A227]/20 shadow-sm">
                <Layout size={20}/>
            </div>
            <div className="flex flex-col gap-8 text-[#8C7A6B]">
                <Search size={20} className="hover:text-[#F5F0EB] transition-colors cursor-pointer"/>
                <History size={20} className="hover:text-[#F5F0EB] transition-colors cursor-pointer"/>
                <Trash2 size={20} className="hover:text-[#F5F0EB] transition-colors cursor-pointer"/>
            </div>
            <div className="mt-auto pb-6 text-[#8C7A6B] hover:text-[#F5F0EB] transition-colors 
            cursor-pointer">
                <Settings size={20}/>
            </div>
        </div>
    )
}
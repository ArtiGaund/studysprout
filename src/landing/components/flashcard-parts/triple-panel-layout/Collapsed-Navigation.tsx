'use client';

import { History, Layout, Search, Settings, Trash2 } from "lucide-react";

export const CollapsedNavigation = () => {
    return (
         <div className="w-16 border-r border-white/5 bg-[#050A0A] flex flex-col 
         items-center py-8 gap-10">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center 
            justify-center text-purple-400 border border-purple-500/20">
                <Layout size={20}/>
            </div>
            <div className="flex flex-col gap-8 text-gray-700">
                <Search size={20}/>
                <History size={20}/>
                <Trash2 size={20}/>
            </div>
            <div className="mt-auto pb-6 text-gray-700"><Settings size={20}/></div>
        </div>
    )
}
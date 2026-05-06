'use client';

import { Maximize2 } from "lucide-react";
import React from "react";

interface ExpandButtonProps{
    onClick: () => void;
    type: string;
}

export const ExpandButton: React.FC<ExpandButtonProps> = ({
    onClick,
    type,
}) => {
    return (
        <button
        onClick={onClick}
        className={`
            group flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase
            tracking-widest transition-all duration-300 hover:scale-105 border
            ${type === 'flashcard' 
                ? 'bg-purple-600 border-purple-600/30 text-white hover:bg-purple-600/20 hover:border-purple-600/60 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]' 
                : 'bg-[#63FF9D]/10 border-[#63FF9D]/30  text-[#63FF9D] hover:bg-[#63FF9D]/20 hover:border-[#63FF9D]/60  hover:shadow-[0_0_20px_rgba(99,255,157,0.3)]'}
            `}
        >
            <Maximize2 
            size={14}
            className="group-hover:rotate-12 transition-transform duration-300"
            />
            Expand Sandbox
        </button>
    )
}

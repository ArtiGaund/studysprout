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
            group flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-mono font-bold uppercase
            tracking-widest transition-all duration-300 hover:scale-105 border
           'bg-[#C9A227]/10 border-[#C9A227]/40 text-[#C9A227] hover:bg-[#C9A227]/20 hover:border-[#C9A227]/80 hover:shadow-[0_0_20px_rgba(201,162,39,0.3)]'}
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
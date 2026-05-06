'use client';

import React from "react";
import { ExpandButton } from "./Expand-Button";

interface CollapsedPreviewProps{
    onExpand: () => void;
    isPaused?: boolean;
    heading: string;
    subHeading: string;
    type: string;
}

export const CollapsedPreview: React.FC<CollapsedPreviewProps> = ({
    onExpand,
    isPaused,
    heading,
    subHeading,
    type,
}) => {
    return (
        <div 
        className="relative w-full overflow-hidden rounded-2xl border border-white/10"
        style={{
            aspectRatio: '16/9'
        }}
        >
            {/* Background blur of the sandbox content */}
            <div className="absolute inset-0 bg-[#080C0C]/90 backdrop-blur-sm"/>

            {/* Faded sandbox preview */}
            <div className="absolute inset-0 opacity-25 pointer-events-none overflow-hidden
            scale-50 origin-top-left"
            style={{
                width: '200%',
                height: '200%',
            }}
            >
                {/* Placeholder sidebar stripes */}
                <div className="absolute left-0 top-0 w-32 h-full bg-[#080C0C] border-r
                 border-white/5">
                    {[...Array(6)].map((_, i) => (
                        <div 
                        key={i}
                        className="mx-3 my-2 h-4 rounded bg-white/5"
                        style={{
                            width: `${60 + Math.random() * 40}%`
                        }}
                        />
                    ))}
                </div>
                <div className="absolute left-32 top-0 right-0 h-full bg-[#050A0A]">
                    {[...Array(4)].map((_, i) => (
                        <div 
                        key={i}
                        className="mx-6 my-4 h-12 rounded-xl border border-white/5
                        bg-white/[0.02]"
                        />
                    ))}
                </div>
            </div>

            {/* Overlay CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4
            bg-[#050A0A]/60 backdrop-blur-[2px]">
                <div className="text-center">
                    <p className={`text-xs font-medium uppercase tracking-widest
                    mb-1 ${type === 'flashcard' 
                    ? 'text-purple-400' 
                    : 'text-white/60'
                    }`}>
                        {heading}
                    </p>
                    <p className="text-white/40 text-[10px]">
                        {subHeading}
                    </p>
                </div>
                <ExpandButton 
                onClick={onExpand}
                type={type}
                />
                {type === 'sandbox' && (<div
                className={`text-[10px] font-bold transition-all duration-500
                    ${isPaused 
                        ? 'text-[#63FF9D] opacity-100' 
                        : 'text-gray-600 opacity-50'}
                    `}
                >
                    {isPaused 
                    ? "MANUAL OVERRIDE ACTIVE" 
                    : "AI GUIDE RUNNING"
                    }
                </div>)}
            </div>
        </div>
    )
}
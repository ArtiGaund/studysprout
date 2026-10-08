'use client';

import { Brain, FileText, Plus, TrendingUp } from "lucide-react";
import { boolean } from "zod";

interface RevisionBarProps {
    setHasNewFileSet: (val: boolean ) => void;
    setActiveSet: ( val: 'folder' | 'file' | 'custom') => void;
    setView: (val: 'idle' | 'customizing' | 'reviewing') => void;
    activeSet: string;
    hasNewFileSet: boolean;
    hasCustomSet: boolean;
    setHasCustomSet: (val: boolean) => void;
    activeHint: 'none' | 'highlight' | 'generate' | 'plus' | 'sidebar';
}
export const RevisionBar = ({
    setHasNewFileSet,
    setActiveSet,
    setView,
    activeSet,
    hasNewFileSet,
    hasCustomSet,
    setHasCustomSet,
    activeHint,
}: RevisionBarProps) => {
    return (
        <div className="w-48 lg:w-64 border-r border-[#2A1E22] bg-[#120C0E]/50 p-4 lg:p-6 
        flex flex-col gap-8 h-full overflow-y-auto flex-shrink-0">
            <div className="flex-none space-y-4">
                <div className="text-[10px] font-mono text-[#8C7A6B] uppercase tracking-[0.2em]">
                    Revision Bar
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => { 
                            setHasNewFileSet(true); 
                            setActiveSet('file'); 
                            setView('reviewing'); 
                        }}
                        className={`flex-1 p-3 rounded-xl bg-[#C9A227] text-[#120C0E] font-mono font-bold 
                        text-[10px] hover:bg-transparent hover:text-[#C9A227] 
                        border border-[#C9A227] transition-all shadow-md
                        ${activeHint ==='generate' 
                            ? 'ring-2 ring-[#C9A227] animate-pulse scale-105'
                            : ''
                        }`}
                    >
                        Generate Flashcard
                    </button>
                    <button 
                        onClick={() => setView('customizing')} 
                        className={`p-3 rounded-xl bg-[#2A1E22]/50 text-[#F5F0EB] border 
                        border-[#2A1E22] hover:border-[#C9A227]/40 transition-colors
                        ${activeHint === 'plus' 
                            ? 'ring-2 ring-[#C9A227] animate-pulse'
                            : ''
                        }`}
                     >
                        <Plus size={16}/>
                    </button>
                </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-[10px] font-mono text-[#8C7A6B] uppercase 
                tracking-widest">
                    Flashcard Sets
                </div>
                            
                {/* Existing Set (Folder) */}
                <div 
                    onClick={() => { 
                        setActiveSet('folder'); 
                        setView('reviewing'); 
                    }} 
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer 
                    transition-all ${activeSet === 'folder' 
                    ? 'bg-[#C9A227]/10 border-[#C9A227]/30 text-[#F5F0EB]' 
                    : 'border-transparent text-[#A09388] hover:bg-white/[0.02] hover:text-[#F5F0EB]'}
                    ${activeHint === 'sidebar'
                        ? 'border-[#C9A227]/50 bg-[#C9A227]/10'
                        : ''
                    }`}
                >
                    <Brain size={18} className="text-[#C9A227]"/>
                    <div className="flex-1 truncate">
                        <p className="text-[11px] font-mono font-bold truncate">
                            ML_Machine_Learning
                        </p>
                        <p className="text-[9px] font-mono text-[#C9A227] flex items-center 
                        gap-1 mt-0.5">
                            <span className="shrink-0 flex items-center gap-1">
                                <TrendingUp size={11}/> due
                            </span>
                        </p>
                    </div>
                </div>

                {/* NEW GENERATED SET (File) */}
                {hasNewFileSet && (
                    <div 
                        onClick={() => { 
                            setActiveSet('file'); 
                            setView('reviewing'); 
                        }} 
                        className={`flex items-center gap-3 p-3 rounded-xl border 
                        cursor-pointer transition-all animate-in fade-in duration-500 
                        ${activeSet === 'file' 
                        ? 'bg-[#C9A227]/10 border-[#C9A227]/30 text-[#F5F0EB]' 
                        : 'border-transparent text-[#A09388] hover:bg-white/[0.02] hover:text-[#F5F0EB]'}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-[#C9A227]/10 flex 
                        items-center justify-center text-[#C9A227]">
                            <FileText size={18}/>
                        </div>
                        <div className="flex-1 truncate">
                            <p className="text-[11px] font-mono font-bold truncate">
                                Transformer_Architectures.md - Set
                            </p>
                            <p className="text-[9px] font-mono text-[#C9A227] flex items-center 
                            gap-1 mt-0.5">
                                <span className="shrink-0 flex items-center gap-1">
                                    <TrendingUp size={11}/> due
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Custom Set */}
                {hasCustomSet && (
                    <div 
                        onClick={() => { 
                            setActiveSet('custom'); 
                            setView('reviewing'); 
                        }} 
                        className={`flex items-center gap-3 p-3 rounded-xl border 
                        cursor-pointer transition-all animate-in fade-in duration-500 
                        ${activeSet === 'file' 
                        ? 'bg-[#C9A227]/10 border-[#C9A227]/30 text-[#F5F0EB]' 
                        : 'border-transparent text-[#A09388] hover:bg-white/[0.02] hover:text-[#F5F0EB]'}`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-[#C9A227]/10 flex 
                        items-center justify-center text-[#C9A227]">
                            <FileText size={18}/>
                        </div>
                        <div className="flex-1 truncate">
                            <p className="text-[11px] font-mono font-bold truncate">
                                Natural_Language_Processing.md - Set
                            </p>
                            <p className="text-[9px] font-mono text-[#C9A227] flex mt-0.5
                            items-center gap-1">
                               <span className="shrink-0 flex items-center gap-1">
                                    <TrendingUp size={11}/> due
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
'use client';

import { Brain, FileText, Plus } from "lucide-react";
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
        <div className="w-48 lg:w-64 border-r border-white/5 bg-white/[0.01] p-4 lg:p-6 
        flex flex-col gap-8 h-full overflow-y-auto">
            <div className="flex-none space-y-4">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                    Revision Bar
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => { 
                            setHasNewFileSet(true); 
                            setActiveSet('file'); 
                            setView('reviewing'); 
                        }}
                        className={`flex-1 p-3 rounded-xl bg-purple-600 text-white 
                        font-bold text-[10px] hover:bg-purple-700 transition-all 
                        shadow-[0_0_20px_rgba(168,85,247,0.3)]
                        ${activeHint ==='generate' 
                            ? 'ring-2 ring-purple-500 animate-pulse scale-105'
                            : ''
                        }`}
                    >
                        Generate Flashcard
                    </button>
                    <button 
                    onClick={() => setView('customizing')} 
                    className={`p-3 rounded-xl bg-white/5 text-white border
                     border-white/10 hover:bg-white/10 transition-colors
                     ${activeHint === 'plus' 
                        ? 'ring-2 ring-blue-500 animate-pulse'
                        : ''
                     }`}
                     >
                        <Plus size={16}/>
                    </button>
                </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-[10px] font-black text-gray-600 uppercase 
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
                    ? 'bg-purple-500/10 border-purple-500/30' 
                    : 'border-transparent hover:bg-white/5'}
                    ${activeHint === 'sidebar'
                        ? 'border-pink-500/50 bg-pink-500/10'
                        : ''
                    }`}>
                        {/* <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center 
                        justify-center text-pink-500"> */}
                            <Brain size={18} className="text-pink-500"/>
                        {/* </div> */}
                        <div className="flex-1">
                            <p className="text-[11px] text-white font-bold truncate">
                                ML_Machine_Learning
                            </p>
                            <p className="text-[9px] text-orange-400 font-bold flex 
                            items-center gap-1">
                            🔥 3 due
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
                            ? 'bg-[#63FF9D]/10 border-[#63FF9D]/30' 
                            : 'border-transparent hover:bg-white/5'}`}>
                                <div className="w-8 h-8 rounded-lg bg-[#63FF9D]/10 flex 
                                items-center justify-center text-[#63FF9D]">
                                    <FileText size={18}/>
                                </div>
                                <div className="flex-1 truncate">
                                    <p className="text-[11px] text-white font-bold">
                                        Transformer_Architectures.md - Set
                                    </p>
                                    <p className="text-[9px] text-orange-400 font-bold flex 
                                    items-center gap-1">
                                        🔥 3 due
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
                            ? 'bg-[#63FF9D]/10 border-[#63FF9D]/30' 
                            : 'border-transparent hover:bg-white/5'}`}>
                                <div className="w-8 h-8 rounded-lg bg-[#63FF9D]/10 flex 
                                items-center justify-center text-[#63FF9D]">
                                    <FileText size={18}/>
                                </div>
                                <div className="flex-1 truncate">
                                    <p className="text-[11px] text-white font-bold">
                                        Natural_Language_Processing.md - Set
                                    </p>
                                    <p className="text-[9px] text-orange-400 font-bold flex 
                                    items-center gap-1">
                                        🔥 3 due
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
    )
}
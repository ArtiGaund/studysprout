'use client';

import { Activity, AlertCircle, MousePointer2, Sparkles, Wand2, Plus, Zap, Brain } from "lucide-react";
import { Flashcard } from "./triple-panel-layout/editor-canvas";

interface FlashcardSet {
    title: string;
    data: Flashcard[];
}

interface DescriptionPartProps {
    view: 'idle' | 'reviewing' | 'customizing';
    setActiveSet: (val: 'file' | 'folder' | 'custom') => void;
    setView: (val: 'idle' | 'reviewing' | 'customizing') => void;
    flashcardSets: Record<'file' | 'folder' | 'custom', FlashcardSet>;
    currentCards: Flashcard[];
    reviewIndex: number;
    isFlipped: boolean;
    setIsFlipped: (val: boolean) => void;
    activeSet: 'file' | 'folder' | 'custom' | null;
    activeHint: 'none' | 'highlight' | 'generate' | 'plus' | 'sidebar';
}

export const DescriptionPart = ({
    view,
    flashcardSets,
    currentCards,
    reviewIndex,
    isFlipped,
    setIsFlipped,
    activeSet,
    activeHint,
}: DescriptionPartProps) => {

    const pointerPositions = {
        highlight: "top-[210px]",
        generate: "top-[320px]",
        plus: "top-[425px]",
        sidebar: "top-[535px]",
        none: "opacity-0",
    }
    return (
        <div className="flex w-full lg:w-[30%] h-[740px] overflow-hidden rounded-3xl border
         border-white/10 bg-[#080C0C] shadow-2xl relative p-8">

            {/* The Floating Pointer */}
            {activeHint !== 'none' && (
                <div className={`absolute -left-4 ${pointerPositions[activeHint]} transition-all
                duration-1000 ease-in-out z-50`}>
                    <div className="relative">
                        <MousePointer2 
                        className="text-[#63FF9D] fill-[#63FF9D] rotate-[270deg] size-5
                        drop-shadow-[0_0_10px_#63FF9D]"
                        />
                        <div className="absolute left-6 top-0 bg-[#63FF9D] text-black text-[8px]
                        font-black px-2 py-0.5 rounded-sm whitespace-nowrap animate-pulse">
                            TRY THIS
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-5 text-left flex flex-col h-full">
                
                {/* Header: Dynamic State Indicator */}
                <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                    <Zap size={18} className="text-[#63FF9D]" />
                    <span className="text-[10px] font-black text-white uppercase 
                    tracking-[0.2em]">
                        {view === 'idle' ? 'Interactive Guide' : 'System Logic'}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {/* IDLE VIEW: Onboarding & Interactive Options */}
                    {view === 'idle' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 
                        duration-500">
                            <div className="space-y-4">
                                <h4 className="text-xl font-bold text-white leading-tight">
                                    On-Demand Active Recall
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {`StudySprout doesn't just store notes; it deconvolves them 
                                    into surgical study sets. Try these actions to see the
                                    engine in work:`}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Option 1: Live Highlight */}
                                <div className={`p-4 rounded-2xl bg-white/[0.03] border
                                 border-white/5 group transition-all
                                  hover:border-[#63FF9D]/30
                                  ${activeHint === 'highlight' 
                                    ? 'border-[#63FF9D] bg-[#63FF9D]/5 shadow-[0_0_15px_rgba(99,255,157,0.1)]'
                                    : 'border-white/5'
                                  }`}>
                                    <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-3 mb-2
                                     text-[#63FF9D]">
                                        <MousePointer2 size={16} />
                                        <span className="text-[10px] font-black uppercase">
                                            Try Highlighting
                                        </span>
                                    </div>
                                    {activeHint === 'highlight' && 
                                        <span className="text-[8px] bg-[#63FF9D] text-black px-1.5
                                        rounded-full animate-bounce">
                                            LOOK HERE
                                        </span>
                                    }
                                  </div>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Select text like 
                                        <span className="text-white italic">
                                            {`"sequence-aligned RNNs"`}
                                        </span> in the editor to trigger an instant draft.
                                    </p>
                                </div>

                                {/* Option 2: Generate Current */}
                                <div 
                                className={`p-4 rounded-2xl border transition-all duration-500
                                    ${activeHint === 'generate' 
                                        ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                                        : 'border-white/5 bg-white/[0.03]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 mb-2
                                     text-purple-400">
                                        <Wand2 size={16} />
                                        <span className="text-[10px] font-black uppercase">
                                            Generate Button
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Click <span className="text-white">
                                            Generate Flashcard
                                        </span> to analyze the currently opened Transformer file.
                                    </p>
                                </div>

                                {/* Option 3: Customize */}
                                <div 
                                className={`p-4 rounded-2xl border transition-all duration-500
                                    ${activeHint === 'plus'
                                        ? 'border-blue-400 bg-blue-400/4 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'border-white/5 bg-white/[0.03]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 mb-2
                                     text-blue-400">
                                        <Plus size={16} />
                                        <span className="text-[10px] font-black uppercase">
                                            Plus Icon
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Open the Customizer to define a specific study scope 
                                        across your AI folders.
                                    </p>
                                </div>

                                {/* Option 4: Review Existing Set */}
                                <div 
                                className={`p-4 rounded-2xl border transition-all duration-500
                                    ${activeHint === 'sidebar'
                                        ? 'border-pink-500 bg-pink-500/5 shadow-[0_0_15px_rgba(236,72,153,0.1)]'
                                        : 'border-white/5 bg-white/[0.03]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 mb-2
                                     text-pink-500">
                                        <Brain size={14} />
                                        <span className="text-[10px] font-black uppercase 
                                        tracking-wider">Sidebar Set</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Click on the <span className="text-white font-bold">
                                            ML_Machine_Learning</span>
                                        set in the Revision Bar to start a review session.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CUSTOMIZING VIEW: Explaining the Scope */}
                    {view === 'customizing' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <h4 className="text-xl font-bold text-white">Manual Override</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {`You are now accessing the **Customization Form**. 
                                This allows you to bypass the single-file logic and target 
                                entire directories.`}
                            </p>
                            <div className="p-4 rounded-xl bg-blue-500/5 border
                             border-blue-500/20">
                                <p className="text-[10px] text-blue-300 leading-relaxed">
                                    Use this to deconvolve the 
                                    <span className="font-bold italic">
                                        Natural_Language_Processing
                                    </span> folder into a master review deck.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* REVIEWING VIEW: Explaining the Generation Logic */}
                    {view === 'reviewing' && activeSet && (
                        <div className="space-y-8 animate-in zoom-in duration-500">
                            <div className="space-y-4">
                                <h4 className="text-xl font-bold text-white leading-tight">
                                    {activeSet === 'file' ? 'File Deconvolution' : 'Set Review'}
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {activeSet === 'file' 
                                        ? `The engine has analyzed "Transformer_Architectures.md" and extracted 3 terminal concepts based on your recent activity.`
                                        : `You are now reviewing the "${flashcardSets[activeSet].title}" set.`}
                                </p>
                            </div>

                            {/* SRS Interface Simulation */}
                            <div className="bg-[#0D1414] border border-white/10 rounded-2xl
                             p-6 space-y-6 shadow-2xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-purple-400 
                                    uppercase tracking-widest">
                                        Card {reviewIndex + 1}/{currentCards.length}
                                    </span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#63FF9D] 
                                    animate-pulse" />
                                </div>
                                <p className="text-sm font-bold text-white leading-relaxed 
                                min-h-[60px]">
                                    {isFlipped 
                                    ? currentCards[reviewIndex]?.a 
                                    : currentCards[reviewIndex]?.q
                                    }
                                </p>
                                <button 
                                    onClick={() => setIsFlipped(!isFlipped)} 
                                    className="w-full py-3 bg-purple-600 rounded-xl 
                                    text-[10px] font-black uppercase text-white shadow-lg
                                     active:scale-95 transition-all"
                                >
                                    {isFlipped ? 'Memory Logged' : 'Reveal Answer'}
                                </button>
                            </div>

                            <p className="text-[10px] text-gray-500 italic leading-relaxed 
                            border-l-2 border-white/5 pl-4">
                                Note: Highlighting a different term will instantly append a 
                                new card to this session.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer: Tech Stack Signature */}
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Activity size={12} />
                        <span className="text-[9px] font-black uppercase">Live Telemetry</span>
                    </div>
                    <div className="text-[9px] font-mono text-gray-800">SRS_v3.42</div>
                </div>
            </div>
        </div>
    );
};
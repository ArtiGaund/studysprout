'use client';

import { ChevronRight, FileText, Folder, Sparkles, X } from "lucide-react";
import { CustomForm } from "../custom-form";

export interface Flashcard {
    q: string;
    a: string;
}
interface EditorCanvasProps{
    artiStatus: string;
    isHighlightingSimulated: boolean;
    showSimulationPopup: boolean;
    showLivePopup: boolean;
    setShowLivePopup: (val: boolean) => void;
    view: 'customizing' | 'idle' | 'reviewing';
    setView: (val: 'idle' | 'customizing' | 'reviewing') => void;
    setActiveSet: ( val: 'folder' | 'file' | 'custom') => void;
    setIsFlipped: (val: boolean) => void;
    isFlipped: boolean;
    reviewIndex: number;
    activeSet: 'file' | 'folder' | 'custom';
    currentCards: Flashcard[];
    docRef: React.RefObject<HTMLDivElement>;
    setReviewIndex: (val: number) => void;
    setHasCustomSet: (val: boolean) => void;
    hasCustomSet: boolean;
    activeHint: 'none' | 'highlight' | 'generate' | 'plus' | 'sidebar';
}

export const EditorCanvas = ({
    artiStatus,
    isHighlightingSimulated,
    showSimulationPopup,
    showLivePopup,
    setShowLivePopup,
    view,
    setView,
    setActiveSet,
    setIsFlipped,
    isFlipped,
    reviewIndex,
    activeSet,
    currentCards,
    docRef,
    setReviewIndex,
    setHasCustomSet,
    hasCustomSet,
    activeHint,
}: EditorCanvasProps) => {
    return (
         <div className="flex-1 relative bg-[#080C0C] overflow-hidden flex flex-col h-full">
            {/* Internal Header */}
            <div className="flex-none w-full px-8 py-5 border-b border-white/5 flex 
            items-center justify-between bg-[#050A0A]/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 
                overflow-hidden">
                    <Folder size={14} className="flex-shrink-0" /> 
                    <span className="truncate">Artificial_Intelligence</span>
                    <ChevronRight size={12} className="flex-shrink-0" /> 
                    <Folder size={14} className="flex-shrink-0" /> 
                    <span className="truncate">Natural_Language_Processing</span>
                    <ChevronRight size={12} className="flex-shrink-0" /> 
                    <FileText size={14} className="flex-shrink-0" /> 
                    <span className="text-gray-300 truncate">Transformer_Architectures.md</span>
                </div>
                <div className="flex-shrink-0 ml-4 text-[9px] font-mono text-orange-400
                 bg-orange-400/10 px-2.5 py-1 rounded-full animate-pulse">
                    [{artiStatus}]
                </div>
            </div>

            {/* Simulated Document with Live and Simulated Highlights */}
            <div ref={docRef} className="flex-1 p-12 relative overflow-y-auto custom-scrollable">
                <div className="max-w-2xl mx-auto space-y-10 pb-20">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-10">
                        Attention Is All You Need
                    </h1>
                    <p className="text-gray-400 leading-relaxed text-lg lg:text-xl relative">
                        The Transformer model relies entirely on 
                        <span className={`mx-2 px-1 rounded transition-all duration-1000 
                            ${isHighlightingSimulated 
                            ? 'bg-pink-500 text-black shadow-[0_0_15px_#63FF9D]' 
                            : 'bg-transparent'}
                            ${activeHint === 'highlight'
                                ? 'bg-pink-400/20 text-pink-400 animate-pulse cursor-pointer'
                                : ''
                            }`}>
                                    self-attention mechanisms
                        </span>. 
                        to compute representations of its input and output without 
                        using sequence-aligned RNNs or convolution.
                    </p>

                    <p className="text-gray-400 leading-relaxed lg:text-xl text-lg">
                        By utilizing Multi-Head Attention, the model can simultaneously attend
                         to information from different representation subspaces at different 
                         positions. This architecture allows for significantly more 
                         parallelization compared to traditional recurrent layers.
                    </p>

                    <div className="p-6 lg:p-8 rounded-2xl bg-white/[0.02] border
                     border-white/5 space-y-4">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest 
                        opacity-50">
                            Key Component: The Encoder
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            The encoder is composed of a stack of N = 6 identical layers. 
                            Each layer has two sub-layers: a multi-head self-attention mechanism 
                            and a simple, position-wise fully connected feed-forward network.
                        </p>
                    </div>
                </div>

                {/* Simulated Highlight Popup (Automatic) */}
                {showSimulationPopup && (
                    <div className="absolute left-1/2 bottom-40 -translate-x-1/2 w-72
                     bg-[#0D1414] border border-[#63FF9D]/40 p-5 rounded-2xl 
                     shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in fade-in 
                     slide-in-from-bottom-6 duration-500 z-30">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={14} className="text-[#63FF9D]"/>
                            <span className="text-[10px] font-black text-[#63FF9D] uppercase 
                            tracking-widest">
                                Arti generated Flashcard
                            </span>
                        </div>
                        <p className="text-[12px] text-gray-300 italic mb-5 leading-relaxed">
                            {`"Information flows between neurons across the..."`}
                        </p>
                        <div className="w-full py-2 rounded-lg bg-[#63FF9D] text-black 
                        text-[11px] font-black text-center shadow-lg uppercase">
                            Answer: Synaptic Cleft
                        </div>
                    </div>
                )}

                {/* Live Selection Popup (User-Driven) */}
                {showLivePopup && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 w-64 
                    bg-[#0D1414] border border-pink-500/40 p-4 rounded-xl shadow-2xl 
                    animate-in zoom-in duration-300 z-40">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-pink-400 uppercase 
                            tracking-widest">
                                Live Flashcard Draft
                            </span>
                            <button 
                            onClick={() => setShowLivePopup(false)} 
                            className="text-gray-600 hover:text-white">
                                <X size={14}/>
                            </button>
                        </div>
                        <div className="flex flex-col items-center justify-center py-4 gap-2">
                            <Sparkles size={20} className="text-pink-400/60"/>
                            <p className="text-[11px] text-pink-300 text-center font-bold
                            uppercase tracking-wide">
                                Coming soon
                            </p>
                            <p className="text-[9px] text-gray-500 text-center leading-relaxed">
                                Instant flashcards from text selection are on the way.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT SLIDE-IN PANEL: Expert Explainer (Mimics Screenshot 2 & 3) */}
            <CustomForm 
            view={view}
            setView={setView}
            setActiveSet={setActiveSet}
            setIsFlipped={setIsFlipped}
            isFlipped={isFlipped}
            reviewIndex={reviewIndex}
            activeSet={activeSet}
            currentCards={currentCards}
            setReviewIndex={setReviewIndex}
            setHasCustomSet={setHasCustomSet}
            hasCustomSet={hasCustomSet}
            />
        </div>
    )
}
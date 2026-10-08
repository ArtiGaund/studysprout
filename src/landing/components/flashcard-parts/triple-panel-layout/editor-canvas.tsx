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
         <div className="flex-1 relative bg-[#120C0E] overflow-hidden flex flex-col h-full">
            {/* Internal Header */}
            <div className="flex-none w-full px-8 py-5 border-b border[#2A1E22] flex 
            items-center justify-between bg-[#181013]/90 backdrop-blur-md transform-gpu 
            will-change-transform backface-hidden z-20">
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#8C7A6B] overflow-hidden">
                    <Folder size={14} className="flex-shrink-0 text-[#C9A227]" /> 
                    <span className="truncate">Artificial_Intelligence</span>
                    <ChevronRight size={12} className="flex-shrink-0" /> 
                    <Folder size={14} className="flex-shrink-0 text-[#C9A227]" /> 
                    <span className="truncate">Natural_Language_Processing</span>
                    <ChevronRight size={12} className="flex-shrink-0" /> 
                    <FileText size={14} className="flex-shrink-0 text-[#A09388]" /> 
                    <span className="text-[#F5F0EB] truncate">Transformer_Architectures.md</span>
                </div>
                <div className="flex-shrink-0 ml-4 text-[9px] font-mono text-[#C9A227] bg-[#C9A227]/10 border border-[#C9A227]/20 px-2.5 py-1 rounded-full animate-pulse">
                    [{artiStatus}]
                </div>
            </div>

            {/* Simulated Document with Live and Simulated Highlights */}
            <div ref={docRef} className="flex-1 p-12 relative overflow-y-auto custom-scrollable">
                <div className="max-w-2xl mx-auto space-y-10 pb-20">
                    <h1 className="text-3xl lg:text-4xl font-serif text-[#F5F0EB] mb-10">
                        Attention Is All You Need
                    </h1>
                    <p className="text-[#A09388] font-serif leading-relaxed text-lg lg:text-xl 
                    relative">
                        The Transformer model relies entirely on 
                        <span className={`mx-2 px-1 rounded transition-all duration-1000 
                            ${isHighlightingSimulated 
                            ? 'bg-[#C9A227] text-[#120C0E] font-bold shadow-[0_0_15px_#C9A227]' 
                            : 'bg-transparent'}
                            ${activeHint === 'highlight'
                                ? 'bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/40 animate-pulse cursor-pointer'
                                : ''
                            }`}>
                                    self-attention mechanisms
                        </span>. 
                        to compute representations of its input and output without 
                        using sequence-aligned RNNs or convolution.
                    </p>

                    <p className="text-[#A09388] font-serif leading-relaxed lg:text-xl text-lg">
                        By utilizing Multi-Head Attention, the model can simultaneously attend
                         to information from different representation subspaces at different 
                         positions. This architecture allows for significantly more 
                         parallelization compared to traditional recurrent layers.
                    </p>

                    <div className="p-6 lg:p-8 rounded-2xl bg-[#181013] border border-[#2A1E22] 
                    space-y-4">
                        <h3 className="text-[#C9A227] font-mono text-xs uppercase tracking-widest">
                            Key Component: The Encoder
                        </h3>
                        <p className="text-[#A09388] text-sm leading-relaxed">
                            The encoder is composed of a stack of N = 6 identical layers. 
                            Each layer has two sub-layers: a multi-head self-attention mechanism 
                            and a simple, position-wise fully connected feed-forward network.
                        </p>
                    </div>
                </div>

                {/* Simulated Highlight Popup (Automatic) */}
                {showSimulationPopup && (
                    <div className="absolute left-1/2 bottom-40 -translate-x-1/2 w-72
                     bg-[#181013] border border-[#C9A227]/40 p-5 rounded-2xl 
                     shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in fade-in 
                     slide-in-from-bottom-6 duration-500 z-30">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={14} className="text-[#C9A227]"/>
                            <span className="text-[10px] font-black text-[#C9A227] uppercase 
                            tracking-widest">
                                Arti generated Flashcard
                            </span>
                        </div>
                        <p className="text-[12px] font-serif text-[#A09388] italic mb-4 leading-relaxed">
                            {`"Information flows between neurons across the..."`}
                        </p>
                        <div className="w-full py-2 rounded-lg bg-[#C9A227] text-[#120C0E] 
                        text-[10px] font-mono font-bold text-center shadow-lg uppercase tracking-wider">
                            Answer: Synaptic Cleft
                        </div>
                    </div>
                )}

                {/* Live Selection Popup (User-Driven) */}
                {showLivePopup && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 w-64 
                    bg-[#181013] border border-[#C9A227]/40 p-4 rounded-xl shadow-2xl 
                    animate-in zoom-in duration-300 z-40">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold text-[#C9A227] uppercase 
                            tracking-widest">
                                Live Flashcard Draft
                            </span>
                            <button 
                            onClick={() => setShowLivePopup(false)} 
                            className="text-[#8C7A6B] hover:text-[#F5F0EB]">
                                <X size={14}/>
                            </button>
                        </div>
                        <div className="flex flex-col items-center justify-center py-4 gap-2">
                            <Sparkles size={20} className="text-[#C9A227]"/>
                            <p className="text-[11px] font-mono text-[#F5F0EB] text-center 
                            font-bold uppercase tracking-wide">
                                Coming soon
                            </p>
                            <p className="text-[10px] font-serif text-[#A09388] text-center leading-relaxed">
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
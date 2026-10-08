'use client';

import { AlertCircle, Folder, History, Plus, X } from "lucide-react";
import { Flashcard } from "./triple-panel-layout/editor-canvas"; //
import { FlashcardSet } from "./triple-panel-layout/flashcard-set";

interface CustomFormProps {
    view: 'customizing' | 'idle' | 'reviewing';
    setView: (val: 'idle' | 'customizing' | 'reviewing') => void;
    setActiveSet: ( val: 'folder' | 'file' | 'custom') => void;
    setIsFlipped: (val: boolean) => void;
    isFlipped: boolean;
    reviewIndex: number;
    activeSet: 'file' | 'folder' | 'custom';
    currentCards: Flashcard[];
    setReviewIndex: (val:number) => void;
    setHasCustomSet: (val: boolean) => void;
    hasCustomSet: boolean;
}

export const CustomForm = ({
    view, setView, setActiveSet, setIsFlipped,
    isFlipped, reviewIndex, activeSet, currentCards,
    setReviewIndex,
    setHasCustomSet,
    hasCustomSet,
}: CustomFormProps) => {
    return (
        <div>
            {(view === 'customizing' || view === 'reviewing') && (
                <div className="absolute top-0 right-0 h-full w-full sm:w-[440px] border-l 
                border-[#2A1E22] bg-[#181013] z-50 animate-in slide-in-from-right duration-500 
                shadow-2xl flex flex-col">
                    <div className="p-7 border-b border-[#2A1E22] flex items-center
                     justify-between bg-[#120C0E]">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-[#C9A227]"/>
                            <span className="text-xs font-mono font-black text-[#F5F0EB] uppercase 
                            tracking-widest">
                                {view === 'customizing' 
                                ? 'Expert Guide: Plus Button' 
                                : 'Review in Progress'}
                            </span>
                        </div>
                        <button 
                        onClick={() => setView('idle')} 
                        className="text-[#8C7A6B] hover:text-[#F5F0EB] transition-colors"
                        >
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="flex-1 p-5 sm:p-10 overflow-y-auto space-y-6 sm:space-y-12 
                    text-left">
                        {view === 'customizing' ? (
                            <>
                                <div className="space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#C9A227]/10 border 
                                    border-[#C9A227]/20 flex items-center justify-center 
                                    text-[#C9A227]">
                                        <Plus size={24}/>
                                    </div>
                                    <h4 className="text-[#F5F0EB] font-serif font-bold text-lg">
                                        Custom Flashcard Workflow
                                        </h4>
                                    <p className="text-xs text-[#A09388] font-serif leading-relaxed">
                                       {` By clicking the **Plus Button**, you bypass the 
                                        immediate "Generate of the current file" logic.
                                         Instead, you access advanced parameters to define scope
                                          and depth.`}
                                    </p>
                                </div>
                                            
                                <div className="p-5 rounded-2xl bg-[#120C0E] border border-[#2A1E22] 
                                space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-[#8C7A6B] font-mono font-bold 
                                        uppercase tracking-widest">
                                            Target Context
                                        </p>
                                        <div className="p-3.5 rounded-lg bg-[#181013] border 
                                        border-[#2A1E22] text-xs text-[#F5F0EB] font-mono flex 
                                         items-center gap-3">
                                            <Folder size={16} className="text-[#C9A227]"/> 
                                            Artificial_Intelligence / Natural_Language_Processing
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-[#8C7A6B] font-mono 
                                        font-bold uppercase tracking-widest">
                                            How many cards?
                                        </p>
                                        <div className="w-full p-4 rounded-xl bg-[#181013] border
                                         border-[#2A1E22] text-[#F5F0EB] text-xs font-bold 
                                        font-mono">2</div>
                                    </div>
                                    <button 
                                    onClick={() => { 
                                        setActiveSet('custom'); 
                                        setView('reviewing'); 
                                        setHasCustomSet(true);
                                        setReviewIndex(0);
                                        }} 
                                    className="w-full py-3.5 rounded-xl bg-[#C9A227]
                                     text-[#120C0E] font-mono font-bold text-xs uppercase 
                                     tracking-widest hover:bg-transparent hover:text-[#C9A227] 
                                     border border-[#C9A227] transition-all">
                                            Generate Flashcards
                                    </button>
                                </div>
                            </>
                        ) : (
                            <FlashcardSet 
                            setIsFlipped={setIsFlipped}
                            isFlipped={isFlipped}
                            reviewIndex={reviewIndex}
                            setReviewIndex={setReviewIndex}
                            currentCards={currentCards}
                            activeSetName={ activeSet === 'file'
                                ? 'Transformer_Architectures'
                                : activeSet === 'folder'
                                    ? 'ML_Machine_Learning'
                                    : 'Custom AI'
                            }
                            />
                        )}
                 </div>
               </div>
            )}
        </div>
    )
}
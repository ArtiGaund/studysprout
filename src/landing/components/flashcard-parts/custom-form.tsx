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
                border-white/10 bg-[#0D1414] backdrop-blur-none z-50 animate-in   {/* Remove /98 opacity, remove backdrop-blur */}
                slide-in-from-right duration-500 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex
                flex-col">
                    <div className="p-7 border-b border-white/5 flex items-center
                     justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-gray-600"/>
                            <span className="text-xs font-black text-white uppercase 
                            tracking-widest">
                                {view === 'customizing' 
                                ? 'Expert Guide: Plus Button' 
                                : 'Review in Progress'}
                            </span>
                        </div>
                        <button 
                        onClick={() => setView('idle')} 
                        className="text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="flex-1 p-5 sm:p-10 overflow-y-auto space-y-6 sm:space-y-12 text-left">
                        {view === 'customizing' ? (
                            <>
                                <div className="space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-600/10 
                                    border border-purple-500/20 flex items-center 
                                    justify-center text-purple-400">
                                        <Plus size={24}/>
                                    </div>
                                    <h4 className="text-white font-bold text-lg">
                                        Custom Flashcard Workflow
                                        </h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                       {` By clicking the **Plus Button**, you bypass the 
                                        immediate "Generate of the current file" logic.
                                         Instead, you access advanced parameters to define scope
                                          and depth.`}
                                    </p>
                                </div>
                                            
                                <div className="p-5 rounded-2xl bg-white/[0.02] border
                                 border-white/5 space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-600 font-bold 
                                        uppercase tracking-widest">
                                            Target Context
                                        </p>
                                        <div className="p-3.5 rounded-lg bg-white/5 border
                                         border-white/10 text-xs text-gray-300 flex 
                                         items-center gap-3">
                                            <Folder size={16} className="text-purple-500"/> 
                                            Artificial_Intelligence / Natural_Language_Processing
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-gray-600 font-bold 
                                        uppercase tracking-widest">
                                            How many cards?
                                        </p>
                                        <div className="w-full p-4 rounded-xl bg-white/5 
                                        border border-white/10 text-white text-xs font-bold 
                                        font-mono">2</div>
                                    </div>
                                    <button 
                                    onClick={() => { 
                                        setActiveSet('custom'); 
                                        setView('reviewing'); 
                                        setHasCustomSet(true);
                                        setReviewIndex(0);
                                        }} 
                                    className="w-full py-4 rounded-2xl bg-purple-600
                                     text-white font-black text-xs uppercase tracking-widest 
                                     shadow-xl hover:bg-purple-700 transition-all
                                      hover:shadow-purple-500/20">
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
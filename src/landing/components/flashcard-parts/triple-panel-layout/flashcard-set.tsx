'use client';

import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { Flashcard } from "./editor-canvas";

interface FlashcardSetProps {
    setIsFlipped: (val: boolean) => void;
    isFlipped: boolean;
    reviewIndex: number;
    setReviewIndex: (val: number) => void;
    currentCards: Flashcard[];
    activeSetName: string;
}

export const FlashcardSet = ({
    setIsFlipped,
    isFlipped,
    reviewIndex,
    setReviewIndex,
    currentCards,
    activeSetName,
}: FlashcardSetProps) => {

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsFlipped(false);
        setReviewIndex((reviewIndex + 1) % currentCards.length);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFlipped(false);
        setReviewIndex(reviewIndex === 0 ? currentCards.length - 1 : reviewIndex - 1);
    };

    // Updated SRS Logic
    const handleRating = (e: React.MouseEvent, type: 'again' | 'advance') => {
        e.stopPropagation();
        if (type === 'again') {
            setIsFlipped(false); // Reset to question side without changing index
        } else {
            handleNext(); // Move to next card for Hard/Good/Easy
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col text-left">                
            <div 
                onClick={() => setIsFlipped(!isFlipped)} 
                className="flex-1 aspect-[3/4] bg-[#080C0C] border border-white/10 
                rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all
                 hover:border-purple-500/40 relative"
            >
                <div className="flex justify-between items-center">
                    <div className="text-[9px] font-black text-purple-500 uppercase
                     tracking-[0.2em]">
                        Card {reviewIndex + 1}/{currentCards.length}
                    </div>
                    <div className="flex gap-1">
                        {currentCards.map((_, i) => (
                            <div key={i} className={`h-1 w-3 rounded-full ${i === reviewIndex 
                                ? 'bg-purple-500' 
                                : 'bg-white/5'}`
                            } />
                        ))}
                    </div>
                </div>

                <div className="text-center py-4 px-2">
                    {!isFlipped ? (
                        <p className="text-lg font-bold text-white leading-snug 
                        whitespace-pre-line tracking-tight">
                            {currentCards[reviewIndex]?.q}
                        </p>
                    ) : (
                        <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                            <p className="text-base text-[#63FF9D] font-medium leading-normal 
                            tracking-tight">
                                {currentCards[reviewIndex]?.a}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {!isFlipped ? (
                        <button className="w-full py-3 bg-purple-600 text-white text-[9px] 
                        font-black uppercase tracking-widest rounded-lg shadow-lg
                         active:scale-95 transition-transform">
                            Reveal Answer
                        </button>
                    ) : (
                        <div className="grid grid-cols-4 gap-1.5 animate-in
                         slide-in-from-bottom-1 duration-200">
                            {[
                                { 
                                    label: 'Again', 
                                    type: 'again', 
                                    color: 'hover:bg-red-500/20 text-red-400' 
                                },
                                { 
                                    label: 'Hard',  
                                    type: 'advance', 
                                    color: 'hover:bg-orange-500/20 text-orange-400' 
                                },
                                { 
                                    label: 'Good',  
                                    type: 'advance', 
                                    color: 'hover:bg-[#63FF9D]/20 text-[#63FF9D]' 
                                },
                                { 
                                    label: 'Easy',  
                                    type: 'advance', 
                                    color: 'hover:bg-blue-500/20 text-blue-400' 
                                }
                            ].map((rate) => (
                                <button
                                    key={rate.label}
                                    onClick={(e) => handleRating(e, rate.type as 'again' | 'advance')}
                                    className={`py-2.5 rounded-lg bg-white/5 border
                                         border-white/10 text-[8px] font-black uppercase 
                                         transition-all ${rate.color}`}
                                >
                                    {rate.label}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="flex justify-between gap-2">
                        <button onClick={handlePrev} className="flex-1 flex items-center 
                        justify-center gap-1.5 py-2 rounded-md bg-white/[0.03] border
                         border-white/5 text-[8px] text-gray-500 hover:text-white 
                         transition-all">
                            <ChevronLeft size={10}/> Prev
                        </button>
                        <button 
                        onClick={(e) => handleNext(e)} 
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 
                        rounded-md bg-white/[0.03] border border-white/5 text-[8px]
                         text-gray-500 hover:text-white transition-all">
                            Skip <ChevronRight size={10}/>
                        </button>
                    </div>
                </div>
            </div>
                                            
            <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-gray-600">
                    <History size={12}/>
                    <span className="text-[9px] font-black uppercase tracking-widest">
                        SRS Algorithm
                    </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                    {`Choosing **Again** forces an immediate re-test of this concept.
                    Other ratings increase the interval based on your history.`}
                </p>
            </div>
        </div>
    );
};
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
                className="flex-1 aspect-[3/4] bg-[#120C0E] border border-[#2A1E22] 
                rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all
                 hover:border-[#C9A227]/40 relative"
            >
                <div className="flex justify-between items-center">
                    <div className="text-[10px] font-mono font-black text-[#C9A227] uppercase
                     tracking-[0.2em]">
                        Card {reviewIndex + 1}/{currentCards.length}
                    </div>
                    <div className="flex gap-1">
                        {currentCards.map((_, i) => (
                            <div key={i} className={`h-1 w-3 rounded-full ${i === reviewIndex 
                                ? 'bg-[#C9A227]' 
                                : 'bg-[#2A1E22]'}`
                            } />
                        ))}
                    </div>
                </div>

                <div className="text-center py-4 px-2">
                    {!isFlipped ? (
                        <p className="text-base font-serif text-[#F5F0EB] leading-relaxed 
                        whitespace-pre-line">
                            {currentCards[reviewIndex]?.q}
                        </p>
                    ) : (
                        <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                            <p className="text-sm font-serif text-[#C9A227] leading-relaxed">
                                {currentCards[reviewIndex]?.a}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {!isFlipped ? (
                        <button className="w-full py-3 bg-[#C9A227] text-[#120C0E] text-[10px] 
                        font-mono font-bold uppercase tracking-widest rounded-xl 
                        hover:bg-transparent hover:text-[#C9A227] border border-[#C9A227] 
                        transition-all">
                            Reveal Answer
                        </button>
                    ) : (
                        <div className="grid grid-cols-4 gap-1.5 animate-in
                         slide-in-from-bottom-1 duration-200">
                           {[
                                { label: 'Again', type: 'again', color: 'hover:border-red-500/40 text-red-400' },
                                { label: 'Hard', type: 'advance', color: 'hover:border-[#C9A227]/40 text-[#C9A227]' },
                                { label: 'Good', type: 'advance', color: 'hover:border-[#C9A227]/40 text-[#F5F0EB]' },
                                { label: 'Easy', type: 'advance', color: 'hover:border-[#C9A227]/40 text-[#C9A227]' }
                            ].map((rate) => (
                                <button
                                    key={rate.label}
                                    onClick={(e) => handleRating(e, rate.type as 'again' | 'advance')}
                                    className={`py-2.5 rounded-lg bg-[#181013] border border-[#2A1E22] 
                                    text-[8px] font-mono font-bold uppercase transition-all 
                                    ${rate.color}`}
                                >
                                    {rate.label}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="flex justify-between gap-2">
                        <button onClick={handlePrev} className="flex-1 flex items-center 
                        justify-center gap-1.5 py-2 rounded-md bg-[#181013] border 
                        border-[#2A1E22] text-[8px] text-[#8C7A6B] hover:text-[#F5F0EB] 
                         transition-all">
                            <ChevronLeft size={10}/> Prev
                        </button>
                        <button 
                        onClick={(e) => handleNext(e)} 
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 
                        rounded-md bg-[#181013] border border-[#2A1E22] text-[8px]
                         text-[#8C7A6B] hover:text-[#F5F0EB] transition-all">
                            Skip <ChevronRight size={10}/>
                        </button>
                    </div>
                </div>
            </div>
                                            
            <div className="pt-4 border-t border-[#2A1E22] space-y-2">
                <div className="flex items-center gap-1.5 text-[#8C7A6B]">
                    <History size={12}/>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                        SRS Algorithm
                    </span>
                </div>
                <p className="text-[10px] font-serif text-[#A09388] leading-relaxed">
                    Selecting <strong className="text-[#F5F0EB]">Again</strong> 
                    forces an immediate re-test. Higher ratings extend interval periods based
                     on your memory stability.
                </p>
            </div>
        </div>
    );
};
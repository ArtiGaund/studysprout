/**
 * @component FlashcardStudyCard
 * @description The core interactive learning engine for StudySprout. 
 * Implements a Spaced Repetition System (SRS) interface with support for multiple 
 * flashcard types and real-time progress tracking.
 * * * Core Features:
 * - SRS Logic: Integration with `useFlashcardSRS` to handle memory quality ratings (Again, Hard, Good, Easy).
 * - Dynamic Rendering: Polymorphic UI that adapts to 'question-answer', 'mcq', and 'fill-in-the-blank' types.
 * - Fill-in-the-Blanks Engine: Uses regex splitting to create inline inputs for multi-blank questions.
 * - State Management: Synchronizes local study states with Redux for persistence across sessions.
 * - Outdated Detection: Notifies users when source notes have changed since card generation.
 */
'use client';

import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
import { useFlashcardSRS } from "@/hooks/flashcard/useFlashcardSRS";
import { resetSingleFlashcard, updateFlashcard } from "@/store/slices/flashcardSlice";
import { format } from "date-fns";
import { Check, Flame, Loader2, RotateCcw } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { FlashcardContentRenderer } from "./flashcard-content-renderer";


interface FlashcardStudyCardProps{
    card: any; 
    index: number;
    total: number;
    onNext: () => void;
}

const FlashcardStudyCard: React.FC<FlashcardStudyCardProps> = ({
    card,
    index,
    total,
    onNext
}) => {
    // --- UI State Management ---
    // for question-answer
    const [ revealAnswer, setRevealAnswer ] = useState(false);
    // for mcq
    const [ selectedOption, setSelectedOption ] = useState<string | null>(null);
    const [ checked, setChecked] = useState(false);
    // Maps blank index to user input string for Fill-in-the-blank mode
    const [ userAnswer, setUserAnswer ] = useState<Record<number, string>>({});

    const dispatch = useDispatch();
     const { rateCard } = useFlashcardSRS();
    const {
        reset,
        resetCard,
        updateSingleFlashcard,
        regenerateSingleFlashcard,
    } = useFlashcardGenerator();

    /**
     * @memoized isReviewed
     * Determines if the card has already been completed in the current 24h window
     * based on the SRS due date.
     */
    const isReviewed = useMemo(() => {
        if(!card?.progress?.dueDate) return false;
        return new Date(card.progress.dueDate) > new Date();
    },[ 
        card.progress?.dueDate,
        // card._id, 
    ]);

    /**
         * @handler handleRating
         * Triggers the SRS algorithm update on the backend and updates 
         * the local Redux store before transitioning to the next card.
         */
    const handleRating = async (
        quality: "again" | "hard" | "good" | "easy"
    ) => {
        const result = await rateCard(card._id, quality);
        if(result?.success){
            dispatch(updateFlashcard({
                setId: card.parentSetId,
                card: {
                    ...card,
                    progress: result.data.progress
                }
            }));
            onNext();
        }
    }

    /**
     * @handler generateFlashcard
     * Handles 'Regenerate' logic for cards marked as 'isOutdated'.
     * Re-syncs flashcard content with updated source notes.
     */
    const generateFlashcard = async () => {
        try {
            const result = await updateSingleFlashcard(card._id);

            if(!result || !result.success){
                console.warn("[FlashcardStudyCard] Error generating flashcard", result);
            }
        } catch (error) {
            console.warn("[FlashcardStudyCard] Error generating flashcard", error);
        }
    }

    // Resets interaction state when the user moves to a new card
    useEffect(() => {
        setRevealAnswer(false);
        setSelectedOption(null);
        setChecked(false);
        setUserAnswer({});
    },[card._id]);

    // Keyboard shortcut for SRS rating
    useEffect(() => {
        if(!revealAnswer && !checked) return; //only active when answer is visible

        const handleKeydown = (e: KeyboardEvent) => {
            // Prevent triggering when user is typing in fill-in-the-blank input
            if(e.target instanceof HTMLInputElement) return;

            switch(e.key){
                case '1': handleRating("again"); break;
                case '2' : handleRating("hard"); break;
                case '3' : handleRating("good"); break;
                case '4' : handleRating("easy"); break;
                case ' ' : // space to reveal answer
                    if(!revealAnswer) setRevealAnswer(true);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    },[
        revealAnswer,
        checked,
        handleRating,
    ])
   
    return (
        <Card className="
        p-5 rounded-2xl shadow-xl bg-neutral-900 border border-neutral-800 flex flex-col gap-4 max-h-[80svh] sm:max-h-[70vh] overflow-y-auto w-full
        ">
            <CardTitle
            className="text-center text-xs font-mono tracking-wider text-violet-400 uppercase"
            >
                Card {index+1}/{total} • {card.type.toUpperCase()}
            </CardTitle>

            {/* Outdated Content Notification */}
            {card.isOutdated && (
                <div className="mx-2 px-3 py-2 rounded-xl bg-amber-950/40 border
                 border-amber-800 text-amber-300 text-xs flex gap-2
                 justify-between items-center">
                    <span>
                        ⚠️ This flashcard may be outdated. Notes were updated after this card was created.
                    </span>
                    {regenerateSingleFlashcard 
                    ? <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
                    : <button
                    onClick={generateFlashcard}
                    className="px-3 py-1 text-xs font-mono font-semibold bg-amber-700 
                    hover:bg-amber-600 text-white rounded-lg transition-colors shrink-0"
                    >
                        Regenerate
                    </button>
                    }
                </div>
            )}

            {/* SRS Status Indicators */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 items-start sm:items-center
             justify-between px-2 text-xs font-mono">
                <div>
                      {isReviewed ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                               <Check size={14}/>
                                <span>Reviewed - </span>
                                <span className="text-neutral-500">⏳</span>
                                <span className="text-neutral-400">
                                    Next due on {format(new Date(card.progress?.dueDate || new Date()), "dd MMM")}
                                </span>
                            </div>
                        ): (
                            <div className="flex items-center gap-2 text-amber-400">
                               <Flame size={14}/>
                                <span>Due Today</span>
                            </div>
                        )}
                </div>
                <div>
                    {isReviewed && (
                        <button
                        className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        onClick={async () => {
                            const result = await  resetCard(card._id);
                            if(result?.data){
                                dispatch(resetSingleFlashcard({
                                    setId: result.data.parentSetId,
                                    cardId: card._id
                                }));
                            }
                        }}
                        >
                           { reset ? 
                                <Loader2 className="w-4 h-4 text-neutral-400 cursor-not-allowed animate-spin"/> :
                                <RotateCcw className="w-4 h-4 "/>
                            }
                        </button>
                    )}
                </div>
            </div>
          
          {/* MODE 1: Standard Question & Answer */}
           {card.type === "question-answer" &&( 
                <FlashcardContentRenderer 
                    card={card}
                    revealAnswer={revealAnswer}
                    setRevealAnswer={setRevealAnswer}
                    checked={checked}
                    setChecked={setChecked}
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                />
            )}

            {/* MODE 2: Multiple Choice (MCQ) */}
            {card.type === "mcq" && (
                 <FlashcardContentRenderer 
                    card={card}
                    revealAnswer={revealAnswer}
                    setRevealAnswer={setRevealAnswer}
                    checked={checked}
                    setChecked={setChecked}
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                />
            )}

            {/* MODE 3: Fill-in-the-Blanks (Advanced Multi-Input Logic) */}
            {card.type === "fill-in-the-blank" && (
                 <FlashcardContentRenderer 
                    card={card}
                    revealAnswer={revealAnswer}
                    setRevealAnswer={setRevealAnswer}
                    checked={checked}
                    setChecked={setChecked}
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                />
            )}
            {/* MODE 4: Diagram Flashcard */}
            {card.type === "diagram" && 
                <FlashcardContentRenderer 
                    heading = "Concept Diagram"
                    card={card}
                    revealAnswer={revealAnswer}
                    setRevealAnswer={setRevealAnswer}
                    setChecked={setChecked}
                    setSelectedOption={setSelectedOption}
                    userAnswer=""
                    setUserAnswer={setUserAnswer}
                />
            }

            {/* MODE 5: Chart Flashcard */}
            {card.type === "chart" && card.chartData && 
                <FlashcardContentRenderer 
                    heading = "Data Visualization"
                    card={card}
                    revealAnswer={revealAnswer}
                    setRevealAnswer={setRevealAnswer}
                    setChecked={setChecked}
                    setSelectedOption={setSelectedOption}
                    userAnswer=""
                    setUserAnswer={setUserAnswer}
                />
            }

            {/* MODE 6: Image Flashcard */}
            {card.type === "image-labeling" && 
                <FlashcardContentRenderer 
                    heading = "Label the image"
                    card={card}
                    revealAnswer={revealAnswer}
                    setRevealAnswer={setRevealAnswer}
                    setChecked={setChecked}
                    setSelectedOption={setSelectedOption}
                    userAnswer=""
                    setUserAnswer={setUserAnswer}
                />
            }

            {/* SRS Rating Footer: Only visible once the answer is known */}
            <CardFooter className="pt-2">
                {(revealAnswer || checked) ?(
                    <div className="flex flex-col w-full gap-2">
                        {isReviewed && (
                            <div className="text-[10px] text-center text-emerald-400 
                            font-mono uppercase tracking-wider" >
                                Re-reviewing (Already completed for tody)
                            </div>
                        )}
                        <div className="grid grid-cols-4 gap-2 w-full pt-2 border-t
                         border-neutral-800 font-mono text-xs">
                            <button
                            onClick={() => handleRating("again")}
                            className="py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 font-semibold transition-all text-center"
                            >
                                Again
                            </button>
                            
                            <button
                            onClick={() => handleRating("hard")}
                            className="py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-900/50 font-semibold transition-all text-center"
                            >
                                Hard
                            </button>
                            
                            <button
                            onClick={() => handleRating("good")}
                            className="py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-900/50 font-semibold transition-all text-center"
                            >
                                Good
                            </button>
                            
                            <button
                            onClick={() => handleRating("easy")}
                            className="py-2.5 rounded-xl bg-violet-950/40 hover:bg-violet-900/60 text-violet-300 border border-violet-900/50 font-semibold transition-all text-center"
                            >
                                Easy
                            </button>
                        </div>
                     </div>
                ) : (
                    <div className="text-xs font-mono text-neutral-500 text-center w-full">
                        Reveal the answer to rate your memory
                    </div>
                )
            }
            </CardFooter>
        </Card>
    )
}

export default FlashcardStudyCard;
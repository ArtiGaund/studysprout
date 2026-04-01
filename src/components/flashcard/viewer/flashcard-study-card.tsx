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
import { Loader2, RotateCcw, Undo2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";


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
        card._id, 
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
   
    return (
        <Card className="
        p-4 rounded-xl shadow-md border border-gray-400 flex flex-col gap-4 max-h-[70vh] overflow-y-auto
        ">
            <CardTitle
            className="text-center text-sm font-semibold text-purple-700"
            >
                Card {index+1}/{total} • {card.type.toUpperCase()}
            </CardTitle>

            {/* Outdated Content Notification */}
            {card.isOutdated && (
                <div className="mx-4 px-3 py-2 rounded-lg bg-yellow-900 text-yellow-300 text-sm flex
                 justify-between items-center">
                    <span>
                        ⚠️ This flashcard may be outdated. Notes were updated after this card was created.
                    </span>
                    {regenerateSingleFlashcard 
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <button
                    onClick={generateFlashcard}
                    className="ml-3 px-3 py-1 text-xs bg-yellow-700 hover:bg-yellow-600 rounded"
                    >
                        Regenerate
                    </button>
                    }
                </div>
            )}

            {/* SRS Status Indicators */}
            <div className="flex flex-row gap-6 items-center justify-between">
                <div>
                      {isReviewed ? (
                            <div className="flex items-center gap-2 text-green-500 text-sm font-medium pl-6">
                                <span className="text-lg">✓</span>
                                Reviewed -
                                <span className="text-lg">⏳</span>
                                <span className="text-blue-800">
                                    Next due on {format(new Date(card.progress?.dueDate || new Date()), "dd MMM")}
                                </span>
                            </div>
                        ): (
                            <div className="flex items-center gap-2 text-orange-600 text-sm font-medium pl-6">
                                <span className="text-lg">🔥</span>
                                Due Today
                            </div>
                        )}
                </div>
                <div>
                    {isReviewed && (
                        <button
                        className="mr-6 p-1 rounded hover:bg-gray-700"
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
                                <Loader2 className="w-4 h-4 text-gray-300 cursor-not-allowed"/> :
                                <RotateCcw className="w-4 h-4 text-gray-300"/>
                            }
                        </button>
                    )}
                </div>
            </div>
          
          {/* MODE 1: Standard Question & Answer */}
           {card.type === "question-answer" &&( 
                <CardContent>
                    <span className="p-2 text-gray-600">Question: </span>
                    <div 
                    className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm leading-relaxed"
                    >{card.question}</div>
                    {!revealAnswer ? (<button 
                    onClick={() => setRevealAnswer(true)}
                    className="
                    mt-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-300 transition
                     disabled:text-gray-500 disabled:cursor-not-allowed
                    "
                    >Reveal Answer</button>) : (
                        <button 
                        onClick={() => setRevealAnswer(false)}
                         className="mt-3 flex items-center gap-1 px-3 py-1"
                        >
                           <Undo2 size={20}/>
                        </button>
                    )}
                   { revealAnswer &&
                   ( <>
                        <span className="p-2 text-gray-600">Answer: </span>
                        <div className="text-[15px]">{card.answer}</div>
                    </>
                    )}
                </CardContent>
            )}

            {/* MODE 2: Multiple Choice (MCQ) */}
            {card.type === "mcq" && (
                <CardContent>
                    <span className="p-2 text-gray-600">Question: </span>
                    <div 
                    // className="bg-gray-900 p-3 text-[15px]"
                      className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm leading-relaxed"
                    >
                        {card.question}
                    </div>
                     {card.options?.map(( option: string, key: number) =>{ 
                        const isCorrect = option === card.answer;
                        const isSelected = option === selectedOption;

                        let optionStyle = "border-gray-300";

                        if(checked){
                            if(isSelected && isCorrect) optionStyle = "text-green-600";
                            else if(isSelected && !isCorrect) optionStyle = "text-red-600";
                            else if(isCorrect) optionStyle = "text-green-600";
                        }


                        return(
                        <div key={key} 
                        onClick={() => !checked && setSelectedOption(option)}
                        className={`p-3 border rounded-lg cursor-pointer text-sm transition ${optionStyle}`}
                        >
                            <input 
                            type="radio"
                            name={`option-${card._id}`}
                            value={option}
                            // checked={selected}
                            />
                            <span>{option}</span>
                         </div>
                     )})}
                     <div className="flex flex-row gap-3">
                    <button 
                    onClick={() => setChecked(true)}
                    disabled={!selectedOption || revealAnswer}
                     className="
                    mt-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-300 transition
                     disabled:text-gray-500 disabled:cursor-not-allowed disabled:bg-gray-300
                    "
                    >Check Answer</button>
                    
                        {!revealAnswer && (<button 
                        onClick={() =>{ 
                            setRevealAnswer(true);
                            setSelectedOption(card.answer);
                            setChecked(true);
                        }}
                        className="
                        mt-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-800 transition
                        disabled:text-gray-500 disabled:cursor-not-allowed
                        "
                        >Reveal Answer</button>)}
                        {(checked || revealAnswer) && (
                            <button
                            onClick={() => {
                                setSelectedOption(null);
                                setChecked(false);
                                setRevealAnswer(false);
                            }}
                             className="mt-3 flex items-center gap-1 px-3 py-1"
                            >
                               <Undo2 size={20}/>
                            </button>
                        )}
                        </div>
                </CardContent>
            )}

            {/* MODE 3: Fill-in-the-Blanks (Advanced Multi-Input Logic) */}
            {card.type === "fill-in-the-blank" && (
                <CardContent className="space-y-4">
                    <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 leading-relaxed">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-lg">
                            {card.question.split(/_{3,}/).map((
                                part: string,
                                i: number,
                                arr: any[]
                            ) => {
                                const answerArray = card.answer.split(";").map((s:string) => s.trim());
                                const currentVal = userAnswer[i] || "";
                                return (
                                <React.Fragment key={i}>
                                    <span className="text-slate-200">{part}</span>
                                    {i !== arr.length - 1 && (
                                        <div className="inline-grid items-center align-bottom">
                                            <span className="invisible whitespace-pre px-1 col-start-1 row-start-1 text-lg">
                                                {
                                                   ( revealAnswer 
                                                    ? answerArray[i]
                                                    : (currentVal || "...")) + " "
                                                }
                                            </span>
                                            <input
                                            autoFocus = { i=== 0}
                                            disabled={revealAnswer || checked}
                                            value={revealAnswer ? (answerArray[i] || "") : currentVal}
                                            onChange={(e) => setUserAnswer(prev => ({
                                                ...prev,
                                                [i]: e.target.value
                                            }))}
                                            // style={{ width: '100%'}}
                                            className={`
                                                col-start-1 row-start-1 bg-transparent border-b-2 text-center outline-none
                                                transition-all px-1 w-full
                                                ${checked
                                                    ? (currentVal.trim().toLowerCase() === (answerArray[i] || "").toLowerCase()
                                                        ? "border-green-500 text-green-400"
                                                        : "border-red-500 text-red-400")
                                                    : "border-purple-500 focus:border-white"
                                                }
                                                `}
                                                placeholder="..."
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            )})}
                        </div>
                    </div>

                    <div className="flex flex-row gap-3">
                    {/* Control Bar for Fill-in-the-Blanks */}
                        {!checked && !revealAnswer && (
                            <>
                                <button
                                disabled={Object.keys(userAnswer).length === 0}
                                onClick={() => setChecked(true)}
                                className={`
                                    px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-800
                                    disabled:bg-gray-700 transition
                                    `}
                                >
                                    Check Answer
                                </button>
                                <button
                                onClick={() => setRevealAnswer(true)}
                                className={`
                                    px-4 py-2 rounded-lg border border-purple-600 text-purple-400 text-sm
                                    hover:bg-purple-900/30 transition
                                    `}
                                >   
                                    Reveal Answer
                                </button>
                            </>
                        )}
                        {(checked || revealAnswer) && (
                            <button
                            onClick={() => {
                                setUserAnswer({});
                                setChecked(false);
                                setRevealAnswer(false);
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-gray-400 hover:text-white"
                            >
                                <Undo2 size={20}/>
                                <span className="text-xs">Reset</span>
                            </button>
                        )}
                    </div>
                </CardContent>
            )}

            {/* SRS Rating Footer: Only visible once the answer is known */}
            <CardFooter className="flex justify-between items-center gap-2 mt-4">
                {(revealAnswer || checked) ?(
                    <div className="flex flex-col w-full gap-2">
                        {isReviewed && (
                            <div className="text-[10px] text-center text-green-500 font-semibold uppercase" >
                                Re-reviewing (Already completed for tody)
                            </div>
                        )}
                    <div className="flex items-center w-full">
                    <button
                onClick={() => handleRating("again")}
                className="flex-1 py-2 text-red-700 font-bold text-sm transition"
                >
                    Again
                </button>
                <span className="flex-1 ml-12 text-gray-700 font-bold">|</span>
                <button
                onClick={() => handleRating("hard")}
                className="flex-1 py-2 text-orange-700 font-bold text-sm transition"
                >
                    Hard
                </button>
                <span className="flex-1 ml-12 text-gray-700 font-bold">|</span>
                <button
                onClick={() => handleRating("good")}
                className="flex-1 py-2 text-green-700 font-bold text-sm transition"
                >
                    Good
                </button>
                <span className="flex-1 ml-12 text-gray-700 font-bold">|</span>
                <button
                onClick={() => handleRating("easy")}
                className="flex-1 py-2 text-blue-700 font-bold text-sm transition"
                >
                    Easy
                </button>
                </div>
                </div>
                ) : (
                    <div className="text-xs text-gray-400 text-center w-full italic">
                        Reveal the answer to rate your memory
                    </div>
                )
            }
            </CardFooter>
        </Card>
    )
}

export default FlashcardStudyCard;
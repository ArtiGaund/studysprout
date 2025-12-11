/**
 * This component show the flashcards of the flashcard set
 * 
 * - User can do revision using this component
 * - User can give rating to the flashcard
 */
'use client';

import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
import { useFlashcardSRS } from "@/hooks/flashcard/useFlashcardSRS";
import { resetSingleFlashcard, updateFlashcard } from "@/store/slices/flashcardSlice";
import { format } from "date-fns";
import { Loader2, RotateCcw, Undo2 } from "lucide-react";
import React, { useEffect, useState } from "react";
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
    // for question-answer
    const [ revealAnswer, setRevealAnswer ] = useState(false);

    // for mcq
    const [ selectedOption, setSelectedOption ] = useState<string | null>(null);
    const [ checked, setChecked] = useState(false);

    // for fill-in-the-blanks
    const [ userAnswer, setUserAnswer ] = useState("");

    const {
        rateCard,
        loading
    } = useFlashcardSRS();
    const dispatch = useDispatch();

    const {
        reset,
        resetCard
    } = useFlashcardGenerator();

    const isCompleted = new Date(card.dueDate) > new Date();

    // Reset all when card changes
    useEffect(() => {
        setRevealAnswer(false);
        setSelectedOption(null);
        setChecked(false);
        setUserAnswer("");
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
            <div className="flex flex-row gap-6 items-center justify-between">
                <div>
                      {isCompleted ? (
                            <div className="flex items-center gap-2 text-green-500 text-sm font-medium pl-6">
                                <span className="text-lg">✓</span>
                                Reviewed -
                                <span className="text-lg">⏳</span>
                                <span className="text-blue-800">Next due on {format(new Date(card.dueDate), "dd MMM")}</span>
                            </div>
                        ): (
                            <div className="flex items-center gap-2 text-orange-600 text-sm font-medium pl-6">
                                <span className="text-lg">🔥</span>
                                Due Today
                            </div>
                        )}
                </div>
                <div>
                    {isCompleted && (
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
            {card.type === "fill-in-the-blank" && (
                <CardContent>
                    <span className="p-2 text-gray-600">Question: </span>
                    <div 
                      className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm leading-relaxed"
                    // className="bg-gray-900 p-3 text-[15px]"
                    >{card.question}</div>
                    <input 
                    disabled={revealAnswer}
                    value={revealAnswer ? card.answer : userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="border rounded-lg p-2 w-full mt-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                    placeholder="Type your answer"
                    />
                    <div className="flex flex-row gap-3">
                        <div>
                        <button
                        disabled={!userAnswer.trim()}
                        onClick={() => setChecked(true)}
                        className="
                        mt-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-800 transition
                        disabled:text-gray-500 disabled:cursor-not-allowed disabled:bg-gray-300
                        "
                        >
                            Check Answer
                        </button>
                        {checked && (
                            <>
                            {userAnswer.trim().toLowerCase() === card.answer.toLowerCase() ? (
                                <p className="text-green-600 font-medium">Correct!</p>
                            ) : (
                                <>
                                    <p className="text-red-600 font-medium">Your answer: {userAnswer}</p>
                                    <p className="text-green-600 font-medium">Correct: {card.answer}</p>
                                </>
                            )}
                            </>
                        )}
                        </div>
                        <div>
                        {!revealAnswer && !checked && (<button 
                        onClick={() => setRevealAnswer(true)}
                        className="
                        mt-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-800 transition
                        disabled:text-gray-500 disabled:cursor-not-allowed
                        "
                        >Reveal Answer</button>)}
                        </div>
                        <div>
                            {(checked || revealAnswer) && (
                                <button 
                                onClick={() => {
                                    setUserAnswer("");
                                    setChecked(false);
                                    setRevealAnswer(false);
                                }}
                                className="mt-3 flex items-center gap-1 px-3 py-1"
                                >
                                   <Undo2 size={20}/>
                                </button>
                            )}
                        </div>
                    </div>
                </CardContent>
            )}
            <CardFooter className="flex justify-between items-center gap-2 mt-4">
                {/* <span>Card no: {index+1} / {total}</span> */}
                <button
                onClick={async () =>{
                    const updated = await rateCard(card._id, "again");
                    if(updated && updated.data){
                        dispatch(updateFlashcard({
                            setId: updated.data.parentSetId,
                            card: updated.data
                        }));
                    }
                     onNext();
                }}
                className="flex-1 py-2 text-red-700 font-bold text-sm transition"
                >
                    Again
                </button>
                <span className="flex-1 ml-12 text-gray-700 font-bold">|</span>
                <button
                onClick={async () =>{ 
                    const updated = await rateCard(card._id, "hard");
                    if(updated && updated.data){
                        dispatch(updateFlashcard({
                            setId: updated.data.parentSetId,
                            card: updated.data
                        }));
                    }
                    onNext();
                }}
                className="flex-1 py-2 text-orange-700 font-bold text-sm transition"
                >
                    Hard
                </button>
                <span className="flex-1 ml-12 text-gray-700 font-bold">|</span>
                <button
                onClick={async() =>{
                     const updated = await rateCard(card._id, "good");
                     if(updated && updated.data){
                        dispatch(updateFlashcard({
                            setId: updated.data.parentSetId,
                            card: updated.data
                        }));
                     }
                     onNext();
                }}
                className="flex-1 py-2 text-green-700 font-bold text-sm transition"
                >
                    Good
                </button>
                <span className="flex-1 ml-12 text-gray-700 font-bold">|</span>
                <button
                onClick={async() =>{
                     const updated = await rateCard(card._id, "easy");
                     if(updated && updated.data){
                        dispatch(updateFlashcard({
                            setId: updated.data.parentSetId,
                            card: updated.data
                        }));
                     }
                     onNext();
                }}
                className="flex-1 py-2 text-blue-700 font-bold text-sm transition"
                >
                    Easy
                </button>
            </CardFooter>
        </Card>
    )
}

export default FlashcardStudyCard;
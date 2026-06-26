/**
 * @component FlashcardSetViewerSheet
 * @description A high-fidelity study interface for reviewing flashcards within a slide-over Sheet.
 * * * Core Technical Features:
 * - SRS Logic: Implements automated progress tracking (New, Due, Completed) using useMemo 
 * to categorize cards based on Spaced Repetition due dates.
 * - Dynamic Regeneration: Integrated with an AI-backend to refresh/regenerate outdated 
 * card sets when the source resource (notes/folder) changes.
 * - State Synchronization: Orchestrates Redux updates across multiple slices 
 * (flashcardSlice and flashcardSetSlice) to ensure UI consistency.
 * - UX/Accessibility: Uses Radix-UI primitives (Sheet, VisuallyHidden) for 
 * screen-reader compliance and smooth transitions.
 */
"use client";

import { useFlashcardSetDetails } from "@/hooks/flashcard/useFlashcardSetDetails";
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import FlashcardSetHeader from "./viewer/flashcard-set-header";
import FlashcardStudyCard from "./viewer/flashcard-study-card";
import FlashcardProgressList from "./viewer/flashcard-progress-list";
import { useEffect, useMemo, useState } from "react";
import FlashcardLoading from "../ui/flashcard-loading";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChevronLeft, ChevronRight, Loader2, PartyPopper } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useFlashcardSet } from "@/hooks/flashcard/useFlashcardSet";
import { setFlashcardsForSet } from "@/store/slices/flashcardSlice";
import { updateSingleSet } from "@/store/slices/flashcardSetSlice";
import { useLastStudied } from "@/hooks/useLastSudied";
import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";

interface FlashcardSetViewerSheetProps{
    setId: string;
    initialIndex?: number;
}

const FlashcardSetViewerSheet: React.FC<FlashcardSetViewerSheetProps> = ({ 
    setId,
    initialIndex = 0,
}) => {
    const dispatch = useDispatch();
    const [ activeIndex, setActiveIndex ] = useState(initialIndex);
    const [ sessionMode, setSessionMode ] = useState<"all" | "due-only">("due-only");
    const [ sessionStats, setSessionStats ] = useState({
        again: 0, hard: 0, good: 0, easy: 0, startTime: new Date(),
    });
        
    const EMPTY: any[] = [];

    // --- State Selection ---
    // Accesses cards from a normalized map in Redux to ensure O(1) lookup performance
    const cards = useSelector((state: RootState) => {
        const map = state.flashcard.cardsBySet;
        return map && map[setId] ? map[setId] : EMPTY;
    });

    const set = useSelector((state: RootState) => 
        state.flashcardSet.sets.find((s) => s._id === setId)
    );
        
    const { updateLastStudied } = useLastStudied();

    useEffect(() => {
        setActiveIndex(initialIndex);
    },[setId]);

    useEffect(() => {
        if(!set || cards.length === 0) return;

        updateLastStudied({
            setId: set._id,
            setTitle: set.title,
            cardIndex: activeIndex,
            totalCards: cards.length,
            resourceType: set.resourceType,
            workspaceId: set.workspaceId,
            folderId: set.folderId,
        });
    },[
        activeIndex,
        setId,
        set?._id,
        cards.length,
    ]);

    /**
     * @memoized stats
     * Calculates flashcard categories (New, Due, Completed) based on SRS metadata.
     * Prevents expensive re-calculations on every render unless the cards array changes.
     */
    const stats = useMemo(() => {
        return cards.reduce((acc,card) => {
            const dueDate = card.progress?.dueDate;
            if(!dueDate){
                acc.new++;
            }else{
                const isDue = new Date(dueDate) <= new Date();
                if(isDue) acc.due++;
                else acc.completed++;
            }
            return acc;
        }, { new: 0, due: 0, completed: 0});
    },[cards]);
        
    const sessionCards = useMemo(() => {
        if(sessionMode === "all") return cards;
        const today = new Date();
        return cards.filter(card => {
            if(!card.progress?.dueDate) return true;
            return new Date(card.progress.dueDate) <= today;
        });
    },[
        cards,
        sessionMode,
    ]);

    const isSessionFinished = activeIndex >= cards.length && cards.length > 0;

    const todoCount = stats.new + stats.due;

    // --- Custom Hooks for Business Logic ---
    const { loading, setLoading } = useFlashcardSetDetails(setId);
    const { deleteFlashcardSet } = useFlashcardGenerator();
    const { regenerating, regenerateFlashcardSet } = useFlashcardSet(set?.workspaceId!);

    // --- Navigation Handlers ---
    const goNext = () => {
        setActiveIndex((prev) => prev+1);
    }

    const goPrev = () => {
        setActiveIndex((prev) => {
            if(prev > 0) return prev - 1;
            return prev;
        });
    }
            
    /**
    * @handler handleRegenerateFlashcardSet
    * Triggers an AI-driven regeneration of the set. 
    * Resets study progress and synchronizes the local Redux store with new data.
    */
    const handleRegenerateFlashcardSet = async () => {
        if(!set) return;
        setLoading(true)
        try {
            const newFlashcardSet = await regenerateFlashcardSet(set._id);
            if(!newFlashcardSet){
                console.warn("[FlashcardSetViewerSheet] Error regenerating flashcard set", newFlashcardSet);
                return;
            }
            dispatch(setFlashcardsForSet({
                setId: set._id,
                cards: newFlashcardSet.flashcards
            }));
            dispatch(updateSingleSet({
                _id: set._id,
                ...newFlashcardSet.flashcardSet,
                isOutdated: false
            }));
            setActiveIndex(0);
            setSessionStats({
                again: 0,
                hard: 0,
                good: 0,
                easy: 0,
                startTime: new Date(),
            });
        } catch (error: any) {
            console.error("[FlashcardSetViewerSheet] Error regenerating flashcard set in catch", 
                error?.response?.status,
                error?.response?.data
            );
        }finally{
            setLoading(false);
        }
    }

    /**
     * @function deleteFlashcard
     * @description Delete Flashcard Set using the SetId
     */
    const deleteFlashcard = async (setId: string) => {
        try {
            const result = await deleteFlashcardSet(setId);
            if(!result || !result.success){
                console.warn("[RevisionSidebar] Error deleting flashcard set", result);
            }
        } catch (error) {
            console.warn("[RevisionSidebar] Error deleting flashcard set", error);
        }
    }

    // --- Conditional Rendering: Loading & Empty States ---
    if(loading){
        return(
            <SheetContent className="!w-full sm:!max-w-[800px]">
                <VisuallyHidden>
                    <SheetTitle></SheetTitle>
                    <SheetDescription></SheetDescription>
                </VisuallyHidden>
                <FlashcardLoading />
            </SheetContent>
        )
    }

    if(!cards || cards.length === 0){
        return(
            <SheetContent className="!w-full sm:!max-w-[800px]">
                <VisuallyHidden>
                    <SheetTitle></SheetTitle>
                    <SheetDescription></SheetDescription>
                </VisuallyHidden>
                No Flashcards Found.
            </SheetContent>
        )
    }

    return (
        <SheetContent className="!w-full sm:!max-w-[800px] flex flex-col h-full">
            <SheetHeader>
                <SheetTitle className="flex flex-wrap items-center justify-between border-b
                border-gray-700 py-2 bg-background gap-2 sm:gap-5">
                    {set && <FlashcardSetHeader  set={set} onDelete={deleteFlashcard}/>}
                    {regenerating 
                        ? <Loader2 className="animate-spin w-6 h-6"/>
                        :<button
                            onClick={handleRegenerateFlashcardSet}
                            className={`px-2 py-1 rounded mr-4 ${set?.isOutdated 
                                ? "bg-yellow-500 text-black hover:bg-yellow-400" 
                                : "bg-purple-800 text-white hover:bg-purple-600"} text-[11px] font-bold`}
                        >
                            Regenerate Set
                        </button>}
                </SheetTitle>
                {/* SRS Progress Dashboard */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 sm:px-4
                py-2 bg-gray-900/30 border-b border-gray-800">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[11px] font-bold text-gray-400">NEW: {stats.new}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-[11px] font-bold text-gray-400">DUE: {stats.due}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[11px] font-bold text-gray-400">DONE: {stats.completed}</span>
                    </div>
                </div>
                <VisuallyHidden>
                    <SheetDescription></SheetDescription>
                </VisuallyHidden>
            </SheetHeader>

            {/* Outdated Content Alert */}
            {set?.isOutdated && (
                <div className="mt-2 px-3 py-2 rounded bg-yellow-900/50 border border-yellow-300
                text-yellow-300 text-sm font-semibold flex justify-between items-center">
                    <span>⚠️ Notes updated after generating this Flashcard Set. </span>    
                </div>
            )}
                    
            {/* Main Study Area */}
            <div className="flex-1 overflow-y-auto px-2">
                {isSessionFinished ? (
                    <div className={`flex flex-col items-center justify-center h-full gap-4`}>
                        <h2 className="text-2xl font-bold">Session Complete! 
                            <PartyPopper size={15} className="animate-bounce"/>
                        </h2>
                        <p>You&apos;ve reviewed all cards in this set for today.</p>
                        <button onClick={() => setActiveIndex(0)}>Review Again</button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-3 mt-8 w-full mx-auto">
                        <button
                            onClick={goPrev}
                            disabled={activeIndex === 0}
                            className={`flex items-center justify-center p-2 rounded-full border border-gray-300 hover:bg-gray-100
                            disabled:opacity-40 disabled:hover:bg-transparent h-[30px]`}
                        >
                            <ChevronLeft size={20}/>
                        </button>
                        <FlashcardStudyCard 
                            card={cards[activeIndex]}
                            index={activeIndex}
                            total={cards.length}
                            onNext={goNext}
                        />
                        <button
                            disabled={activeIndex === cards.length -1 }
                            onClick={goNext}
                            className={`flex items-center justify-center p-2 rounded-full border border-gray-300 hover:bg-gray-100
                            disabled:opacity-40 disabled:hover:bg-transparent h-[30px]`}
                        >
                            <ChevronRight size={20}/>
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Navigation: Progress Overview */}
            <div className="border-t border-gray-700 py-3 bg-background">
                <FlashcardProgressList 
                    setId={setId}
                    onSelect={(id) => {
                        const index = cards.findIndex(card => card._id === id);
                        if(index !== -1) setActiveIndex(index);
                    }}
                />
            </div>
        </SheetContent>
    )
}

export default FlashcardSetViewerSheet;

    
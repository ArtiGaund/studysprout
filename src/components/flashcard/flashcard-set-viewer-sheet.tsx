/**
 * This component is used to view a flashcard set
 */
"use client";

import { useFlashcardSetDetails } from "@/hooks/flashcard/useFlashcardSetDetails";
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import FlashcardSetHeader from "./viewer/flashcard-set-header";
import FlashcardStudyCard from "./viewer/flashcard-study-card";
import FlashcardProgressList from "./viewer/flashcard-progress-list";
import { useState } from "react";
import FlashcardLoading from "../ui/flashcard-loading";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

    interface FlashcardSetViewerSheetProps{
        setId: string;
    }
    const FlashcardSetViewerSheet: React.FC<FlashcardSetViewerSheetProps> = ({ 
        setId
    }) => {

        const [ activeIndex, setActiveIndex ] = useState(0);
        const EMPTY: any[] = [];
        const cards = useSelector((state: RootState) => {
             const map = state.flashcard.cardsBySet;
             return map && map[setId] ? map[setId] : EMPTY;
        });
        const set = useSelector((state: RootState) => state.flashcardSet.sets.find((s) => s._id === setId));

        const {
            loading
        } = useFlashcardSetDetails(setId);
        
        const goNext = () => {
            setActiveIndex((prev) => {
                if(prev < cards.length -1) return prev + 1;
                return prev;
            });
        }

        const goPrev = () => {
            setActiveIndex((prev) => {
                if(prev > 0) return prev - 1;
                return prev;
            });
        }

        if(loading){
            return(
                <SheetContent className="w-full !max-w-[800px]">
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
                <SheetContent className="w-full !max-w-[800px]">
                     <VisuallyHidden>
                        <SheetTitle></SheetTitle>
                        <SheetDescription></SheetDescription>
                    </VisuallyHidden>
                    No Flashcards Found.
                </SheetContent>
            )
        }

        return (
            <SheetContent className="w-full !max-w-[800px] flex flex-col h-full">
                <SheetHeader>
                   <SheetTitle className="border-b border-gray-700 py-2 bg-background">
                        <FlashcardSetHeader  setTitle={set?.title!}/>
                    </SheetTitle>
                   <VisuallyHidden>
                    <SheetDescription></SheetDescription>
                   </VisuallyHidden>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-2">
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
                </div>
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

   
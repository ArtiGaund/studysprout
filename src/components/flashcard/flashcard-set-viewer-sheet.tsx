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
    import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
    import { useDispatch, useSelector } from "react-redux";
    import { RootState } from "@/store/store";
    import { deleteFlashcardSetService } from "@/services/flashcardServices";
    import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
    import { useFlashcardSet } from "@/hooks/flashcard/useFlashcardSet";
import { setFlashcardsForSet } from "@/store/slices/flashcardSlice";
import { updateSingleSet } from "@/store/slices/flashcardSetSlice";

        interface FlashcardSetViewerSheetProps{
            setId: string;
        }
        const FlashcardSetViewerSheet: React.FC<FlashcardSetViewerSheetProps> = ({ 
            setId
        }) => {

            const [ activeIndex, setActiveIndex ] = useState(0);
            // const [ regenerate, setRegenerate ] = useState(false);
            const EMPTY: any[] = [];
            const cards = useSelector((state: RootState) => {
                const map = state.flashcard.cardsBySet;
                return map && map[setId] ? map[setId] : EMPTY;
            });
            const set = useSelector((state: RootState) => state.flashcardSet.sets.find((s) => s._id === setId));

            const {
                loading,
                setLoading,
            } = useFlashcardSetDetails(setId);

            const dispatch = useDispatch();
            const {
                regenerating,
                regenerateFlashcardSet
            } = useFlashcardSet(set?.workspaceId!);
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
            console.log("[flashcard-set-viewer-sheet] set: ",set);

            const handleRegenerateFlashcardSet = async () => {
                if(!set) return;
                setLoading(true)
                try {
                    const payload = {
                        workspaceId: set.workspaceId,
                        folderId: set.folderId,
                        resourceId: set.resourceId,
                        resourceType: set.resourceType,
                        cardCount: set.totalCards,
                        desiredTypes: set.desiredTypes
                    }
                    
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
                } catch (error: any) {
                    console.error("[FlashcardSetViewerSheet] Error regenerating flashcard set in catch", 
                        error?.response?.status,
                        error?.response?.data
                    );
                }finally{
                    setLoading(false);
                }
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
                    <SheetTitle className="flex items-center justify-between border-b border-gray-700 py-2 bg-background gap-5">
                            <FlashcardSetHeader  setTitle={set?.title!}/>
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
                        
                    <VisuallyHidden>
                        <SheetDescription></SheetDescription>
                    </VisuallyHidden>
                    </SheetHeader>
                    {set?.isOutdated && (
                        <div className="mt-2 px-3 py-2 rounded bg-yellow-900/50 border border-yellow-300
                        text-yellow-300 text-sm font-semibold flex justify-between items-center">
                            <span>⚠️ Notes updated after generating this Flashcard Set. </span>
                        
                        </div>
                    )}
                    
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

    
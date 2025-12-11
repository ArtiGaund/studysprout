'use client';

import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { twMerge } from "tailwind-merge";
import { Button } from "../ui/button";
import { Loader, Loader2, PlusIcon } from "lucide-react";
import { Sheet, SheetTrigger } from "../ui/sheet";
import FlashcardTypesForm from "../flashcard/flashcard-types-form";
import { useEffect, useState } from "react";
import FlashcardSetViewerSheet from "../flashcard/flashcard-set-viewer-sheet";
import RevisionFlashcardSetList from "./revision-flashcard-set-list";
import { useFlashcardSet } from "@/hooks/flashcard/useFlashcardSet";
import { useParams } from "next/navigation";
import {  useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
import { GenerationPayload } from "@/services/flashcardServices";

interface RevisionSidebarProps{
    params: { workspaceId: string};
    className?: string;
}
const RevisionSidebar: React.FC<RevisionSidebarProps> = ({ params, className }) => {
    const [generatingFlashcard, setGeneratingFlashcard ] = useState(false);
    const currentContext = useSelector((state: RootState) => state.context.currentResource);
    const sets = useSelector((state: RootState) => state.flashcardSet.sets);
    const [ lastPayload, setLastPayload] = useState<GenerationPayload | null>(null);
    const { isRevisionSidebarOpen } = useRevisionSidebar();
    const [ isFlashcardTypeSheetOpen, setFlashcardTypeSheetOpen ] = useState(false);
    const [ flashcardSetViewerId, setFlashcardSetViewerId ] = useState<string | null>(null);
    const { workspaceId, folderId } = useParams();
    const currentWorkspaceId = Array.isArray(workspaceId) ? workspaceId[0] : workspaceId;
    const {
        loading
    } = useFlashcardSet(currentWorkspaceId);
    const { 
        deleteFlashcardSet,
        generateCards,
    } = useFlashcardGenerator();

    const closeFlashcardTypeSheet = () => setFlashcardTypeSheetOpen(false);
    const openFlashcardSetViewerSheet = (setId: string) => {
        setFlashcardSetViewerId(setId);
    }
    const closeFlashcardSetViewerSheet = () => {
        setFlashcardSetViewerId(null);
    }

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

    const generateFlashcardOnThisLevel = async () => {
        setGeneratingFlashcard(true);
       try {
         const finalCardCount = 5;
         const desiredTypes = [
            "question-answer", 
            "fill-in-the-blank", 
            "mcq"
        ] as ("question-answer" | "fill-in-the-blank" | "mcq")[];
 
         const payload = {
             workspaceId: workspaceId as string,
             folderId: (folderId ?? "") as string,
             resourceId: currentContext.id ?? "",
             resourceType: currentContext.type ?? "Workspace",
             cardCount: finalCardCount,
             desiredTypes,
         }
         setLastPayload(payload);

         const result = await generateCards(payload);

         if(!result || !result.success){
            console.warn("[RevisionSidebar] Error generating flashcards", result);
         }
       } catch (error) {
            console.warn("[RevisionSidebar] Error generating flashcards", error);
       }finally{
        setGeneratingFlashcard(false);
       }
        
    }
    return(
        <>
        { isRevisionSidebarOpen &&(
            <aside className={twMerge('hidden sm:flex sm:flex-col w-[350px] shrink-0 p-2 md:gap-4 !justify-between',
              className
                )}>
                <span className="flex py-3 px-2">Revision Bar</span>
                {generatingFlashcard ? 
                <Loader2 className="w-6 h-6 animate-spin"/>
                :(<div className="flex flex-row gap-12 w-full overflow-hidden">
                    
                   <Button
                     className="w-[10rem] h-auto bg-purple-950 hover:bg-purple-800"
                     onClick={generateFlashcardOnThisLevel}
                     >Generate FlashCard</Button>
                    <div className="flex shrink-0 w-6 h-6 mt-1">
                        <Sheet open={isFlashcardTypeSheetOpen} onOpenChange={setFlashcardTypeSheetOpen}>
                            <SheetTrigger asChild>
                                <button>
                                    <PlusIcon 
                                    className="w-full h-full flex"
                                    />
                                </button>
                        </SheetTrigger>
                        <FlashcardTypesForm 
                        closeFlashcardTypeSheet={closeFlashcardTypeSheet}
                        openFlashcardSetViewerSheet={openFlashcardSetViewerSheet}
                        />
                        </Sheet>
                        <Sheet open={!!flashcardSetViewerId} onOpenChange={closeFlashcardSetViewerSheet}>
                            <FlashcardSetViewerSheet 
                            setId={flashcardSetViewerId!}
                            />
                        </Sheet>
                    </div>
                </div>)}
                <div className="flex mt-5">
                    { loading ? 
                    <Loader2 className="w-[16px] h-[16px]" /> 
                    : <RevisionFlashcardSetList 
                    sets={sets}
                    onOpen={openFlashcardSetViewerSheet}
                    onDelete={deleteFlashcard}
                    />
                    }
                    
                </div>
            </aside>
        )}
        </>
    )
}

export default RevisionSidebar;
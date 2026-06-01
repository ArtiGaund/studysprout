"use client";

import { useLastStudied } from "@/hooks/useLastSudied";
import { useEffect, useMemo, useState } from "react";
import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
import { EmptyHero } from "./empty-hero-banner";
import { MasterySetCard } from "../folder-view/mastery-set-card";
import { ActionItem } from "./action-item";
import { Loader2, Sparkle } from "lucide-react";
import { ChildrenFlashcardSetList } from "./children-flashcard-set-list";
import { Sheet } from "../ui/sheet";
import FlashcardSetViewerSheet from "../flashcard/flashcard-set-viewer-sheet";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ReduxFlashcardSet } from "@/types/state.type";
import { clearLastStudied } from "@/store/slices/lastStudiedSlice";
import { useFlashcardSet } from "@/hooks/flashcard/useFlashcardSet";

// Convert ReduxFlashcardSet -> FlashcardSetOverview

interface FlashcardSectionProps{
    workspaceId: string;
    folderId?: string;
}

export const FlashcardSection = ({
    workspaceId,
    folderId,
}: FlashcardSectionProps) => {
    const dispatch = useDispatch();

    useFlashcardSet(workspaceId);
    const resourceId = folderId ?? workspaceId;
    const resourceType = folderId ? "Folder" : "Workspace";
    const sectionLabel = folderId ? "This Folder" : "This Workspace";
    const childResourceType = folderId ? "File" : "Folder";

    const [ selectedSetId, setSelectedSetId ] = useState<string | null>(null);

    const { lastStudied, updateLastStudied } = useLastStudied();

    const allSets = useSelector((state: RootState) => state.flashcardSet.sets);

    const resumeReviewedCount = useMemo(() => {
        if(!lastStudied?.setId || !allSets) return 0;
        const set = allSets.find(s => s._id === lastStudied.setId);
        if(!set) return 0;

        return set.totalCards - (set.dueCount ?? 0);
    },[
        lastStudied,
        allSets,
    ]);

    useEffect(() => {
        if(allSets.length === 0) return;

        const lastStudiedExists = allSets.some(
            (s) => s._id === lastStudied?.setId
        );

        if(!lastStudiedExists && lastStudied){
            dispatch(clearLastStudied());
        }
    },[
        allSets,
        lastStudied,
        dispatch,
    ]);

    const current = useMemo(() => {
        const found = allSets.find(
            s => s.resourceId === resourceId && s.resourceType === resourceType
        );
        return found ? found : null;
    },[
        allSets,
        resourceId,
        resourceType,
    ]);

    const children = useMemo((): ReduxFlashcardSet[] => {
        if(resourceType === "Workspace"){
            return allSets
                .filter(s => s.workspaceId === workspaceId && s.resourceType === "Folder")
        }
        if(resourceType === "Folder"){
            return allSets
                .filter( s => s.folderId === resourceId && s.resourceType === "File")
        }
        return [];
    },[
        allSets,
        resourceId,
        resourceType,
        workspaceId,
    ]);
    
    const isRelevant = useMemo(() => {
        if(!lastStudied) return false;

        if(!folderId){
            // Workspace context
            return lastStudied.workspaceId === workspaceId;
        }
        // Folder context - case: folderId field match directly
        if(lastStudied.folderId === folderId) return true;

        // Folder context - case: Folder-type set whose resourceId is this folder
        if(lastStudied.resourceType === "Folder" && lastStudied.setId){
            return allSets.some(
                (s) => s._id === lastStudied.setId && s.resourceId === folderId
            );
        }

        return false;
    },[
        lastStudied,
        folderId,
        workspaceId,
        allSets,
    ]);

    const {
        generateCards,
        isGeneratingCards,
    } = useFlashcardGenerator({
       onSuccess: (newSetId: string) => {
            setSelectedSetId(newSetId);
       }
    });

    const handleGenerateFlashcardSet = async () => {
        try {
            await generateCards({
                resourceId,
                resourceType,
                workspaceId,
                cardCount: 5,
                desiredTypes: ["question-answer", "mcq", "fill-in-the-blank"],
            });
        } catch (error: any) {
            console.error("[Flashcard Section] Failed to generate flashcard set: ",error.message);
        }
    }

    const handleOpenSet = (set: ReduxFlashcardSet) => {
        setSelectedSetId(set._id);

        const resumeIndex = lastStudied?.setId === set._id 
            ? lastStudied.cardIndex : 0;
       
        updateLastStudied({
            setId: set._id,
            setTitle: set.title,
            cardIndex: resumeIndex,
            totalCards: set.totalCards,
            resourceType: set.resourceType,
            workspaceId: set.workspaceId,
            folderId: set.folderId,
        });
    }

    const handleResume = () => {
        if(lastStudied?.setId) setSelectedSetId(lastStudied.setId);
    }
    
    return (
        <div className="flex flex-col gap-y-3">

            {/* Hero */}
            {isRelevant && lastStudied  ? (
                <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4">
                    <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-2">
                        Resume
                    </p>
                    <p className="text-sm font-semibold text-white truncate">
                        {lastStudied.setTitle}
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5">
                        Card {resumeReviewedCount + 1} of {lastStudied.totalCards}
                    </p>
                    <button
                        onClick={handleResume}
                        className="mt-3 w-full bg-purple-600 hover:bg-purple-500 text-white
                        text-xs font-medium py-2 rounded-lg transition-all"
                    >
                        Continue Studying
                    </button>
                </div>
            ): (
                <EmptyHero />
            )}

            {/* Current level set */}
            <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                    {sectionLabel}
                </p>
                {current ? (
                    <MasterySetCard 
                        currentFlashcardSet={current}
                        onClick={() => handleOpenSet(current)}
                    />
                ) : (
                    <ActionItem 
                        icon={isGeneratingCards ? Loader2 : Sparkle}
                        label={isGeneratingCards ? "Generating..." : "Generate Flashcards"}
                        handleAction={handleGenerateFlashcardSet}
                        disabled={isGeneratingCards}
                        iconClassName={isGeneratingCards ? "animate-spin text-purple-400 w-4 h-4" : null}
                        isGenerating={isGeneratingCards}
                    />
                )}
            </div>

            {/* Children list */}
            {children.length > 0 && (
                <ChildrenFlashcardSetList 
                    resourceType={childResourceType}
                    childrenFlashcardSets={children}
                    onSelect={handleOpenSet}
                />
            )}

            {/* Sheet */}
            <Sheet
                open={!!selectedSetId}
                onOpenChange={(open) => {
                    if(!open) setSelectedSetId(null);
                }}
            >
                {selectedSetId && 
                    <FlashcardSetViewerSheet 
                        setId={selectedSetId}
                        initialIndex = {
                            lastStudied?.setId === selectedSetId ? lastStudied.cardIndex : 0
                        }
                    />
                }
            </Sheet>
        </div>
    )
}
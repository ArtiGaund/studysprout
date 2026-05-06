/**
 * --- Shared Editor Content ---
 * All the props the three panels need, wired together. Used both in the inline layout (large screen)
 * and inside the fullscreen popup.
 */

'use client';

import React from "react";
import { CollapsedNavigation } from "./triple-panel-layout/Collapsed-Navigation";
import { RevisionBar } from "./triple-panel-layout/Revision-Bar";
import { EditorCanvas } from "./triple-panel-layout/editor-canvas";
import { DescriptionPart } from "./description-part";

export interface EditorContentProps{
    setHasNewFileSet: (v: boolean) => void;
    setActiveSet: (v: 'folder' | 'file' | 'custom' | null) => void;
    setView: (v: 'idle' | 'customizing' | 'reviewing') => void;
    activeSet: 'folder' | 'file' | 'custom' | null;
    hasNewFileSet: boolean;
    hasCustomSet: boolean;
    setHasCustomSet: (v: boolean) => void;
    activeHint: 'none' | 'highlight' | 'generate' | 'plus' | 'sidebar';
    artiStatus: string;
    isHighlightingSimulated: boolean;
    showSimulationPopup: boolean;
    showLivePopup: boolean;
    setShowLivePopup: (v: boolean) => void;
    view: 'idle' | 'customizing' | 'reviewing';
    setIsFlipped: (v: boolean) => void;
    isFlipped: boolean;
    reviewIndex: number;
    currentCards: { q: string; a: string; }[];
    docRef: React.RefObject<HTMLDivElement>;
    setReviewIndex: (v: number) => void;
    flashcardSets: Record<'file' | 'folder' | 'custom', { title: string; data: { q: string; a: string }[] }>;
    fillHeight?: boolean;
}


export const EditorContent: React.FC<EditorContentProps> = ({
    setHasNewFileSet,
    setActiveSet,
    setView,
    activeSet,
    hasNewFileSet,
    hasCustomSet,
    setHasCustomSet,
    activeHint,
    artiStatus,
    isHighlightingSimulated,
    showSimulationPopup,
    showLivePopup,
    setShowLivePopup,
    view,
    setIsFlipped,
    isFlipped,
    reviewIndex,
    currentCards,
    docRef,
    setReviewIndex,
    flashcardSets,
    fillHeight = false,
}) => {

    const heightClass = fillHeight ? 'h-full' : 'h-[740px]';
    return(
        <div className={`flex flex-row gap-4 w-full
        ${fillHeight ? 'h-full' : ''}
        `}
        
        >
                {/* LEFT PART: Triple-Panel Layout */}
            <div className={`flex ${heightClass} w-[70%] overflow-hidden rounded-3xl 
            border border-white/10 bg-[#080C0C] shadow-2xl relative`}>
                    
                    {/* PANEL 1: Global Collapsed Navigation (Mimics Screenshot 1) */}
                    
                <CollapsedNavigation />

                    {/* PANEL 2: Revision Bar (Screenshot 1) */}
                <RevisionBar 
                    setHasNewFileSet={setHasNewFileSet}
                    setActiveSet={setActiveSet}
                    setView={setView}
                    activeSet={activeSet!}
                    hasNewFileSet={hasNewFileSet}
                    hasCustomSet={hasCustomSet}
                    setHasCustomSet={setHasCustomSet}
                    activeHint={activeHint}
                />

                    {/* PANEL 3: Content Canvas & Editor Simulation (Screenshot 1) */}
                <EditorCanvas 
                   artiStatus={artiStatus}
                   isHighlightingSimulated={isHighlightingSimulated}
                   showSimulationPopup={showSimulationPopup}
                   showLivePopup={showLivePopup}
                   setShowLivePopup={setShowLivePopup}
                   view={view}
                   setView={setView}
                   setActiveSet={setActiveSet}
                   setIsFlipped={setIsFlipped}
                   isFlipped={isFlipped}
                   reviewIndex={reviewIndex}
                   activeSet={activeSet!}
                    currentCards={currentCards}
                    docRef={docRef}
                    setReviewIndex={setReviewIndex}
                    setHasCustomSet={setHasCustomSet}
                    hasCustomSet={hasCustomSet} 
                    activeHint={activeHint}
                />
                </div>

                {/* RIGHT PART: Description (30%) */}
                <DescriptionPart 
                    view={view}
                    setActiveSet={setActiveSet}
                    setView={setView}
                    flashcardSets={flashcardSets}
                    currentCards={currentCards}
                    reviewIndex={reviewIndex}
                    isFlipped={isFlipped}
                    setIsFlipped={setIsFlipped}
                    activeSet={activeSet}
                    activeHint={activeHint}
                    compact={fillHeight}
                />
                </div>
    )
}
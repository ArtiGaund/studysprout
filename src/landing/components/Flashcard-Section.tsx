'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { CollapsedNavigation } from "./flashcard-parts/triple-panel-layout/Collapsed-Navigation";
import { RevisionBar } from "./flashcard-parts/triple-panel-layout/Revision-Bar";
import { EditorCanvas } from "./flashcard-parts/triple-panel-layout/editor-canvas";
import { DescriptionPart } from "./flashcard-parts/description-part";

export const FlashcardSection = () => {
    // UI View Management
    const [view, setView] = useState<'idle' | 'customizing' | 'reviewing'>('idle');
    const [activeSet, setActiveSet] = useState<'folder' | 'file' | 'custom' | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [reviewIndex, setReviewIndex] = useState(0);
    const [activeHint, setActiveHint ] = useState< 
                'none' |
                'highlight' | 
                'generate' | 
                'plus' |
                'sidebar'>('none');

    // Automation States
    const [artiStatus, setArtiStatus] = useState("Arti waiting...");
    const [artiStep, setArtiStep] = useState(0); 
    const [showSimulationPopup, setShowSimulationPopup] = useState(false);
    const [isHighlightingSimulated, setIsHighlightingSimulated] = useState(false);
    const [hasNewFileSet, setHasNewFileSet] = useState(false);
    const [hasCustomSet, setHasCustomSet] = useState(false);

    // User Selection States (Live)
    const [showLivePopup, setShowLivePopup] = useState(false);
    const docRef = useRef<HTMLDivElement>(null);

    // User selection interaction logic
    const handleTextSelection = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setShowLivePopup(false);
            return;
        }
        // Ensure selection is inside the document content
        if (docRef.current && selection.anchorNode && docRef.current.contains(selection.anchorNode)) {
            setShowLivePopup(true);
            setArtiStep(99); // Stop automation if user takes over
            setIsHighlightingSimulated(false); // Clear simulated highlight
            setArtiStatus("User selected. Manual override.");
            setActiveHint('none');
        }
    }, []);

  // Set up live selection observer
  useEffect(() => {
    document.addEventListener('selectionchange', handleTextSelection);
    return () => document.removeEventListener('selectionchange', handleTextSelection);
  }, [handleTextSelection]);

    // Arti Automation Logic: Simulating the Highlight-to-Flashcard
    useEffect(() => {
        let alive = true;
        const runAnimation = async () => {
            while (alive && view === 'idle' && artiStep !== 99) {
            
            // 1. Highlight Cue
            setArtiStatus("Try selecting text...");
            setActiveHint('highlight');
            await new Promise(r => setTimeout(r, 4000));
            if (!alive || artiStep === 99) break;

            // 2. Generate Cue
            setArtiStatus("Or use the Generate button...");
            setActiveHint('generate');
            await new Promise(r => setTimeout(r, 4000));
            if (!alive || artiStep === 99) break;

            // 3. Plus Cue
            setArtiStatus("Customize with the Plus icon...");
            setActiveHint('plus');
            await new Promise(r => setTimeout(r, 4000));
            if (!alive || artiStep === 99) break;

            // 4. Sidebar Cue
            setArtiStatus("Review existing sets...");
            setActiveHint('sidebar');
            await new Promise(r => setTimeout(r, 4000));
            if (!alive || artiStep === 99) break;
            
            // Small pause before restarting the loop
            setActiveHint('none');
            await new Promise(r => setTimeout(r, 1000));
        }
        };

        runAnimation();
        return () => { alive = false; };
    }, [view, artiStep]);

    // Data Structure for Flashcards
    const flashcardSets = {
        folder: {
            title: "ML_Machine_Learning",
        data: [
                { 
                    q: "Explain the difference between Overfitting and Underfitting in Machine Learning.", 
                    a: "Overfitting occurs when a model learns noise in the training data too well, leading to poor generalization on new data. Underfitting happens when a model is too simple to capture the underlying trend of the data." 
                },
                { 
                    q: "MCQ: What is the primary goal of the Gradient Descent algorithm?\n\nA) To maximize the accuracy\nB) To minimize the cost function\nC) To increase the learning rate\nD) To reduce the number of features", 
                    a: "B) To minimize the cost function." 
                },
                { 
                    q: "MCQ: Why is a 'Validation Set' used during the model training process?\n\nA) To train the model weights\nB) To test the model's final performance\nC) To tune hyperparameters and prevent overfitting\nD) To increase the size of the training data", 
                    a: "C) To tune hyperparameters and prevent overfitting." 
                }
            ]
        },
        file: {
            title: "Transformer_Architectures - Set",
            data: [
                { 
                    q: "What fundamental problem does the 'Self-Attention' mechanism solve?", 
                    a: "It allows the model to weigh the importance of different words in a sequence regardless of their distance." 
                },
                { 
                    q: "MCQ: What is the computational complexity of standard Self-Attention relative to sequence length (n)?\n\nA) O(n)\nB) O(n log n)\nC) O(n²)\nD) O(1)", 
                    a: "C) O(n²), which leads to memory challenges for long contexts." 
                },
                { 
                    q: "MCQ: In a standard Transformer, what is the output of the 'Encoder' block?\n\nA) Probability distribution over vocabulary\nB) Contextualized embeddings of the input\nC) A single summary vector\nD) Decoded text tokens", 
                    a: "B) Contextualized embeddings that represent the semantic meaning of the sequence." 
                }
            ]
        },
        custom: {
            title: "Custom Review - Deconvolved",
            data: [
                { q: "What metric determines the review interval in StudySprout's SRS?", a: "User historical retention rate and unique forgetting curve." },
                { q: "How many concepts are decomposed from a terminal folder structure?", a: "Typically 3-5 terminal concepts per markdown file." }
            ]
        }
    }

    const currentCards = activeSet ? flashcardSets[activeSet].data : [];

    return (
        <section id="flashcard-section" className="scroll-mt-20 relative py-32 px-6
         bg-[#050A0A] overflow-hidden">
            {/* Aesthetic Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                w-[1000px] h-[600px] rounded-full blur-[140px] bg-purple-600/10" />
            </div>

            <div className="max-w-7xl mx-auto flex flex-col items-center">
                
                {/* Branding Heading */}
                <div className="text-center mb-16 space-y-4">
                    <h3 className="text-[#63FF9D] font-mono text-xs uppercase tracking-[0.4em]
                     opacity-80">
                        Active Recall Engine
                    </h3>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                        Precision <span className="text-purple-400">
                            Flashcard Generation
                            </span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
                        Transform specific workspaces, folders, or files into targeted study sets.
                        You control the scope, format, and depth for each session.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-2 w-full">
                {/* LEFT PART: Triple-Panel Layout */}
                <div className="flex h-[740px] w-full lg:w-[70%] overflow-hidden rounded-3xl 
                border border-white/10 bg-[#080C0C] shadow-2xl relative">
                    
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
                    />
                </div>
            </div>

            <style jsx global>{`
                ::selection { background: #63FF9D; color: #000; }
                .bn-container, .bn-editor { background-color: transparent !important; }
            `}</style>
        </section>
    );
};
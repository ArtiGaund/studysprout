'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { EditorContent, EditorContentProps } from "./flashcard-parts/editor-content";
import { FullscreenPopup } from "./Dashboard-preview-parts/Fullscreen-Popup";
import { CollapsedPreview } from "./Dashboard-preview-parts/Collapsed-Preview";

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

    // Responsive fullscreen state
    const [ isExpanded, setIsExpanded ] = useState(false);
    const [ showCollapsed, setShowCollapsed ] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetToIdleDemo = useCallback(() => {
        setView('idle');
        setActiveSet(null);
        setIsFlipped(false);
        setReviewIndex(0);
        setShowLivePopup(false);
        setIsHighlightingSimulated(false);
        setShowSimulationPopup(false);
        setHasCustomSet(false);
        setActiveHint('none');
        setArtiStatus('Resuming guide...');

        setTimeout(() => {
            setArtiStep(0); //restarts the automatic useEffect loop
            setArtiStatus('Arti waiting...');
        },1000);
    },[]);

    const scheduleIdleReset = useCallback(() => {
        if(idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(resetToIdleDemo, 10000);
    },[resetToIdleDemo]);

    const handleAnyInteraction = useCallback(() => {
        setArtiStep(99);
        setActiveHint('none');
        scheduleIdleReset();
    },[scheduleIdleReset]);

    // Detect whether we should show the collapsed preview or the full inline editor.
    // Uses ResizeObserver on the container so it responds to any viewpoint width - not just
    // the predefined breakpoints
    useEffect(() => {
        const check = () => {
            if(containerRef.current){
                // Below 1024 px (lg) the flex-row layout collapses and the editor becomes too
                // cramped to interact with comfortably.
                setShowCollapsed(containerRef.current.offsetWidth < 768);
            }
        };
        check();
        const observer = new ResizeObserver(check);
        if(containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    },[]);

    // User selection interaction logic
    const handleTextSelection = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setShowLivePopup(false);
            return;
        }
        // Ensure selection is inside the document content
        if (
            docRef.current && 
            selection.anchorNode && 
            docRef.current.contains(selection.anchorNode)
        ) {
            setShowLivePopup(true);
            setArtiStep(99); // Stop automation if user takes over
            setIsHighlightingSimulated(false); // Clear simulated highlight
            setArtiStatus("User selected. Manual override.");
            setActiveHint('none');
            scheduleIdleReset();
        }
    }, [scheduleIdleReset]);

    // Set up live selection observer
    useEffect(() => {
        document.addEventListener('selectionchange', handleTextSelection);
        return () => document.removeEventListener('selectionchange', handleTextSelection);
    }, [handleTextSelection]);

    useEffect(() => {
        return () => {
            if(idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    },[]);

    // Arti Automation Logic: Simulating the Highlight-to-Flashcard
    useEffect(() => {
        let alive = true;
        const runAnimation = async () => {
            while (alive && view === 'idle' && artiStep !== 99) {
            
            // 1. Highlight Cue
            setArtiStatus("Try selecting text...");
            setActiveHint('highlight');
            setShowLivePopup(true);   //auto-show the "coming soon" popup
            await new Promise(r => setTimeout(r, 4000));
            setShowLivePopup(false);
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

    const editorProps: EditorContentProps = {
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
        artiStep,
    }

    return (
        <section 
        id="flashcard-section" 
        onClick={handleAnyInteraction}
        className="scroll-mt-20 relative py-32 px-6 bg-[#050A0A] overflow-hidden">
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

                {/* 
                    ---Editor container
                    The container is measured by ResizeObserver.
                    - >= 1024 px: full inline layout, no expand button.
                    - < 1024 px: collapsed preview + expand button
                */}
                <div ref={containerRef} className="w-full">
                    
                    {showCollapsed ? (
                        /*--- Small screen: hint badge + collapsed preview --- */
                        <div className="flex flex-col items-center gap-4">
                            {/* Hint badge */}
                            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20
                            rounded-full animate-bounce">
                                <p className="text-purple-400 text-[10px] font-black uppercase
                                tracking-widest">
                                    Tap Expand to interact with the flashcard editor
                                </p>
                            </div>

                            {/* Card wrapper - same visual chrome as the large-screen card */}
                            <div className="w-full rounded-3xl border border-white/10 
                            bg-[#080C0C]/80 backdrop-blur-3xl shadow-2xl overflow-hidden">
                                {/* Inner top bar */}
                                <div className="flex items-center justify-between px-4 py-3
                                border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400
                                        animate-pulse"/>
                                        <span className="text-white font-black uppercase
                                        tracking-widest text-[10px]">
                                            Flashcard Editor
                                            <span className="text-gray-500 font-medium ml-2">
                                                - Interactive Playground
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* Collapsed preview with ghost chrome */}
                                <div className="p-1">
                                    <CollapsedPreview 
                                    onExpand={() => setIsExpanded(true)}
                                    heading="Interactive Flashcard Editor"
                                    subHeading=" Tap to launch full editor experience"
                                    type="flashcard"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* --- Large screen: full inline editor --- */
                        <EditorContent {...editorProps}/>
                    )}
                </div>
            </div>

            {/* --- Fullscreen popup (portal -> always above navbar) */}
            <FullscreenPopup 
            isOpen={isExpanded}
            onClose={() => setIsExpanded(false)}
            sandboxContent={ <EditorContent {...editorProps} fillHeight={true}/>}
            naturalWidth={1400}
            naturalHeight={740}
            type="flashcard"
            />

            {/*  */}

            <style jsx global>{`
                ::selection { background: #63FF9D; color: #000; }
                .bn-container, .bn-editor { background-color: transparent !important; }
            `}</style>
        </section>
    );
};
'use client';

import { Activity, MousePointer2, Wand2, Plus, Zap, Brain } from "lucide-react";
import { Flashcard } from "./triple-panel-layout/editor-canvas";
import { useEffect, useRef, useState } from "react";

interface FlashcardSet {
    title: string;
    data: Flashcard[];
}

interface DescriptionPartProps {
    view: 'idle' | 'reviewing' | 'customizing';
    setActiveSet: (val: 'file' | 'folder' | 'custom') => void;
    setView: (val: 'idle' | 'reviewing' | 'customizing') => void;
    flashcardSets: Record<'file' | 'folder' | 'custom', FlashcardSet>;
    currentCards: Flashcard[];
    reviewIndex: number;
    isFlipped: boolean;
    setIsFlipped: (val: boolean) => void;
    activeSet: 'file' | 'folder' | 'custom' | null;
    activeHint: 'none' | 'highlight' | 'generate' | 'plus' | 'sidebar';
    artiStep: number;
    /** When true the component renders in compact mode with animated cycling hints */
    compact?: boolean;
}

// --- The 4 hint cards shown in idle view ---
const HINT_CARDS = [
    {
        key: 'highlight' as const,
        icon: <MousePointer2 size={14}/>,
        color: 'text-pink-400',
        activeBorder: 'border-pink-500 bg-pink-500/5',
        label: 'Try Highlighting',
        badge: 'COMING SOON',
        badgeBg: 'bg-pink-500',
        comingSoon: true,
        body: (
            <p className="text-[11px] text-gray-400 leading-relaxed">
                Select text like{' '}
                <span className="text-white italic">sequence-aligned RNNS</span>{' '}
                in the editor to trigger an instant draft.
            </p>
        ),
    },
    {
        key: 'generate' as const,
        icon: <Wand2 size={14}/>,
        color: 'text-purple-400',
        activeBorder: 'border-purple-500 bg-purple-500/5',
        lable: 'Generate Button',
        badge: null,
        badgeBg: '',
        body: (
            <p className="text-[11px] text-gray-400 leading-relaxed">
                Click <span className="text-white">Generate Flashcard</span> to analyse the
                currently opened Transformer file.
            </p>
        ),
    },
    {
        key: 'plus' as const,
        icon: <Plus size={14}/>,
        color: 'text-blue-500',
        activeBorder: 'border-blue-400 bg-blue-400/5',
        label: 'Plus icon',
        badge: null,
        badgeBg: '',
        body: (
            <p className="text-[11px] text-gray-400 leading-relaxed">
                Open the Customiser to define a specific study scope across your AI folders.
            </p>
        ),
    },
    {
        key: 'sidebar' as const,
        icon: <Brain size={14}/>,
        color: 'text-[#63FF9D] ',
        activeBorder: 'border-[#63FF9D] bg-[#63FF9D]/5',
        label: 'Sidebar Set',
        badge: null,
        badgeBg: '',
        body: (
            <p className="text-[11px] text-gray-400 leading-relaxed">
                Click on the <span className="text-white font-bold">ML_Machine_Learning</span>{' '}
                set in the Revision Bar to start a review session.
            </p>
        ),
    },
];

// --- Animated cycling hint carosal (compact mode) ---
const CyclingHints: React.FC<{
    activeHint: DescriptionPartProps['activeHint']
}> = ({ activeHint }) => {
    const [ activeIdx, setActiveIdx ] = useState(0);
    const [ visible, setVisible ] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync with the external activeHint when AI guide is running
    useEffect(() => {
        if(activeHint === 'none') return;
        const idx = HINT_CARDS.findIndex( c => c.key === activeHint);
        if(idx !== -1 && idx !== activeIdx){
            setVisible(false);
            setTimeout(() => {
                setActiveIdx(idx);
                setVisible(true);
            }, 300);
        }
    },[activeHint]);

    // Auto-cycle every 3.5s when AI guide is in 'none' state
    useEffect(() => {
        if(activeHint !== 'none') return; //let AI guide control it
        timerRef.current = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setActiveIdx(i => ( i + 1) % HINT_CARDS.length);
                setVisible(true);
            }, 300);
        }, 3500);
        return () => {
            if(timerRef.current){
                clearInterval(timerRef.current);
            }
        };
    },[activeHint]);
    
    const card = HINT_CARDS[activeIdx];

    return(
        <div className="flex flex-col gap-2">
            {/* Dot nav */}
            <div className="flex items-center justify-center gap-1.5">
                
                {HINT_CARDS.map((card, i) => (
                    <button 
                    key={card.key}
                    onClick={() => {
                        setVisible(false);
                        setTimeout(() => {
                            setActiveIdx(i);
                            setVisible(true);
                        }, 200);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 
                        ${i === activeIdx ? 'bg-[#63FF9D] scale-125' : 'bg-white/20'}`}
                    />
                ))}
            </div>
           
            {/* Card */}
            <div
            className={`p-3 rounded-xl border transition-all duration-300 
                ${card.activeBorder} ${visible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-2'}`}
            >
                <div className="flex items-center justify-between mb-1.5">
                    <div className={`flex items-center gap-2 ${card.color}`}>
                        {card.icon}
                        <span className="text-[9px] font-black uppercase tracking-wider">
                            {card.label}
                        </span>
                    </div>
                     {card.badge && (
                        <span className={`text-[7px] ${card.badge} text-black px-1.5 rounded-full
                        font-black ${card.comingSoon ? "" : "animate-bounce"}`}>
                            {card.badge}
                        </span>
                    )}
                </div>
                {card.body}
            </div>
        </div>
    )
}

export const DescriptionPart = ({
    view,
    flashcardSets,
    currentCards,
    reviewIndex,
    isFlipped,
    setIsFlipped,
    activeSet,
    activeHint,
    artiStep,
    compact = false,
}: DescriptionPartProps) => {

    const pointerPositions = {
        highlight: "top-[210px]",
        generate: "top-[320px]",
        plus: "top-[425px]",
        sidebar: "top-[535px]",
        none: "opacity-0",
    }

    const showAutomationUI = view === 'idle' && artiStep !== 99 && activeHint !== 'none';

    return (
        <div className={`relative flex w-[30%] overflow-hidden rounded-3xl border
         border-white/10 bg-[#080C0C] shadow-2xl ${
            compact ? 'h-full p-4' : 'h-[740px] p-8'
         }`}>

            {/* The Floating Pointer */}
            {!compact && showAutomationUI && (
                <div className={`absolute left-0 ${pointerPositions[activeHint]} transition-all
                duration-1000 ease-in-out z-50`}>
                    <div className="relative">
                        <MousePointer2 
                        className="text-[#63FF9D] fill-[#63FF9D] rotate-[270deg] size-5
                        drop-shadow-[0_0_10px_#63FF9D]"
                        style={{ transform: 'scaleX(-1) rotate(15deg)'}}
                        />
                        <div className="absolute left-6 top-0 bg-[#63FF9D] text-black text-[8px]
                        font-black px-2 py-0.5 rounded-sm whitespace-nowrap animate-pulse">
                            TRY THIS
                        </div>
                    </div>
                </div>
            )}

            <div className={`text-left flex flex-col h-full
                ${compact ? 'space-y-2' : 'space-y-5'}`}>
                
                {/* Header: Dynamic State Indicator */}
                <div className={`flex items-center gap-2 border-b border-white/5 
                    ${compact ? 'pb-2' : 'pb-6'}`}>
                    <Zap size={18} className="text-[#63FF9D]" />
                    <span className={`font-black text-white uppercase tracking-[0.2em] 
                        ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
                        {view === 'idle' ? 'Interactive Guide' : 'System Logic'}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {/* IDLE VIEW: Onboarding & Interactive Options */}
                    {view === 'idle' && (
                       compact ? (
                            /** Compact: animated single-card cycling */
                            <div className="space-y-3">
                            <div className="space-y-1.5">
                                 <h4 className="text-sm font-bold text-white leading-tight">
                                    On-Demand Active Recall
                                </h4>
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    {`StudySprout doesn't just store notes; it deconvolves them 
                                    into surgical study sets. Try these actions to see the
                                    engine in work:`}
                                </p>
                                </div>
                                <CyclingHints activeHint={activeHint}/>
                            </div>
                       ) : (
                        /** Full: all 4 cards stacked with scroll */
                         <div className="space-y-4 overflow-y-auto h-full pr-2 custom-scrollbar
                            animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-3">
                                <h4 className="text-xl font-bold text-white leading-tight">
                                    On-Demand Active Recall
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {`StudySprout doesn't just store notes; it deconvolves them 
                                    into surgical study sets. Try these actions to see the
                                    engine in work:`}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {HINT_CARDS.map( card => (
                                     <div 
                                     key={card.key}
                                        className={`p-4 rounded-2xl border transition-all 
                                            duration-500
                                            ${activeHint === card.key
                                                ? card.activeBorder
                                                : 'border-white/5 bg-white/[0.03]'
                                            }`}
                                        >
                                    <div className="flex items-center justify-between mb-1">
                                       <div className={`flex items-center gap-3 mb-2 ${card.color}`}>
                                            {card.icon}
                                            <span className="text-[10px] font-black uppercase">
                                                {card.label}
                                            </span>
                                       </div>
                                       {card.comingSoon ? (
                                            <span className={`text-[8px] ${card.badge}
                                            text-pink-400 px-1.5 rounded font-bold uppercase
                                            animate-bounce border border-pink-500/30
                                             bg-pink-500/20 py-0.5 tracking-wide`}>
                                                {card.badge}
                                            </span>
                                       ) : (
                                        card.badge &&
                                        showAutomationUI &&
                                        activeHint === card.key && (
                                            <span className={`text-[8px] ${card.badge}
                                            text-black px-1.5 rounded-full animate-bounce`}>
                                                {card.badge}
                                        </span>
                                        )
                                       )}
                                    </div>
                                    {card.body}
                                </div>
                                ))}
                            </div>
                        </div>
                       )
                    )}

                    {/* CUSTOMIZING VIEW: Explaining the Scope */}
                    {view === 'customizing' && (
                        <div className={`space-y-4 animate-in slide-in-from-right duration-500
                        overflow-y-auto h-full ${compact ? 'pr-1' : 'pr-2 custom-scrollbar'}`}>
                            <h4 className={`font-bold text-white ${compact 
                                ? 'tex-sm' : 'text-xl'}`}>
                                Manual Override
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                You are now accessing the <strong>Customization Form</strong>. 
                                This allows you to bypass the single-file logic and target 
                                entire directories.
                            </p>
                            <div className="p-4 rounded-xl bg-blue-500/5 border
                             border-blue-500/20">
                                <p className="text-[10px] text-blue-300 leading-relaxed">
                                    Use this to deconvolve the 
                                    <span className="font-bold italic">
                                        Natural_Language_Processing
                                    </span> folder into a master review deck.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* REVIEWING VIEW: Explaining the Generation Logic */}
                    {view === 'reviewing' && activeSet && (
                        <div className={`space-y-4 animate-in zoom-in duration-500 overflow-y-auto
                        h-full ${compact ? 'pr-1' : 'pr-2 custom-scrollbar'}`}>
                            <div className="space-y-2">
                                <h4 className={`font-bold text-white leading-tight
                                    ${compact ? 'text-sm' : 'text-xl'}`}>
                                    {activeSet === 'file' ? 'File Deconvolution' : 'Set Review'}
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {activeSet === 'file' 
                                        ? `The engine has analyzed "Transformer_Architectures.md" and extracted 3 terminal concepts based on your recent activity.`
                                        : `You are now reviewing the "${flashcardSets[activeSet].title}" set.`}
                                </p>
                            </div>

                            {/* SRS Interface Simulation */}
                            <div className={`bg-[#0D1414] border border-white/10 rounded-2xl
                             shadow-2xl ${compact ? 'p-3 space-y-3' : 'p-6 space-y-6'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-purple-400 
                                    uppercase tracking-widest">
                                        Card {reviewIndex + 1}/{currentCards.length}
                                    </span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#63FF9D] 
                                    animate-pulse" />
                                </div>
                                <p className={`font-bold text-white leading-relaxed min-h-[60px]
                                    ${compact ? 'text-xs' : 'text-sm'}`}>
                                    {isFlipped 
                                    ? currentCards[reviewIndex]?.a 
                                    : currentCards[reviewIndex]?.q
                                    }
                                </p>
                                <button 
                                    onClick={() => setIsFlipped(!isFlipped)} 
                                    className={`w-full bg-purple-600 rounded-xl 
                                    text-[10px] font-black uppercase text-white shadow-lg
                                     active:scale-95 transition-all ${compact ? 'py-2' : 'py-3'}`}
                                >
                                    {isFlipped ? 'Memory Logged' : 'Reveal Answer'}
                                </button>
                            </div>

                            {!compact && (<p className="text-[10px] text-gray-500 italic leading-relaxed 
                            border-l-2 border-white/5 pl-4">
                                Note: Highlighting a different term will instantly append a 
                                new card to this session.
                            </p>
                        )}
                        </div>
                    )}
                </div>

                {/* Footer: Tech Stack Signature */}
                <div className={`border-t border-white/5 flex items-center justify-between
                    ${compact ? 'pt-2' : 'pt-6'}`}>
                    <div className="flex items-center gap-2 text-gray-700">
                        <Activity size={compact ? 10 : 12} />
                        <span className="text-[9px] font-black uppercase">Live Telemetry</span>
                    </div>
                    <div className="text-[9px] font-mono text-gray-800">SRS_v3.42</div>
                </div>
            </div>
        </div>
    );
};
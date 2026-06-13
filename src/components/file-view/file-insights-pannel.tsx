"use client";

import { ReduxFile } from "@/types/state.type";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useState } from "react";
import { 
    ChevronRight, 
    Clock,  
    FolderOpen,  
    GitBranch, 
    Hash, 
    LayoutDashboard, 
    Link, 
    Loader2, 
    Lock, 
    Play, 
    Sparkle, 
    Zap 
} from "lucide-react";
import { ActionItem } from "../dashboard-shared/action-item";
import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
import FlashcardSetViewerSheet from "../flashcard/flashcard-set-viewer-sheet";
import { Sheet } from "../ui/sheet";

export interface ActiveUser{
    id: string;
    username: string;
    avatarUrl?: string;
    color?: string; //presence color
}

export interface FlashcardSet{
    _id: string;
    title: string;
    cardCount: number;
    drillType: string;
    mastery: number;
    isActive: boolean;
}

export interface ParentSet{
    title: string;
    type: 'folder' | 'workspace';
    cardCount?: number;
}

export interface Prerequisites{
    id: string;
    title: string;
    mastered: string;
    masteryPct?: number;
    recommended?: boolean;
}

export interface PrereqItem{
    id: string;
    title: string;
}

interface FileInsightsPanelProps{
    fileId: string;
    currentFile: ReduxFile;
    // Presence
    activeUsers?: ActiveUser[];
    // Flashcards
    flashcardSet?: FlashcardSet | null;
    parentSets?: ParentSet[];
    // Related Concept
    relatedConcepts?: string[];
    // File Statistics
    readingTimeMin?: number;
    complexity?: 'low' | 'medium' | 'high';
    mentions?: number;
    connectedConcepts?: number;
    documentMasteryPct?: number;
    // Prerequisites
    prereqItems?: PrereqItem[];
    prereqNeverRun?: boolean;
    prereqLoading?: boolean;
    onDetectPrerequisites?: () => void;
    onPrereqClick?: (fileId: string) => void;
}

const SectionLabel = ({ children }: { children: React.ReactNode}) => (
    <h4 className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400/60
     mb-3 block text-left">
        {children}
    </h4>
)

const ComplexityDots = ({
    level
}: { level: 'low' | 'medium' | 'high'}) => {
    const filled = level === 'low' ? 1: level === 'medium' ? 2 : 3;
    return(
        <div className="flex gap-1 items-center mt-0.5">
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${i < filled 
                        ? 'bg-yellow-400' : 'bg-white/10'}`}
                />
            ))}
        </div>
    )
}

const UserAvatar = ({ user }: { user: ActiveUser }) => (
    <Avatar 
        className="w-7 h-7 rounded-full flex-shrink-0 border-2"
        style={{ borderColor: user.color ?? "#7c3aed"}}
    >
        {typeof user.avatarUrl === "string" && user.avatarUrl.length > 0 &&
             <AvatarImage 
                src={user.avatarUrl}
                className="object-cover"
            />
        }   
        <AvatarFallback 
            className="text-[10px] font-bold text-white"
            style={{ backgroundColor: user.color ? `${user.color}33` : "#3b0764"}}
        >
            {user.username?.[0].toUpperCase()}
        </AvatarFallback>
    </Avatar>
)

export const FileInsightsPanel = ({
    fileId,
    currentFile,
    activeUsers = [],
    flashcardSet = null,
    parentSets = [],
    relatedConcepts = [],
    readingTimeMin,
    complexity= 'medium',
    mentions = 0,
    connectedConcepts = 0,
    documentMasteryPct = 0,
    prereqItems = [],
    prereqNeverRun = true,
    prereqLoading = false,
    onDetectPrerequisites,
    onPrereqClick,
}: FileInsightsPanelProps) => {
    const [ showAllUsers, setShowAllUsers ] = useState(false);
    const [ conceptsExpanded, setConceptsExpanded ] = useState(false);
    const [ selectedSetId, setSelectedSetId ] = useState<string | null>(null);
    
    const CONCEPTS_PREVIEW_COUNT = 10;
    const visibleConcepts = conceptsExpanded
        ? relatedConcepts
        : relatedConcepts.slice(0, CONCEPTS_PREVIEW_COUNT);
    const hiddenConceptCount = relatedConcepts.length - CONCEPTS_PREVIEW_COUNT;

    const VISIBLE_USER_CAP = 4;
    const visibleUsers = showAllUsers ? activeUsers : activeUsers.slice(0, VISIBLE_USER_CAP);
    const hiddenCount = activeUsers.length - VISIBLE_USER_CAP; 
    
    const {
        generateCards,
        isGeneratingCards: isGenerating,
     } = useFlashcardGenerator({
        onSuccess: (newSetId: string) => {
            setSelectedSetId(newSetId);
        }
    });
    
    const handleGenerateFlashcardSet = async () => {
        try {
            await generateCards({
                resourceId: fileId,
                resourceType: 'File',
                workspaceId: String(currentFile.workspaceId),
                cardCount: 5,
                desiredTypes: ["question-answer", "mcq", "fill-in-the-blank"],
            });
        } catch (error: any) {
            console.error("[Flashcard Section] Failed to generate flashcard set: ",error.message);
        }
    }

    return(
        <div className="w-full bg-[#080c0c] h-full p-4 sm:p-5 flex flex-col space-y-5 overflow-y-auto
        select-none custom-insights-scrollbar border-l border-white/5">
            
            {/* 1. Active Collaborative Users */}
            {activeUsers.length > 0 && (
                <div className="flex flex-col text-left bg-[#141416]/40 border
                 border-white/[0.02] rounded-2xl space-y-3 p-5 gap-y-1">
                    <div className="flex items-center justify-between">
                        <SectionLabel>Action Now</SectionLabel>
                        <div className="flex items-center gap-x-1.5 px-2 py-0.5 rounded-full
                        bg-emerald-500/20 text-emerald-400 text-[10px] font-medium font-mono">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full
                                w-full rounded-full bg-emerald-400 opacity-75"/>
                                <span className="relative inline-flex rounded-full h-1.5
                                w-1.5 bg-emerald-500"/>
                            </span>
                            <span className="text-[10px] text-emerald-400">
                                {activeUsers.length} online
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        {visibleUsers.map(user => (
                            <div
                                key={user.id}
                                className="flex items-center gap-x-2.5 "
                            >
                                <UserAvatar user={user}/>
                                <span className="text-[13px] font-semibold text-purple-200 truncate">
                                    {user.username}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Expand / Collapse if the list is long */}
                    {activeUsers.length > VISIBLE_USER_CAP && (
                        <button
                            onClick={() => setShowAllUsers(p => !p)}
                            className="text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer
                            transition-colors font-mono pl-1"
                        >
                            {showAllUsers ? 'Show less' : `+${hiddenCount} more`}
                        </button>
                    )}
                </div>
            )}

            {/* 2. Document Mastery */}
            {documentMasteryPct > 0 && (
                <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <SectionLabel>Document Mastery</SectionLabel>
                        <span className="text-xs text-purple-300 font-semibold">
                            {documentMasteryPct}%
                        </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div 
                            className="h-full rounded-full bg-gradient-to-r from-purple-500
                            to-fuchsia-500 transition-all"
                            style={{ width: `${documentMasteryPct}%`}}
                        />
                    </div>
                    <p className="text-[11px] text-purple-400/50">
                        {documentMasteryPct}% Complete
                    </p>
                </div>
            )}

            {/* 3. Unified Flashcard Progress Container Box */}
            <div className="bg-purple-900/10 border border-purple-500/20 rounded-2xl space-y-3
                p-5 flex flex-col gap-y-4 items-center justify-center">
                <div className='flex items-center justify-center gap-x-2'>
                    <span className='text-[10px] font-bold text-zinc-500 tracking-widest 
                    uppercase'>
                        Flashcard Progress
                    </span>
                    <span className='bg-purple-600 text-[10px] px-2 py-0.5 rounded font-bold
                     text-zinc-300'>
                        CORE
                    </span>
                </div>
                {flashcardSet ? (
                    <>
                        <button 
                            onClick={() => setSelectedSetId(flashcardSet._id)}
                            className=" w-full rounded-xl border border-white/10 bg-white/5 
                            p-3 space-y-3 text-left hover:bg-white/8 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-purple-100 font-medium text-[13px] leading-snug
                                    mt-0.5">
                                        {flashcardSet.title}
                                    </p>
                                    <p className="text-purple-400/70 text-[11px] mt-0.5">
                                        {flashcardSet.cardCount} Cards · {flashcardSet.drillType}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600
                                hover:bg-purple-500 flex items-center justify-center transition-colors">
                                    <Play className="w-3 h-3 text-white fill-white"/>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[11px] text-purple-400/70
                                mb-1">
                                    <span>Mastery</span>
                                    <span className="font-semibold text-purple-200">
                                        {flashcardSet.mastery}%
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div 
                                        className="h-full rounded-full bg-gradient-to-r from-purple-500
                                        to-fuchsia-500 transition-all"
                                        style={{ width: `${flashcardSet.mastery}%`}}
                                    />
                                </div>
                            </div>
                        </button>
                    </>
                ) : (
                    <>
                        <ActionItem 
                            icon={isGenerating ? Loader2 : Sparkle}
                            label={isGenerating ? "Generating..." : "Generate Flashcards"}
                            handleAction={handleGenerateFlashcardSet}
                            disabled={isGenerating}
                            iconClassName={isGenerating ? "animate-spin text-purple-400 w-4 h-4" : null}
                            isGenerating={isGenerating}
                        />
                        {/* Included In - parent sets that contain this file's data */}
                        {parentSets.length > 0 ? (
                            <div className="border-t border-white/[0.04] pt-3 space-y-2">
                                <p className="text-[9px] font-mono font-bold tracking-wider
                                 text-zinc-500 uppercase">
                                    Also included in
                                </p>
                                {parentSets.map((set, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-x-2 px-2.5 py-1.5 
                                        rounded-lg bg-zinc-900/50 border border-white/[0.02]"
                                    >
                                        {set.type === 'folder' ? (
                                            <FolderOpen 
                                                size={12} 
                                                className="text-purple-400/70 shrink-0"
                                            />
                                        ) : (
                                            <LayoutDashboard 
                                                size={12} 
                                                className="text-purple-400/70 shrink-0"
                                            />
                                )}
                                <span className="text-[11px] font-medium text-zinc-400 truncate
                                flex-1">
                                    {set.title}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                                    {set.cardCount} cards
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="border-t border-white/[0.04] pt-3 space-y-2">
                        <p className="text-xs font-medium text-zinc-400 truncate flex 
                        items-center justify-between mt-3 space-y-1.5">
                            This file data is not included in any flashcard set.
                        </p>
                    </div>
                    )}
                    </>
                )}

                <Sheet
                    open={!!selectedSetId}
                    onOpenChange={(open) => {
                        if(!open) setSelectedSetId(null);
                    }}
                >
                    {selectedSetId && (
                        <FlashcardSetViewerSheet 
                            setId={selectedSetId}
                            initialIndex={0}
                        />
                    )}
                </Sheet>
            </div>

            {/*4. Unified file statistics box */}
            <div className="flex flex-col text-left gap-x-2.5 rounded-lg space-y-3 p-5 
                bg-[#0d0d0d] border border-white/5">
                <SectionLabel>File Statistics</SectionLabel>
                <div className="grid grid-cols-2 gap-1">
                    <div className="rounded-xl p-2 space-y-1">
                        <div className="flex items-center gap-x-1.5 text-zinc-500 font-mono
                        text-[10px] uppercase">
                            <Clock size={11}/> 
                            <span className="text-[12px] font-semibold">Reading time</span>
                        </div>
                        <p className="text-zinc-200 font-bold text-[14px] tracking-tight">
                            {readingTimeMin ? `${readingTimeMin} min` : '--'}
                        </p>
                    </div>

                    <div className="rounded-xl p-2 space-y-1">
                        <div className="flex items-center gap-x-1.5 text-zinc-500 font-mono
                        text-[10px] uppercase">
                            <Zap size={11}/> 
                            <span className="text-[12px] font-semibold">Complexity</span>
                        </div>
                        <ComplexityDots level={complexity}/>
                    </div>

                    <div className="rounded-xl p-2 space-y-1">
                        <div className="flex items-center gap-x-1.5 text-zinc-500 font-mono
                        text-[10px] uppercase">
                            <Hash size={11}/> 
                            <span className="text-[12px] font-semibold">Mention</span>
                        </div>
                        <p className="text-zinc-200 font-bold text-[14px] tracking-tight">
                            {mentions || "--"}
                        </p>
                    </div>

                    <div className="rounded-xl p-2 space-y-1">
                        <div className="flex items-center gap-x-1.5 text-zinc-500 font-mono
                        text-[10px] uppercase">
                            <Link size={11}/> 
                            <span className="text-[12px] font-semibold">Concepts</span>
                        </div>
                        <p className="text-zinc-200 font-bold text-[14px] tracking-tight">
                            {connectedConcepts > 0 ? String(connectedConcepts).padStart(2, '0') : '--'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 6. Learning Roadmap Prerequisites */}
            <div className="p-2 space-y-2">
                <div className="flex items-center justify-between mb-2.5">
                    <SectionLabel>Prerequisites</SectionLabel>
                    {prereqItems.length > 0 && (
                        <div className="bg-blue-950 rounded-xl px-1.5 py-0.5">
                            <span className="text-[10px] text-zinc-400 font-medium">
                                {prereqItems.length} required
                            </span>
                        </div>
                    )}
                </div>

                {prereqItems.length > 0 ? (
                    /*Prerequisites found - show a tappable clips */
                    <div className="space-y-2">
                        {prereqItems.map((prereq) => (
                            <button
                                key={prereq.id}
                                onClick={() => onPrereqClick?.(prereq.id)}
                                className="w-full flex items-center justify-between gap-2 rounded-lg
                                border border-white/10 p-2.5 text-left transition-colors
                                hover:bg-white/5"
                            >   
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <Lock className="w-4 h-4 text-purple-400/40 flex-shrink-0"/>
                                    <p className="text-[13px] truncate font-medium text-purple-500">
                                        {prereq.title}
                                    </p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-purple-400/40
                                flex-shrink-0"/>
                            </button>
                        ))}
                    </div>
                    ) : prereqNeverRun ? (
                        // API never called - show Detect button
                        <div className="flex flex-col gap-2">
                            <p className="text-[11px] text-white/30 italic">
                                Not analyzed yet
                            </p>
                            <button
                                onClick={onDetectPrerequisites}
                                disabled={prereqLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]
                                bg-purple-900/30 border border-purple-500/20 text-purple-400
                                hover:bg-purple-900/50 disabled:opacity-50 transition-colors w-fit"
                            >
                                {prereqLoading ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin"/>
                                        Detecting...
                                    </>
                                ) : (
                                    <>
                                        <GitBranch className="w-3 h-3"/>
                                        Detect prerequisites
                                    </>
                                )}
                            </button>
                        </div>
                    ): (
                        /*API ran but not found */
                        <p className="text-[11px] text-white/30 italic">
                            No prerequisites found
                        </p>
                )}
            </div>

            {/* 7. Related Concepts */}
            {relatedConcepts.length > 0 && (
                <div className="p-2 space-y-2.5">
                    <SectionLabel>Related Concepts</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                        {visibleConcepts.map(concept => (
                            <span
                                key={concept}
                                className="px-2.5 py-1 rounded-full text-[11px] font-medium
                                bg-purple-900/40 text-purple-300 border border-purple-500/20
                                hover:bg-purple-800/50 cursor-pointer transition-colors"
                            >   
                                {concept}
                            </span>
                        ))}

                        {/* +N more /collapse toggle */}
                        {!conceptsExpanded && hiddenConceptCount > 0 && (
                            <button
                                onClick={() => setConceptsExpanded(true)}
                                className="px-2.5 py-1 rounded-full text-[11px] font-medium
                                bg-purple-900/40 text-purple-300 border border-purple-500/20
                                hover:bg-purple-800/50 cursor-pointer transition-colors"
                            >
                                +{hiddenConceptCount} more
                            </button>
                        )}

                        {conceptsExpanded && relatedConcepts.length > CONCEPTS_PREVIEW_COUNT && (
                            <button
                                onClick={() => setConceptsExpanded(false)}
                                className="px-2.5 py-1 rounded-full text-[11px] font-medium
                                bg-purple-900/40 text-purple-300 border border-purple-500/20
                                hover:bg-purple-800/50 cursor-pointer transition-colors"
                            >
                                see less
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom padding for scroll breathing room */}
            <div className="h-4"/>
        </div>
    )
}
'use client';

import { useEffect, useState } from "react";
import { MainSearchWrapper } from "./search-section-parts/main-search-wrapper";
import { CollapsedPreview } from "./Dashboard-preview-parts/Collapsed-Preview";
import { FullscreenPopup } from "./Dashboard-preview-parts/Fullscreen-Popup";
import { Globe2, HardDriveDownload, History, Share2, Zap } from "lucide-react";

const MOBILE_BREAKPOINT = 640;

export const SearchSection = () => {
    const [ showCollapsed, setShowCollapsed ] = useState(false);
    const [ isExpanded, setIsExpanded ] = useState(false);
    const [ crossWorkspaceActive, setCrossWorkspaceActive] = useState(false);
    const [ indexed, setIndexed ] = useState(82000);
    const [ latency, setLatency ] = useState(14);

    // Collapse to the tap-to-expand preview below the lg breakpoint
    useEffect(() => {
        const check = () =>  setShowCollapsed(window.innerWidth < MOBILE_BREAKPOINT);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    },[]);

    // Cosmetic telemetry - nudges the indexed count and latency so the panel never looks static
    useEffect(() => {
        const id = setInterval(() => {
            setIndexed((prev) => prev + Math.floor(Math.random() * 3));
            setLatency(10 + Math.floor(Math.random() * 10));
        }, 1400);
        return () => clearInterval(id);
    },[]);

    return (
        <section id="search-section" className="scroll-mt-32 relative py-20 px-6 bg-[#120C0E]
        overflow-hidden text-[#A09388]">
            {/* Ambient gold background glow mirroring Hero */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 
            h-[35vw] w-[35vw] rounded-full bg-[#C9A227] opacity-[0.03] blur-[150px] 
            pointer-events-none" />

            <div className="max-w-7xl mx-auto flex flex-col items-center">

                {/* Section Heading */}
                <div className="text-center mb-16 space-y-4">
                    <h3 className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                     bg-[#C9A227]/10 border border-[#C9A227]/20 text-[#C9A227] font-mono 
                     text-[10px] uppercase tracking-[0.3em]">
                        Intelligent Indexing
                    </h3>
                    <h2 className="text-4xl md:text-5xl font-serif text-[#F5F0EB] leading-tight">
                        The <span className="font-serif italic text-[#C9A227">
                            Global</span> Command.
                    </h2>
                    <p className="mt-4 text-sm sm:text-base md:text-lg leading-relaxed 
                    text-[#A09388] font-serif max-w-2xl mx-auto">
                        Access your entire academic universe in 200ms. A lightning-fast commmand
                        palette designed for the neural speed of researchers.
                    </p>
                </div>

                {/* Left column: capability cards + telemetry */}
                <div className="flex flex-col-reverse lg:flex-row w-full gap-6">
                    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
                        <div className="p-6 rounded-2xl border border-[#2A1E22] bg-[#181013]/90 
                        space-y-3 backdrop-blur-3xl transform-gpu will-change-transform backface-hidden 
                        transition-colors hover:border-[#C9A227]/40">
                            <div className="w-9 h-9 rounded-xl bg-[#C9A227]/10 border border-[#C9A227]/20 
                            flex items-center justify-center text-[#C9A227]">
                                <Zap size={16}/>
                            </div>
                            <h4 className="text-sm font-mono text-[#F5F0EB] tracking-wide">
                                Neural Retrieval
                            </h4>
                            <p className="text-xs text-[#8C7A6B] font-sans leading-relaxed">
                                Search goes beyond filename. ResearchOS indexes document content,
                                PDF annotations, and headers.
                            </p>
                        </div>

                        <div className={`p-6 rounded-2xl border bg-[#181013]/90 backdrop-blur-3xl
                        transform-gpu will-change-transform backface-hidden
                         space-y-3 transition-all duration-300
                            ${crossWorkspaceActive 
                                ? "border-[#C9A227] shadow-[0_0_20px_rgba(201,162,39,0.15)]" 
                                : "border-[#2A1E22] hover:border-[#C9A227]/40"}`}>
                            <div className={`w-9 h-9 rounded-xl bg-[#C9A227]/10 border 
                            border-[#C9A227]/20 flex items-center duration-300
                            justify-center text-[#C9A227] transition-transform
                            ${crossWorkspaceActive ? "scale-110" : ""}`}>
                                <Globe2 size={16}/>
                            </div>
                            <h4 className="text-sm font-mono text-[#F5F0EB]">
                            Cross-Workspace Search
                            </h4>
                            <p className="text-xs text-[#8C7A6B] font-sans leading-relaxed">
                                {`Search reaches text and content inside every workspace you have 
                                access to - not just filenames, and not just the one you're in.`}
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl border border-[#2A1E22] bg-[#181013]/90
                         backdrop-blur-3xl transform-gpu will-change-transform backface-hidden space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                                <span className="text-[#8C7A6B]">Latency</span>
                                <span className="text-[#F5F0EB] font-medium">{latency}ms</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                                <span className="text-[#8C7A6B]">Indexed</span>
                                <span className="text-[#F5F0EB] font-medium">{indexed.toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                                    <span className="text-[#8C7A6B]">System Load</span>
                                    <span className="text-[#C9A227] font-medium">Optimal</span>
                                </div>
                                <div className="w-full h-1 rounded-full bg-[#2A1E22] overflow-hidden">
                                    <div className="h-full w-[22%] rounded-full bg-[#C9A227] shadow-[0_0_8px_#C9A227]"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Search Wrapper */}
                    <div className="flex-1 min-w-0">
                        {showCollapsed ? (
                            /* --- Small screen: hint badge + collapsed preview */
                            <div className="flex flex-col items-center gap-4">
                                <div className="px-4 py-2 bg-[#C9A227]/10 border border-[#C9A227]/20 rounded-full animate-bounce">
                                    <p className="text-[#C9A227] text-[10px] font-mono uppercase
                                    tracking-widest font-bold">
                                        Tap Expand to try the command palette
                                    </p>
                                </div>

                                <div className="w-full rounded-3xl border border-[#2A1E22] 
                                bg-[#181013]/90 backdrop-blur-3xl transform-gpu will-change-transform backface-hidden
                                 shadow-2xl overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3
                                    border-b border-[#2A1E22]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A227]
                                            animate-pulse"/>
                                            <span className="text-[#F5F0EB] font-mono uppercase
                                            tracking-widest text-[10px]">
                                                Global Command
                                                <span className="text-[#8C7A6B] font-mono tracking-normal ml-2">
                                                    - Interactive Playground
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-1">
                                        <CollapsedPreview 
                                            onExpand={() => setIsExpanded(true)}
                                            heading="Interactive Search"
                                            subHeading="Tap to launch the full command palette"
                                            type="Search"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <MainSearchWrapper onCrossWorkspaceChange={setCrossWorkspaceActive}/>
                        )}
                    </div>
                </div>
                <FullscreenPopup 
                    isOpen={isExpanded}
                    onClose={() => setIsExpanded(false)}
                    sandboxContent={<MainSearchWrapper onCrossWorkspaceChange={setCrossWorkspaceActive}/>}
                    type="search"
                    naturalWidth={1200}
                    naturalHeight={700}
                />

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full">

                    <div className="space-y-4 p-8 rounded-3xl bg-[#181013]/50 border border-[#2A1E22] 
                    hover:border-[#C9A227]/40 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/20 
                        flex items-center duration-300
                        justify-center text-[#C9A227] group-hover:scale-110 transition-transform">
                            <Share2 size={22}/>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-mono text-sm text-[#F5F0EB] tracking-wide">
                                Semantic link
                            </h4>
                            <p className="text-xs text-[#8C7A6B] leading-relaxed font-sans">
                                Connect disperate research ideas through automated semantic 
                                matching in your private vault.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 p-8 rounded-3xl bg-[#181013]/50 border border-[#2A1E22] 
                    hover:border-[#C9A227]/40 transitionall duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/20 
                        flex items-center justify-center text-[#C9A227] group-hover:scale-110 
                        transition-transform duration-300">
                            <HardDriveDownload size={22}/>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-mono text-sm text-[#F5F0EB] tracking-wide">
                                Local-First Privacy
                            </h4>
                            <p className="text-xs text-[#8C7A6B] font-sans leading-relaxed">
                                Search happens locally on your machine. Your data never leaves
                                your vault for index generation.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 p-8 rounded-3xl bg-[#181013]/50 border 
                    border-[#2A1E22] hover:border-[#C9A227]/40 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-[#C9A227]/10 border 
                        border-[#C9A227]/20 flex items-center duration-300 justify-center 
                        text-[#C9A227] group-hover:scale-110 transition-transform">
                            <History size={22}/>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-mono text-sm text-[#F5F0EB] tracking-wide">
                                Session Restore
                            </h4>
                            <p className="text-xs text-[#8C7A6B] font-sans leading-relaxed">
                                Jump back into deep work with universal session history and 
                                command logging.
                            </p>
                        </div>
                    </div>
               </div>
            </div>
        </section>
    )
}
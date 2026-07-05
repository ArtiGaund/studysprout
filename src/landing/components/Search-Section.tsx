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
        <section id="search-section" className="scroll-mt-32 relative py-20 px-6 bg-[#050A0A]
        overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col items-center">

                {/* Section Heading */}
                <div className="text-center mb-16 space-y-4">
                    <h3 className="text-violet-400 font-mono text-xs uppercase tracking-[0.4em]
                    opacity-80">
                        Intelligent Indexing
                    </h3>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                        The <span className="text-violet-400">Global</span> Command.
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
                        Access your entire academic universe in 200ms. A lightning-fast commmand
                        palette designed for the neural speed of researchers.
                    </p>
                </div>

                {/* Left column: capability cards + telemetry */}
                <div className="flex flex-col-reverse lg:flex-row w-full gap-6">
                    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
                        <div className="p-6 rounded-2xl border border-white/5 bg-[#080C0C] 
                        space-y-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-400/10 flex 
                            items-center justify-center text-violet-400">
                                <Zap size={16}/>
                            </div>
                            <h4 className="text-sm font-bold text-white">
                                Neural Retrieval
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Search goes beyond filename. ResearchOS indexes document content,
                                PDF annotations, and headers.
                            </p>
                        </div>

                        <div className={`p-6 rounded-2xl border bg-[#080C0C] space-y-3 
                        transition-colors
                            ${crossWorkspaceActive ? "border-sky-400/40" : "border-white/5"}`}>
                            <div className={`w-9 h-9 rounded-xl bg-sky-400/10 flex items-center 
                            justify-center text-sky-400 transition-transform
                            ${crossWorkspaceActive ? "scale-110" : ""}`}>
                                <Globe2 size={16}/>
                            </div>
                            <h4 className="text-sm font-bold text-white">
                            Cross-Workspace Search
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {`Search reaches text and content inside every workspace you have 
                                access to - not just filenames, and not just the one you're in.`}
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl border border-white/5 bg-[#080C0C] 
                        space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-mono
                            uppercase tracking-widest">
                                <span className="text-gray-600">Latency</span>
                                <span className="text-white">{latency}ms</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono
                            uppercase tracking-widest">
                                <span className="text-gray-600">Indexed</span>
                                <span className="text-white">{indexed.toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-mono
                                uppercase tracking-widest">
                                    <span className="text-gray-600">System Load</span>
                                    <span className="text-[#63FF9D]">Optimal</span>
                                </div>
                                <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                                    <div className="h-full w-[22%] rounded-full bg-[#63FF9D]"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Search Wrapper */}
                    <div className="flex-1 min-w-0">
                        {showCollapsed ? (
                            /* --- Small screen: hint badge + collapsed preview */
                            <div className="flex flex-col items-center gap-4">
                                <div className="px-4 py-2 bg-violet-400/10 border
                                 border-violet-400/20 rounded-full animate-bounce">
                                    <p className="text-violet-400 text-[10px] font-black uppercase
                                    tracking-widest">
                                        Tap Expand to try the command palette
                                    </p>
                                </div>

                                <div className="w-full rounded-3xl border border-white/10
                                bg-[#080C0C]/80 backdrop-blur-3xl shadow-2xl overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3
                                    border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400
                                            animate-pulse"/>
                                            <span className="text-white font-black uppercase
                                            tracking-widest text-[10px]">
                                                Global Command
                                                <span className="text-gray-500 font-medium ml-2">
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

                    <div className="space-y-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5
                    hover:border-violet-400/20 transition-colors group">
                        <div className="w-12 h-12 rounded-2xl bg-violet-400/10 flex items-center
                        justify-center text-violet-400 group-hover:scale-110 transition-transform">
                            <Share2 size={22}/>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-bold text-white">Semantic link</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Connect disperate research ideas through automated semantic 
                                matching in your private vault.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5
                    hover:border-orange-500/20 transition-colors group">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center
                        justify-center text-orange-500 group-hover:scale-110 transition-transform">
                            <HardDriveDownload size={22}/>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-bold text-white">Local-First Privacy</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Search happens locally on your machine. Your data never leaves
                                your vault for index generation.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5
                    hover:border-[#63FF9D]/20 transition-colors group">
                        <div className="w-12 h-12 rounded-2xl bg-[#63FF9D]/10 flex items-center
                        justify-center text-[#63FF9D] group-hover:scale-110 transition-transform">
                            <History size={22}/>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-bold text-white">Session Restore</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
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
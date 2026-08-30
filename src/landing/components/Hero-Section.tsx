'use client';

import { useEffect, useRef, useState } from "react";
import { DashboardPreview } from "./Dashboard-preview";
import { useScrambleText } from "../hooks/useScrambleText";
import { CollapsedPreview } from "./Dashboard-preview-parts/Collapsed-Preview";
import { FullscreenPopup } from "./Dashboard-preview-parts/Fullscreen-Popup";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface UpdateItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  isNew?: boolean;
  sectionId: string;
}

const RECENT_UPDATES: UpdateItem[] = [
  {
    id: "clipper",
    title: "Sprout Clipper",
    description: "Right-click any text on the web and save it straight to your workspace.",
    date: "Today",
    isNew: true,
    sectionId: "clipper-section",
  },
  {
    id: "editor",
    title: "Sprout Editor",
    description: "Real-time collaborative editing with offline-first sync.",
    date: "Last week",
    sectionId: "editor-section",
  },
  {
    id: "flashcards",
    title: "Auto-generated Flashcards",
    date: "2 weeks ago",
    sectionId: "flashcard-section",
  },
  {
    id: "search",
    title: "Semantic Search",
    date: "3 weeks ago",
    sectionId: "search-section",
  },
  {
    id: "knowledge-graph",
    title: "Concept Graph",
    date: "1 month ago",
    sectionId: "ecosystem",
  },
];

export const HeroSection = () => {
    const router = useRouter();
    const scrambledTitle = useScrambleText("Architected.", 500);
    const [ isExpanded, setIsExpanded ] = useState(false);
    const [ isPaused, setIsPaused ] = useState(false);
    const [ showCollapsed, setShowCollapsed ] = useState(false);
    const [showAllUpdates, setShowAllUpdates] = useState(false);

    // Determin if we should show collapsed preview based on container width
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkSize = () => {
            if(containerRef.current){
                // Sandbox needs ~850px to show comfortably, below that show collapsed
                setShowCollapsed(containerRef.current.offsetWidth < 750);
            }
        };
        checkSize();
        const observer = new ResizeObserver(checkSize);
        if(containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    },[]);

    // Listen to isPaused from inside DashboardPreview - we lift via a simple event approach
    // Since DashboardPreview manages its own state, we proxy isPaused via a custom event
    useEffect(() => {
        const handler = (e: CustomEvent) => setIsPaused(e.detail);
        window.addEventListener('sandbox-pause-change' as any, handler);
        return () => window.removeEventListener('sandbox-pause-change' as any, handler);
    },[]);

    return (
       <section 
        id="hero-section"
        className="relative isolate flex flex-col items-center justify-center bg-[#050A0A] 
        px-4 sm:px-6 pt-32 md:pt-40 pb-24 text-center overflow-hidden min-h-screen">
            {/* Animated Background Orbs */}
            <div className="absolute top-[10%] left-[10%] -z-10 h-[30vw] w-[30vw] rounded-full
             bg-[#63FF9D] opacity-[0.05] blur-[120px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[10%] -z-10 h-[35vw] w-[35vw] rounded-full
             bg-blue-500 opacity-[0.03] blur-[150px] animate-pulse [animation-delay:2s]" />

      
            {/* Top area: heading/CTA left, Recent Updates right */}
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px]
            gap-12 lg:gap-16 items-start text-left">

            {/* Left: heading, subtext, CTA */}
            <div className="flex flex-col items-start text-left">
                <h1 className="max-w-3xl text-4xl sm:text-6xl md:text-7xl lg:text-8xl 
                font-extrabold tracking-tighter text-white animate-in fade-in 
                slide-in-from-bottom-8 duration-1000">
                    Your Knowledge, <br />
                    <span className="bg-gradient-to-r from-[#63FF9D] via-emerald-400
                    to-[#63FF9D] bg-clip-text text-transparent font-mono min-h-[1.2em] 
                    inline-block">
                        {scrambledTitle}
                    </span>
                </h1>

                <p className="mt-6 md:mt-8 max-w-xl text-sm sm:text-base md:text-lg
                leading-relaxed text-gray-500 animate-in
                fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                  The block-based workspace that turns your notes into action.
                  Auto-generate flashcards, visualize concept graphs, and extract knowledge from
                  PDFs—all in one place.
                </p>

                <div className="mt-10 md:mt-12 flex flex-col items-stretch gap-4 md:gap-5 
                sm:flex-row animate-in w-full sm:w-auto fade-in zoom-in duration-1000 delay-500 
                sm:items-center">
                  <button
                    className="group relative flex items-center justify-center gap-3 rounded-2xl
                    bg-[#63FF9D] px-8 md:px-10 py-4 md:py-5 font-black text-black
                    transition-all hover:scale-105
                    hover:shadow-[0_0_40px_rgba(99,255,157,0.4)] uppercase text-[11px]
                    md:text-[12px] tracking-widest"
                    onClick={() => router.push("/sign-up")}
                  >
                    Start Growing for free
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </div>
            </div>

            {/* Right: Recent Updates list — no card, just typography */}
            <div className="w-full lg:max-w-sm animate-in fade-in slide-in-from-right-4
            duration-1000 delay-500">
              <div className="flex items-center gap-2 mb-5">
                <RefreshCw size={11} className="text-gray-600" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                  Recent Updates
                </h3>
              </div>

              {/* Bounded container: fixed height once expanded, scrolls internally,
                  content never overflows outside this box */}
              <div
                className={`space-y-5 ${
                  showAllUpdates ? "max-h-64 overflow-y-auto pr-2" : ""
                }`}
                style={
                  showAllUpdates
                    ? { scrollbarWidth: "thin", scrollbarColor: "#63FF9D33 transparent" }
                    : undefined
                }
              >
                {(showAllUpdates ? RECENT_UPDATES : RECENT_UPDATES.slice(0, 3)).map((update) => (
                  <a
                    key={update.id}
                    href={`#${update.sectionId}`}
                    className="group flex gap-3 items-start"
                  >
                    <div
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors
                      ${update.isNew ? "bg-[#63FF9D] animate-pulse" : "bg-gray-700"}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {update.isNew && (
                          <span className="text-[8px] font-black uppercase tracking-widest
                          text-[#63FF9D] bg-[#63FF9D]/10 px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                        <span className="text-[9px] text-gray-600 uppercase tracking-wider">
                          {update.date}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-bold transition-colors truncate
                        ${update.isNew
                          ? "text-white group-hover:text-[#63FF9D]"
                          : "text-gray-500 group-hover:text-gray-300"}`}
                      >
                        {update.title}
                      </p>
                      {update.description && (
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                          {update.description}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>

              {RECENT_UPDATES.length > 3 && (
                <button
                  onClick={() => setShowAllUpdates(prev => !prev)}
                  className="mt-4 text-[10px] font-black uppercase tracking-widest
                  text-gray-600 hover:text-[#63FF9D] transition-colors flex items-center gap-1"
                >
                  {showAllUpdates ? "Show less" : "See all"}
                  <span className={`transition-transform ${showAllUpdates ? "-rotate-90" : "rotate-90"}`}>
                    →
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Dashboard 3D Entrance */}
          <div 
            ref={containerRef}
            className="relative mt-12 md:mt-24 w-full max-w-[95vw] md:max-w-6xl mx-auto px-4
             [perspective:2000px] animate-in fade-in slide-in-from-bottom-12 duration-1000 
             delay-700"
          >
              <div className="absolute -inset-4 md:-inset-10 bg-[#63FF9D] opacity-[0.02] 
                blur-[80px] md:blur-[120px] rounded-full" />

              {/* Interactive Card: Flatterned on mobile for better touch usability */}
              <div 
                className="relative rounded-2xl border border-white/10 bg-[#080C0C]/80 
                backdrop-blur-3xl p-1 md:p-1.5 shadow-2xl transition-all duration-1000 ease-out
                md:[transform:rotateX(15deg)_translateY(20px)] 
                md:hover:[transform:rotateX(0deg)_translateY(0px)]
                /* Mobile: Keep it flat to prevent clipping */
                [transform:rotateX(0deg)_translateY(0px)]"
              >

                {/* Hint badge - always visible */}
                <div className="flex flex-col items-center mb-6 animate-bounce">
                  <div className="px-4 py-2 bg-[#63FF9D]/10 border border-[#63FF9D]/20
                    rounded-full">
                      <p className="text-[#63FF9D] text-[10px] font-black uppercase
                        tracking-widest">
                        { showCollapsed 
                          ? "Tap Expand to try it yourself"
                          : "Move your pointer inside to take control & try it yourself"
                        }
                      </p>
                  </div>
                </div>

                {/* Sandbox title bar */}
                {!showCollapsed && (
                  <div className="flex items-center justify-between px-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#63FF9D] animate-pulse"/>
                        <h3 className="text-white font-black uppercase tracking-widest text-xs">
                          Studysprout Sandbox
                          <span className="text-gray-500 font-medium ml-2">
                            — Interactive Playground
                          </span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-[10px] font-bold transition-all duration-500 
                          ${isPaused 
                            ? 'text-[#63FF9D] opacity-100' 
                            : 'text-orange-600 opacity-75'}`}>
                            {isPaused ? "MANUAL OVERRIDE ACTIVE" : "AI GUIDE RUNNING"}
                        </div>
                    </div>
                  </div>
                )}

                <div className="p-1 md:p-1.5">
                  {showCollapsed ? (
                    <CollapsedPreview 
                      onExpand={() => setIsExpanded(true)} 
                      isPaused={isPaused} 
                      heading="Interactive Demo"
                      subHeading="Click to experience the full sandbox"
                      type="sandbox"
                    />
                  ) : (
                    <DashboardPreview />
                  )}
                </div>
              </div>
            </div>

            {/* Fullscreen Popup */}
            <FullscreenPopup
                isOpen={isExpanded}
                onClose={() => setIsExpanded(false)}
                isPaused={isPaused}
                sandboxContent={<DashboardPreview isExpanded={true} />}
                naturalWidth={1200}
                naturalHeight={740}
                type="sandbox"
            />
       </section>
    );
};
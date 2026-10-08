'use client';

import { useEffect, useRef, useState } from "react";
import { DashboardPreview } from "./Dashboard-preview";
import { useScrambleText } from "../hooks/useScrambleText";
import { CollapsedPreview } from "./Dashboard-preview-parts/Collapsed-Preview";
import { FullscreenPopup } from "./Dashboard-preview-parts/Fullscreen-Popup";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { formatRelativeDate } from "@/lib/landing-page/format-relative-date";

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
    date: "2026-09-01T00:00:00.000Z", 
    sectionId: "clipper-section",
  },
  // {
  //   id: "editor",
  //   title: "Sprout Editor",
  //   description: "Real-time collaborative editing with offline-first sync.",
  //   date: "2026-07-10T00:00:00.000Z", 
  //   sectionId: "editor-section",
  // },
  {
    id: "deployed",
    title: "StudySprout Deployed",
    description: "StudySprout went live.",
    date: "2026-08-01T00:00:00.000Z", 
    sectionId: "hero-section",
  },
];

function buildUpdates(): UpdateItem[]{
  const sorted = [...RECENT_UPDATES].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sorted.map((item, index) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    date: formatRelativeDate(new Date(item.date)),
    isNew: index === 0,
    sectionId: item.sectionId,
  }));
}

export const HeroSection = () => {
    const router = useRouter();
    const scrambledTitle = useScrambleText("Architected.", 500);
    const [ isExpanded, setIsExpanded ] = useState(false);
    const [ isPaused, setIsPaused ] = useState(false);
    const [ showCollapsed, setShowCollapsed ] = useState(false);
    const [showAllUpdates, setShowAllUpdates] = useState(false);
    const [ updates, setUpdates ] = useState<UpdateItem[]>([]);

    useEffect(() => {
      setUpdates(buildUpdates());
    },[]);

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
          className="relative isolate flex flex-col items-center justify-center bg-[#120C0E] 
          px-4 sm:px-6 pt-32 md:pt-40 pb-24 text-center overflow-hidden min-h-screen"
        >
           
            {/* Top area: heading/CTA left, Recent Updates right */}
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px]
              gap-12 lg:gap-16 items-start text-left">

            {/* Left: heading, subtext, CTA */}
            <div className="flex flex-col items-start text-left">
                <h1 className="max-w-3xl text-4xl sm:text-6xl md:text-7xl lg:text-8xl 
                  font-serif tracking-tighter text-[#F5F0EB] animate-in fade-in 
                  slide-in-from-bottom-8 duration-1000">
                    Your Knowledge, <br />
                    <span className="font-serif italic text-[#C9A227] min-h-[1.2em]
                       inline-block">
                        {scrambledTitle}
                    </span>
                </h1>

                <p className="mt-6 md:mt-8 max-w-xl text-sm sm:text-base md:text-lg
                  leading-relaxed text-[#A09388] font-serif animate-in
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
                    bg-[#C9A227] px-8 md:px-10 py-4 md:py-5 font-mono font-bold text-[#120C0E]
                    transition-all hover:bg-transparent hover:text-[#C9A227] hover:scale-105 
                    border border-[#C9A227]
                    hover:shadow-[0_0_25px_rgba(201,162,39,0.25)] uppercase text-[11px]
                    md:text-[12px] tracking-[0.2em]"
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
                <RefreshCw size={11} className="text-[#8C7A6B]" />
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#8C7A6B]">
                  Recent Updates
                </h3>
              </div>

              {/* Bounded container: fixed height once expanded, scrolls internally,
                  content never overflows outside this box */}
              <div
                className={`space-y-5 ${ showAllUpdates ? "max-h-64 overflow-y-auto pr-2" : ""}`}
                style={
                  showAllUpdates
                    ? { scrollbarWidth: "thin", scrollbarColor: "#C9A22733 transparent" }
                    : undefined
                }
              >
                {(showAllUpdates ? updates : updates.slice(0, 3)).map((update) => (
                  <a
                    key={update.id}
                    href={`#${update.sectionId}`}
                    className="group flex gap-3 items-start"
                  >
                    <div
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors
                      ${update.isNew ? "bg-[#C9A227] animate-pulse" : "bg-[#2A1E22]"}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {update.isNew && (
                          <span className="text-[8px] font-mono uppercase tracking-widest
                          text-[#C9A227] border border-[#C9A227]/40 bg-[#C9A227]/10 px-1.5 
                          py-0.5 rounded">
                            New
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-[#8C7A6B] uppercase tracking-wider">
                          {update.date}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-mono transition-colors truncate
                        ${update.isNew
                          ? "text-[#F5F0EB] group-hover:text-[#C9A227]"
                          : "text-[#A09388] group-hover:text-[#F5F0EB]"}`}
                      >
                        {update.title}
                      </p>
                      {update.description && (
                        <p className="text-xs text-[#8C7A6B] mt-0.5 leading-relaxed font-sans">
                          {update.description}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>

              {updates.length > 3 && (
                <button
                  onClick={() => setShowAllUpdates(prev => !prev)}
                  className="mt-4 text-[10px] font-mono uppercase tracking-widest
                  text-[#8C7A6B] hover:text-[#C9A227] transition-colors flex items-center gap-1"
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
              <div className="absolute -inset-4 md:-inset-10 bg-[#C9A227] opacity-[0.02] 
                blur-[80px] md:blur-[120px] rounded-full" />

              {/* Interactive Card: Flatterned on mobile for better touch usability */}
              <div 
                className="relative rounded-2xl border border-[#2A1E22] bg-[#181013]/90 
                backdrop-blur-3xl transform-gpu will-change-transform backface-hidden
                 p-1 md:p-1.5 shadow-2xl transition-all duration-1000 ease-out
                md:[transform:rotateX(15deg)_translateY(20px)] 
                md:hover:[transform:rotateX(0deg)_translateY(0px)]"
              >

                {/* Hint badge - always visible */}
                <div className="flex flex-col items-center mb-6 animate-bounce">
                  <div className="px-4 py-2 bg-[#C9A227]/10 border border-[#C9A227]/20
                    rounded-full">
                      <p className="text-[#C9A227] text-[10px] font-mono uppercase
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
                      <div className="w-2 h-2 rounded-full bg-[#C9A227] animate-pulse"/>
                        <h3 className="text-[#F5F0EB] font-mono uppercase tracking-widest 
                          text-xs">
                          Studysprout Sandbox
                          <span className="text-[#8C7A6B] font-mono normal-case tracking-normal
                           ml-2">
                            — Interactive Playground
                          </span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-[10px] font-mono transition-all duration-500 
                          ${isPaused 
                            ? 'text-[#C9A227] opacity-100' 
                            : 'text-[#8C7A6B] opacity-75'}`}>
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
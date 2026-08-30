'use client';

import {
  MousePointer2, Inbox as InboxIcon, FolderInput,
  Download, AlertTriangle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CollapsedPreview } from "./Dashboard-preview-parts/Collapsed-Preview";
import { FullscreenPopup } from "./Dashboard-preview-parts/Fullscreen-Popup";
import { InboxItem, MainExtensionWrapper, MainExtensionWrapperProps } from "./extension-section-parts/main-extension-wrapper";

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const CAPTURED_ITEMS = [
  {
    type: "HEADING2" as const,
    title: "Introduction To Neural Networks",
    preview:
      "Neural networks are machine learning models that mimic the complex functions of the human brain.",
    source: "geeksforgeeks.org",
    menuLabel: "Heading 2",
    anchor: { top: 14, left: 24 },
  },
  {
    type: "PARAGRAPH" as const,
    title: "Neural networks are machine...",
    preview:
      "Neural networks are machine learning models that mimic the complex functions of the human brain. These models consist of interconnected nodes.",
    source: "geeksforgeeks.org",
    menuLabel: "Paragraph",
    anchor: { top: 76, left: 24 },
  },
  {
    type: "BULLET_LIST" as const,
    title: "Neurons: The basic units tha...",
    preview:
      "Neurons: The basic units that receive inputs. Connections: Links between neurons. Weights and Biases: Determine the strength of connections.",
    source: "geeksforgeeks.org",
    menuLabel: "Bullet List",
    anchor: { top: 210, left: 24 },
  },
  {
    type: "NUMBERED_LIST" as const,
    title: "Input Computation...",
    preview:
      "Input Computation: Data is fed into the network. Output Generation: The network generates an output. Iterative Refinement: Weights are adjusted.",
    source: "geeksforgeeks.org",
    menuLabel: "Numbered List",
    anchor: { top: 340, left: 24 },
  },
];

const INSTALL_STEPS = [
  {
    title: "Unzip the download",
    description:
      "Download the ZIP and extract it anywhere on your computer — remember the folder location.",
    image: "/images/install/step-1-unzip.png",
  },
  {
    title: "Open chrome://extensions",
    description:
      "Paste chrome://extensions into your address bar, then turn on Developer mode using the toggle in the top-right corner.",
    image: "/images/install/step-2-dev-mode.png",
  },
  {
    title: "Load unpacked",
    description:
      "Click Load unpacked, then select the folder you unzipped in step 1.",
    image: "/images/install/step-3-load-unpacked.png",
  },
  {
    title: "You're set",
    description:
      "The Sprout icon appears in your toolbar. Right-click any text on the web to start saving.",
    image: "/images/install/step-4-done.png",
  },
];

type Phase =
  | "idle"
  | "selecting"
  | "menu-open"
  | "submenu-open"
  | "saved-toast"
  | "item-added"
  | "bulk-select"
  | "merging"
  | "merged-toast"
  | "resetting";

export const ClipperSection = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const [showCollapsed, setShowCollapsed] = useState(false);

  const [showInstallSteps, setShowInstallSteps] = useState(false);
  const [installStep, setInstallStep] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemIdCounter = useRef(0);
  const nextId = () => `item-${++itemIdCounter.current}`;

  // Same breakpoint check as EditorSection: below 768px the two-panel
  // layout gets too cramped to interact with comfortably.
  useEffect(() => {
    const check = () => {
      if (containerRef.current) {
        setShowCollapsed(containerRef.current.offsetWidth < 768);
      }
    };
    check();
    const observer = new ResizeObserver(check);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleReplay = useCallback(() => {
    setInboxItems([]);
    setBadgeCount(0);
    setSelectedForMerge([]);
    setToastVisible(false);
    setPhase("idle");
    setActiveItemIdx(0);
    setCycleKey(k => k + 1);
  }, []);

  const closeInstallSteps = useCallback(() => {
    setShowInstallSteps(false);
    setInstallStep(0);
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      while (alive) {
        for (let i = 0; i < CAPTURED_ITEMS.length; i++) {
          if (!alive) return;
          const captured = CAPTURED_ITEMS[i];
          setActiveItemIdx(i);

          setPhase("selecting");
          await delay(900);
          if (!alive) return;

          setPhase("menu-open");
          await delay(900);
          if (!alive) return;

          setPhase("submenu-open");
          await delay(1000);
          if (!alive) return;

          setPhase("saved-toast");
          setToastVisible(true);
          await delay(1600);
          if (!alive) return;
          setToastVisible(false);

          const id = nextId();
          setInboxItems(prev => [
            {
              id,
              type: captured.type,
              title: captured.title,
              preview: captured.preview,
              justAdded: true,
            },
            ...prev,
          ]);
          setBadgeCount(prev => prev + 1);
          setPhase("item-added");
          await delay(900);
          if (!alive) return;
          setInboxItems(prev =>
            prev.map(it => (it.id === id ? { ...it, justAdded: false } : it))
          );

          setPhase("idle");
          await delay(700);
        }

        if (!alive) return;
        setInboxItems(current => {
          if (current.length < 2) return current;
          setSelectedForMerge(current.slice(0, 2).map(it => it.id));
          return current;
        });
        setPhase("bulk-select");
        await delay(1300);
        if (!alive) return;

        setPhase("merging");
        await delay(800);
        if (!alive) return;

        setInboxItems(prev => {
          if (prev.length < 2) return prev;
          const [first, second, ...rest] = prev;
          const merged: InboxItem = {
            id: nextId(),
            type: first.type,
            title: first.title,
            preview: `${first.preview} ${second.preview}`,
            justAdded: true,
          };
          return [merged, ...rest];
        });
        setBadgeCount(prev => Math.max(prev - 1, 0));
        setSelectedForMerge([]);
        setPhase("merged-toast");
        setToastVisible(true);
        await delay(1400);
        if (!alive) return;
        setToastVisible(false);

        setPhase("resetting");
        await delay(2200);
        if (!alive) return;
        setInboxItems([]);
        setBadgeCount(0);
        setPhase("idle");
        await delay(800);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [cycleKey]);

  const clipperProps: MainExtensionWrapperProps = {
    phase,
    activeIndex: activeItemIdx,
    activeItem: CAPTURED_ITEMS[activeItemIdx],
    items: CAPTURED_ITEMS,
    inboxItems,
    badgeCount,
    toastVisible,
    selectedForMerge,
    onReplay: handleReplay,
  };

  return (
    <section
      id="clipper-section"
      className="scroll-mt-32 relative py-20 px-6 bg-[#050A0A] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center">

        {/* Section Heading */}
        <div className="text-center mb-16 space-y-4">
          <h3 className="text-[#63FF9D] font-mono text-xs uppercase tracking-[0.4em] opacity-80">
            Capture Anywhere
          </h3>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            The <span className="text-[#63FF9D]">Sprout</span> Extension.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Select anything on the web, right-click, and file it straight into your
            workspace — no tab-switching, no copy-paste.
          </p>

          {/* Download CTA */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <a
              href="https://github.com/ArtiGaund/studysprout-clipper/releases/tag/v1.0.0"
              target="_blank"
            rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#63FF9D] text-black
               font-bold text-sm px-6 py-3 hover:bg-[#63FF9D]/90 transition-colors
               shadow-[0_0_30px_rgba(99,255,157,0.25)]"
            >
              <Download size={16} />
              Download Extension (.zip)
            </a>

            <button
              onClick={() => setShowInstallSteps(true)}
              className="text-[11px] text-gray-500 hover:text-[#63FF9D] underline
               underline-offset-2 transition-colors"
            >
             {` Not on the Chrome Web Store yet — here's how to install it manually`}
            </button>

            <div className="flex items-start gap-2 max-w-md mt-2 px-4 py-2.5 rounded-lg
             border border-orange-500/20 bg-orange-500/5 text-left">
              <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <span className="text-orange-400 font-medium">Chrome may show a warning</span>{" "}
                {`the first time you load this — that's expected for extensions installed
                outside the Web Store, not a sign anything's wrong. It only appears because
                we're not listed there yet.`}
              </p>
            </div>
          </div>
        </div>

        {/* Main demo — full two-panel on large screens, collapsed preview on small */}
        <div ref={containerRef} className="w-full">
          {showCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <div className="px-4 py-2 bg-[#63FF9D]/10 border border-[#63FF9D]/20
               rounded-full animate-bounce">
                <p className="text-[#63FF9D] text-[10px] font-black uppercase tracking-widest">
                  Tap Expand to interact with the demo
                </p>
              </div>

              <div className="w-full rounded-3xl border border-white/10 bg-[#080C0C]/80
               backdrop-blur-3xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b
                 border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#63FF9D] animate-pulse" />
                    <span className="text-white font-black uppercase tracking-widest
                     text-[10px]">
                      Clipper
                      <span className="text-gray-500 font-medium ml-2">
                        - Interactive Playground
                      </span>
                    </span>
                  </div>
                </div>

                <div className="p-1">
                  <CollapsedPreview
                    onExpand={() => setIsExpanded(true)}
                    heading="Interactive Clipper"
                    subHeading="Tap to launch full capture demo"
                    type="clipper"
                  />
                </div>
              </div>
            </div>
          ) : (
            <MainExtensionWrapper {...clipperProps} />
          )}
        </div>

        <FullscreenPopup
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          sandboxContent={<MainExtensionWrapper {...clipperProps} />}
        />

        {/* Technical Deep-Dive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full">
          <div className="space-y-4 p-8 rounded-3xl bg-white/[0.02] border
           border-white/5 hover:border-[#63FF9D]/20 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-[#63FF9D]/10 flex items-center
             justify-center text-[#63FF9D] group-hover:scale-110 transition-transform">
              <MousePointer2 size={22} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white">One Right-Click Away</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
               {` Select any text on any page. The browser's native context menu gets a{" "}`}
                <strong>Save to Studysprout</strong> entry — no separate popup to open.
              </p>
            </div>
          </div>

          <div className="space-y-4 p-8 rounded-3xl bg-white/[0.02] border
           border-white/5 hover:border-purple-400/20 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-purple-400/10 flex items-center
             justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <InboxIcon size={22} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white">Everything Lands in Inbox</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Captures queue up in your Inbox as structured blocks — headings, lists,
                and paragraphs preserved — ready to file.
              </p>
            </div>
          </div>

          <div className="space-y-4 p-8 rounded-3xl bg-white/[0.02] border
           border-white/5 hover:border-orange-500/20 transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center
             justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <FolderInput size={22} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white">Merge, File, or Bulk-Clean</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {`Select multiple captures and merge them into one file, or clear your
                inbox in bulk — it's built for the messy first pass.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Install-steps modal */}
      {showInstallSteps && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
          onClick={closeInstallSteps}
        >
          <div
            className="max-w-lg w-full rounded-2xl border border-white/10 bg-[#0A0F0F] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-bold text-sm">
                Install in Chrome
              </h4>
              <span className="text-[10px] text-gray-600">
                Step {installStep + 1} of {INSTALL_STEPS.length}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40 mb-4">
              <img
                src={INSTALL_STEPS[installStep].image}
                alt={INSTALL_STEPS[installStep].title}
                className="w-full h-auto"
              />
            </div>

            <p className="text-white text-sm font-semibold mb-1">
              {INSTALL_STEPS[installStep].title}
            </p>
            <p className="text-gray-400 text-xs leading-relaxed mb-5">
              {INSTALL_STEPS[installStep].description}
            </p>

            <div className="flex items-center justify-center gap-1.5 mb-5">
              {INSTALL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === installStep ? "w-5 bg-[#63FF9D]" : "w-1.5 bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {installStep > 0 && (
                <button
                  onClick={() => setInstallStep(s => s - 1)}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-xs
                   text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  Back
                </button>
              )}
              {installStep < INSTALL_STEPS.length - 1 ? (
                <button
                  onClick={() => setInstallStep(s => s + 1)}
                  className="flex-1 rounded-lg bg-[#63FF9D] text-black font-bold py-2 text-xs
                   hover:bg-[#63FF9D]/90 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={closeInstallSteps}
                  className="flex-1 rounded-lg bg-[#63FF9D] text-black font-bold py-2 text-xs
                   hover:bg-[#63FF9D]/90 transition-colors"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
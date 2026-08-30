'use client';

import React from "react";
import {
  Search, Home, Trash2, Clock, Inbox as InboxIcon, Menu,
  Copy, Link2, Printer, BookOpen, Languages, Sparkles,
  Heading1, Heading2, Heading3, AlignLeft, List, ListOrdered,
  Quote, ChevronRight, FolderInput, CheckSquare, Square,
  RefreshCw, Trash,
} from "lucide-react";

export interface InboxItem {
  id: string;
  type: "PARAGRAPH" | "HEADING2" | "HEADING3" | "BULLET_LIST" | "NUMBERED_LIST";
  title: string;
  preview: string;
  justAdded?: boolean;
}

export interface CapturedItemDef {
  type: InboxItem["type"];
  title: string;
  preview: string;
  source: string;
  menuLabel: string;
  anchor: { top: number; left: number };
}

export interface MainExtensionWrapperProps {
  phase: string;
  activeIndex: number;
  activeItem: CapturedItemDef;
  items: CapturedItemDef[];
  inboxItems: InboxItem[];
  badgeCount: number;
  toastVisible: boolean;
  selectedForMerge: string[];
  onReplay: () => void;
}

const TYPE_COLOR: Record<InboxItem["type"], string> = {
  PARAGRAPH: "text-gray-400",
  HEADING2: "text-[#63FF9D]",
  HEADING3: "text-[#63FF9D]",
  BULLET_LIST: "text-purple-400",
  NUMBERED_LIST: "text-orange-400",
};

export const MainExtensionWrapper: React.FC<MainExtensionWrapperProps> = ({
  phase,
  activeIndex,
  activeItem,
  items,
  inboxItems,
  badgeCount,
  toastVisible,
  selectedForMerge,
  onReplay,
}) => {
  const isHighlightPhase = ["selecting", "menu-open", "submenu-open", "saved-toast"].includes(phase);
  const menuOpen = phase === "menu-open" || phase === "submenu-open" || phase === "saved-toast";
  const submenuOpen = phase === "submenu-open" || phase === "saved-toast";

  const highlightClass = (idx: number) =>
    isHighlightPhase && activeIndex === idx
      ? "bg-[#63FF9D]/20 text-white rounded px-0.5 transition-colors duration-300"
      : "transition-colors duration-300";

  const menuPos = {
    top: activeItem.anchor.top + 22,
    left: activeItem.anchor.left + 160,
  };

  return (
    <div className="flex flex-col lg:flex-row w-full overflow-hidden rounded-2xl border
     border-white/5 bg-[#080C0C] shadow-2xl">

      {/* LEFT PANEL — fake browser, exactly half width on desktop */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-[420px] lg:min-h-[640px]
       border-b lg:border-b-0 lg:border-r border-white/5 relative">

        {/* Fake browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0A0F0F]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 mx-3 px-3 py-1 rounded-md bg-white/5 text-[10px]
           text-gray-500 font-mono truncate">
            geeksforgeeks.org/deep-learning/neural-networks-a-beginners-guide
          </div>
        </div>

        {/* Fake article body */}
        <div className="relative flex-1 p-6 overflow-hidden text-gray-300">

          <h1 className={`text-lg font-bold mb-4 inline ${highlightClass(0)}`}>
            Introduction To Neural Networks
          </h1>

          <p className="text-xs leading-relaxed text-gray-400 mb-4 mt-3">
            <span className={highlightClass(1)}>
              Neural networks are machine learning models that mimic the complex
              functions of the human brain. These models consist of interconnected
              nodes or neurons that process data, learn patterns directly from data.
            </span>
          </p>

          <ul className={`text-xs leading-relaxed space-y-1 mb-4 list-disc pl-4 ${highlightClass(2)}`}>
            <li>Neurons: The basic units that receive inputs.</li>
            <li>Connections: Links between neurons that carry information.</li>
            <li>Weights and Biases: Determine the strength of connections.</li>
          </ul>

          <ol className={`text-xs leading-relaxed space-y-1 list-decimal pl-4 ${highlightClass(3)}`}>
            <li>Input Computation: Data is fed into the network.</li>
            <li>Output Generation: The network generates an output.</li>
            <li>Iterative Refinement: Weights are adjusted over time.</li>
          </ol>

          {/* Fake cursor */}
          <div
            className="absolute pointer-events-none transition-all duration-500 ease-out z-30"
            style={{ top: activeItem.anchor.top, left: activeItem.anchor.left }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#63FF9D">
              <path d="M4 2l14 6-6 2-2 6-6-14z" />
            </svg>
          </div>

          {/* Fake context menu */}
          {menuOpen && (
            <div
              className="absolute z-40 w-44 rounded-lg border border-white/10 bg-[#111716]
               shadow-2xl py-1.5 text-[10px] transition-opacity duration-200"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <MenuRow icon={<Copy size={11} />} label="Copy" shortcut="Ctrl+C" />
              <MenuRow icon={<Link2 size={11} />} label="Copy link" />
              <MenuRow icon={<Printer size={11} />} label="Print..." shortcut="Ctrl+P" />
              <MenuRow icon={<BookOpen size={11} />} label="Reading mode" />
              <MenuRow icon={<Languages size={11} />} label="Translate" />
              <div className="my-1 border-t border-white/5" />

              <div className="relative">
                <div className={`flex items-center justify-between gap-2 px-3 py-1.5
                 cursor-default ${submenuOpen ? "bg-[#63FF9D]/10" : ""}`}>
                  <span className="flex items-center gap-2 text-[#63FF9D] font-medium">
                    <Sparkles size={11} /> Save to Studysprout
                  </span>
                  <ChevronRight size={11} className="text-[#63FF9D]" />
                </div>

                {submenuOpen && (
                  <div className="absolute left-full top-0 ml-1 w-36 rounded-lg border
                   border-white/10 bg-[#111716] shadow-2xl py-1.5">
                    <SubmenuRow icon={<Heading1 size={11} />} label="Heading 1"
                      active={activeItem.menuLabel === "Heading 1"} />
                    <SubmenuRow icon={<Heading2 size={11} />} label="Heading 2"
                      active={activeItem.menuLabel === "Heading 2"} />
                    <SubmenuRow icon={<Heading3 size={11} />} label="Heading 3"
                      active={activeItem.menuLabel === "Heading 3"} />
                    <SubmenuRow icon={<AlignLeft size={11} />} label="Paragraph"
                      active={activeItem.menuLabel === "Paragraph"} />
                    <SubmenuRow icon={<List size={11} />} label="Bullet List"
                      active={activeItem.menuLabel === "Bullet List"} />
                    <SubmenuRow icon={<ListOrdered size={11} />} label="Numbered List"
                      active={activeItem.menuLabel === "Numbered List"} />
                    <SubmenuRow icon={<Quote size={11} />} label="Quote" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save toast */}
          {toastVisible && phase === "saved-toast" && (
            <div className="absolute bottom-4 right-4 z-50 max-w-[210px] rounded-lg
             bg-[#111716] border border-[#63FF9D]/20 px-3 py-2 shadow-2xl">
              <p className="text-[10px] text-[#63FF9D] font-bold">
                Saved to Studysprout
              </p>
              <p className="text-[9px] text-gray-500">
                from {activeItem.source} ·{" "}
                <span className="text-[#63FF9D] underline">View in Inbox</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — fake StudySprout app, exactly half width on desktop */}
      <div className="w-full lg:w-1/2 flex bg-[#0B0F0F] min-h-[420px] lg:min-h-[640px] relative">

        {/* Sub-panel 1: collapsed icon rail */}
        <div className="w-11 flex-shrink-0 flex flex-col items-center gap-5 py-4
         border-r border-white/5 bg-[#0A0E0E]">
          <Menu size={14} className="text-gray-600" />
          <Search size={14} className="text-gray-600" />
          <Home size={14} className="text-gray-600" />
          <Trash2 size={14} className="text-gray-600" />
          <Clock size={14} className="text-gray-600" />
          <div className="relative">
            <InboxIcon size={14} className="text-[#63FF9D]" />
            {badgeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full
               bg-purple-500 text-white text-[8px] font-bold flex items-center
               justify-center">
                {badgeCount}
              </span>
            )}
          </div>
        </div>

        {/* Sub-panel 2: inbox drawer list */}
        <div className="w-32 sm:w-36 flex-shrink-0 border-r border-white/5 flex flex-col">
          <div className="px-3 py-3 border-b border-white/5">
            <p className="text-[11px] font-bold text-white">Inbox</p>
            <p className="text-[9px] text-gray-600">{inboxItems.length} to file</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {inboxItems.length === 0 ? (
              <p className="text-[8px] text-gray-700 px-1 pt-2 leading-relaxed">
                Nothing captured yet.
              </p>
            ) : (
              inboxItems.map(item => (
                <div
                  key={item.id}
                  className={`rounded-md border border-white/5 bg-white/[0.02] p-1.5
                   transition-all duration-500
                   ${item.justAdded ? "animate-in fade-in slide-in-from-top-1" : ""}`}
                >
                  <span className={`block text-[7px] font-black uppercase tracking-wide ${TYPE_COLOR[item.type]}`}>
                    {item.type.replace("_", " ")}
                  </span>
                  <p className="text-[8px] text-gray-300 leading-snug line-clamp-2 mt-0.5">
                    {item.title}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sub-panel 3: main inbox page */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">Inbox</h2>
            <p className="text-[9px] text-gray-600 mt-0.5">
              Content captured from the browser extension, waiting to be filed.
            </p>
          </div>

          {/* select-all / bulk bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            {phase === "bulk-select" || phase === "merging" ? (
              <>
                <span className="flex items-center gap-1.5 text-[10px] text-white">
                  <CheckSquare size={12} className="text-[#63FF9D]" />
                  {selectedForMerge.length} selected
                </span>
                <div className="flex items-center gap-3">
                  <FolderInput
                    size={13}
                    className={`transition-colors ${phase === "merging" ? "text-[#63FF9D]" : "text-gray-500"}`}
                  />
                  <Trash size={13} className="text-gray-600" />
                </div>
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <Square size={12} className="text-gray-700" />
                Select all
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {inboxItems.length === 0 ? (
              <p className="text-[10px] text-gray-600 text-center mt-10 px-4 leading-relaxed">
                Nothing captured yet. Right-click any text on the web and choose{" "}
                <span className="text-[#63FF9D]">Save to Studysprout</span>.
              </p>
            ) : (
              inboxItems.map((item) => {
                const isSelected = selectedForMerge.includes(item.id);
                const isMerging = isSelected && phase === "merging";
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border border-white/5 bg-white/[0.02] p-3
                     transition-all duration-500
                     ${item.justAdded ? "animate-in fade-in slide-in-from-top-2" : ""}
                     ${isSelected ? "border-[#63FF9D]/40 bg-[#63FF9D]/5" : ""}
                     ${isMerging ? "scale-95 opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`flex items-center gap-1.5 text-[8px] font-black
                       uppercase tracking-widest ${TYPE_COLOR[item.type]}`}>
                        {isSelected ? (
                          <CheckSquare size={11} className="text-[#63FF9D]" />
                        ) : (
                          <Square size={11} className="text-gray-700" />
                        )}
                        {item.type.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FolderInput size={12} />
                        <Trash size={12} />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-300 font-medium leading-snug line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-[9px] text-gray-600 mt-1">just now</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Replay trigger */}
        {phase === "resetting" && (
          <button
            onClick={onReplay}
            className="absolute bottom-3 right-3 z-50 flex items-center justify-center gap-1.5
             rounded-lg border border-[#63FF9D]/20 bg-[#111716] hover:bg-[#63FF9D]/10
             px-2.5 py-1.5 text-[9px] font-bold text-[#63FF9D] uppercase
             tracking-widest transition-colors animate-in fade-in shadow-2xl"
          >
            <RefreshCw size={11} />
            Replay
          </button>
        )}

        {/* Merged toast */}
        {toastVisible && phase === "merged-toast" && (
          <div className="absolute bottom-3 right-3 z-50 rounded-lg
           bg-[#111716] border border-[#63FF9D]/20 px-3 py-2 shadow-2xl">
            <p className="text-[10px] text-[#63FF9D] font-bold">Merged</p>
            <p className="text-[9px] text-gray-500">Selected items merged successfully</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MenuRow = ({
  icon,
  label,
  shortcut,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}) => (
  <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-gray-400">
    <span className="flex items-center gap-2">
      {icon}
      {label}
    </span>
    {shortcut && <span className="text-gray-600 text-[9px]">{shortcut}</span>}
  </div>
);

const SubmenuRow = ({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 transition-colors
      ${active ? "bg-[#63FF9D]/10 text-[#63FF9D]" : "text-gray-400"}`}
  >
    {icon}
    {label}
  </div>
);
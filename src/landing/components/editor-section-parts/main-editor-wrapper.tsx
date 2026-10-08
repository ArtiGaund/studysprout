'use client';

import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { CheckSquare, MousePointer2, MousePointerClick, RefreshCw } from "lucide-react";
import React from "react";

export interface MainEditorWrapperProps{
    isOffline: boolean;
    contentRef: React.RefObject<HTMLDivElement>;
    artiPos: { left: number; top: number; height: number; };
    artiStatus: string;
    editorRef: React.RefObject<HTMLDivElement>;
    userHasTyped: boolean;
    handleSimulateOffline: () => void;
    syncBuffer: number;
    editor: BlockNoteEditor;
};

export const MainEditorWrapper: React.FC<MainEditorWrapperProps> = ({
    isOffline,
    contentRef,
    artiPos,
    artiStatus,
    editorRef,
    userHasTyped,
    handleSimulateOffline,
    syncBuffer,
    editor,
}) => {
    return(
        <div className={`flex flex-row w-full overflow-hidden rounded-2xl border 
        transition-all duration-500 bg-[#0E090B] shadow-2xl 
        ${isOffline ? 'border-orange-500/30' : 'border-[#2A1E22]'}`}>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full lg:min-h-[700px] border-r border-[#2A1E22] 
          bg-[#0B0709]">
            
            {/* Actual Project Header Style */}
            <div className="flex items-center justify-between px-6 py-4 border-b
             border-[#2A1E22] bg-[#120C0E]">
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-stone-500 flex items-center gap-2">
                  📁 Collaboration 
                  <span className="text-stone-800">/</span>
                </span>
                <span className="text-stone-500 flex items-center gap-2">
                  📁 ArtiFolder 
                  <span className="text-stone-800">/</span>
                </span>
                <span className="text-[#F5F0EB] flex items-center gap-2">📄 Untitled</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase 
                  tracking-widest ${isOffline 
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                  : 'bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/20'}`
                  }>
                  {isOffline ? 'Offline' : 'Saved'}
                </div>
                <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-orange-500 border-2 text-[#0E090B]
                    border-[#0E090B] flex items-center justify-center text-[9px] font-bold">
                      A
                    </div>
                    <div className="w-6 h-6 rounded-full bg-purple-500 border-2 text-white
                    border-[#0E090B] flex items-center justify-center text-[9px] font-bold">
                      M
                    </div>
                    <div className="w-6 h-6 rounded-full bg-stone-700 border-2 text-stone-300
                    border-[#0E090B] flex items-center justify-center text-[9px] font-bold">
                      +
                    </div>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div ref={contentRef} className="relative flex-1 p-16 overflow-y-auto">
              {/* Actual Project "Untitled (FILE)" Start Style */}
              <div className="flex flex-col items-center mb-12 opacity-80">
                <div className="w-20 h-24 bg-[#160F12] rounded-lg border border-[#2A1E22] flex
                 flex-col p-3 gap-2 mb-6">
                  <div className="h-1.5 w-full bg-[#C9A227]/40 rounded-full"/>
                  <div className="h-1.5 w-3/4 bg-stone-600 rounded-full"/>
                  <div className="h-1.5 w-full bg-stone-700 rounded-full"/>
                </div>
                <span className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">
                  Add Banner
                </span>
                <h1 className="text-4xl font-bold text-[#F5F0EB] font-serif">
                  Untitled 
                  <span className="text-xs text-stone-500 ml-2 font-normal">(FILE)</span>
                </h1>
              </div>

              {/* Arti Cursor Overlay */}
              <div 
              className="absolute z-50 pointer-events-none" 
              style={{ 
                left: `${artiPos.left}px`, 
                top: `${artiPos.top}px`, 
                height: `${artiPos.height}px`, 
                transition: "all 0.1s ease-out" 
              }}>
                <div className="bg-orange-500 text-[#0E090B] text-[8px] px-1.5 py-0.5 rounded-sm
                 font-bold -translate-y-full mb-1 font-mono">
                  {artiStatus}
                </div>
                <div className="w-[1px] bg-orange-500 h-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
              </div>

            
              <div ref={editorRef} className="max-w-3xl mx-auto">

                 {/* Pointer Anchor */}
             {!userHasTyped && (
                <div className="absolute left-[15%] top-[50%] z-[100] pointer-events-none 
                -translate-y-1/2 flex flex-col items-center">

                     {/* Floating Popup Label */}
                    <div className="relative bg-[#C9A227] text-[#0E090B] text-[10px] font-black px-3 
                    py-1.5 rounded-lg shadow-[0_0_30px_rgba(201,162,39,0.4)] animate-bounce 
                    whitespace-nowrap left-[-100%] font-mono">
                      TRY TYPING HERE...
                      {/* Small Arrow pointing up */}
                      <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2
                       bg-[#C9A227] rotate-45" />
                    </div>

                    <div className="relative left-[-50%]">
                      {/* The Click Halo (Circle) */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      w-5 h-5 rounded-full border-2 border-[#C9A227]/40 animate-ping" />
                      
                      {/* Green Pointer - Rotated to point right/up */}
                      <MousePointer2 
                        size={20} 
                        className="text-[#C9A227] fill-[#C9A227] rotate-[100deg]
                         drop-shadow-[0_0_15px_rgba(201,162,39,0.8)]" 
                      />
                    </div>
                </div>
            )}

                <BlockNoteView editor={editor} theme="dark" />
              </div>
            </div>
          </div>

          {/* Right Sidebar: Activity & Resilience */}
          <div className="w-72 flex flex-col bg-[#120C0E]">
            <div className="p-8 space-y-12">
              
              {/* File Activity */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#C9A227] uppercase 
                  tracking-[0.2em]">
                    File Activity
                  </span>
                </div>
                <div className={`space-y-4 transition-opacity duration-500 
                  ${isOffline ? 'opacity-30' : 'opacity-100'}`}>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest
                  font-mono">
                    Collaborators ({isOffline ? '0' : '3'})
                  </p>
                  {!isOffline && (
                    <div className="space-y-4">
                      {[{n:"Arti (AI)", c:"bg-orange-500 text-[#0E090B]"}, {n:"Mili (Peer)", c:"bg-purple-500 text-white"}, {n:"You", c:"bg-[#C9A227] text-[#0E090B]"}].map((m,i)=>(
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full ${m.c} flex items-center 
                          justify-center text-[8px] font-bold text-[#0E090B]`}>
                            {m.n[0]}
                          </div>
                          <span className="text-xs text-stone-400 font-medium">{m.n}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Flashcards */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-stone-400">
                  <CheckSquare size={14} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                    Flashcards
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-[#2A1E22] bg-[#160F12]">
                  <p className="text-[10px] text-stone-500 italic">2 Concept cards linked.</p>
                </div>
              </div>

              {/* Telemetry/Resilience */}
              <div className="pt-8 border-t border-[#2A1E22] space-y-6">
                 <button 
                  onClick={handleSimulateOffline} 
                  disabled={isOffline}
                  className="relative w-full flex items-center justify-between p-4 rounded-xl border
                   border-orange-500/20 bg-orange-500/5 group hover:bg-orange-500/10 
                   transition-all"
                >
                  <div className="text-left">
                    <span className="block text-[8px] font-mono font-black text-orange-500 uppercase
                     tracking-widest mb-1">Stability Test</span>
                    <span className="block text-[10px] text-[#F5F0EB] font-bold">
                      {isOffline ? `Buffered: ${syncBuffer}` : 'Cut Connection'}
                    </span>
                  </div>

                  {/* Ghost pointer */}
                  <div className="absolute right-4 top-8 text-[#C9A227] 
                  pointer-events-none z-[100] animate-bounce">
                    <div className="flex flex-col items-center gap-1.5">
                      <MousePointerClick 
                      size={36} 
                      className="drop-shadow-[0_0_20px_rgba(201,162,39,0.9)]"
                      />
                    <span className="text-[8px] font-mono font-black uppercase bg-[#C9A227] 
                    text-[#0E090B] px-1.5 rounded-sm shadow-xl">
                      Try it
                    </span>
                  </div>
                </div>

                  <RefreshCw size={14} className={`text-orange-500 ${isOffline 
                    ? 'animate-spin' : ''}`} />
                </button>
                <div className="space-y-3 font-mono text-[9px]">
                    <div className="flex justify-between text-stone-500">
                      <span>Latency</span> 
                      <span className={isOffline 
                        ? 'text-stone-600' 
                        : 'text-[#F5F0EB]'}>
                          24ms
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Sync Protocol</span> 
                      <span className="text-[#C9A227]">Yjs CRDT</span>
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>
    )
}
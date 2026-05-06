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
        transition-all duration-500 bg-[#080C0C] shadow-2xl 
        ${isOffline ? 'border-orange-500/30' : 'border-white/5'}`}>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full lg:min-h-[700px] border-r border-white/5">
            
            {/* Actual Project Header Style */}
            <div className="flex items-center justify-between px-6 py-4 border-b
             border-white/5 bg-[#080C0C]">
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-gray-500 flex items-center gap-2">
                  📁 Collaboration 
                  <span className="text-gray-800">/</span>
                </span>
                <span className="text-gray-500 flex items-center gap-2">
                  📁 ArtiFolder 
                  <span className="text-gray-800">/</span>
                </span>
                <span className="text-white flex items-center gap-2">📄 Untitled</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase 
                  tracking-widest ${isOffline 
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                  : 'bg-[#63FF9D]/10 text-[#63FF9D] border border-[#63FF9D]/20'}`
                  }>
                  {isOffline ? 'Offline' : 'Saved'}
                </div>
                <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-orange-500 border-2 
                    border-[#080C0C] flex items-center justify-center text-[9px] font-bold">
                      A
                    </div>
                    <div className="w-6 h-6 rounded-full bg-purple-500 border-2 
                    border-[#080C0C] flex items-center justify-center text-[9px] font-bold">
                      M
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gray-700 border-2 
                    border-[#080C0C] flex items-center justify-center text-[9px] font-bold">
                      +
                    </div>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div ref={contentRef} className="relative flex-1 p-16 overflow-y-auto">
              {/* Actual Project "Untitled (FILE)" Start Style */}
              <div className="flex flex-col items-center mb-12 opacity-80">
                <div className="w-20 h-24 bg-white/5 rounded-lg border border-white/10 flex
                 flex-col p-3 gap-2 mb-6">
                  <div className="h-1.5 w-full bg-white/20 rounded-full"/>
                  <div className="h-1.5 w-3/4 bg-white/10 rounded-full"/>
                  <div className="h-1.5 w-full bg-white/10 rounded-full"/>
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                  Add Banner
                </span>
                <h1 className="text-4xl font-bold text-gray-300">
                  Untitled 
                  <span className="text-xs text-gray-600 ml-2 font-medium">(FILE)</span>
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
                <div className="bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-sm
                 font-bold -translate-y-full mb-1">
                  {artiStatus}
                </div>
                <div className="w-[1px] bg-orange-500 h-full shadow-[0_0_10px_orange]" />
              </div>

            
              <div ref={editorRef} className="max-w-3xl mx-auto">

                 {/* Pointer Anchor */}
             {!userHasTyped && (
                <div className="absolute left-[15%] top-[50%] z-[100] pointer-events-none 
                -translate-y-1/2 flex flex-col items-center">

                     {/* Floating Popup Label */}
                    <div className="relative bg-[#63FF9D] text-black text-[10px] font-black px-3 
                    py-1.5 rounded-lg shadow-[0_0_30px_rgba(99,255,157,0.4)] animate-bounce 
                    whitespace-nowrap left-[-100%]">
                      TRY TYPING HERE...
                      {/* Small Arrow pointing up */}
                      <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2
                       bg-[#63FF9D] rotate-45" />
                    </div>

                    <div className="relative left-[-50%]">
                      {/* The Click Halo (Circle) */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      w-5 h-5 rounded-full border-2 border-[#63FF9D]/40 animate-ping" />
                      
                      {/* Green Pointer - Rotated to point right/up */}
                      <MousePointer2 
                        size={20} 
                        className="text-[#63FF9D] fill-[#63FF9D] rotate-[100deg]
                         drop-shadow-[0_0_15px_rgba(99,255,157,0.8)]" 
                      />
                    </div>
                </div>
            )}

                <BlockNoteView editor={editor} theme="dark" />
              </div>
            </div>
          </div>

          {/* Right Sidebar: Activity & Resilience */}
          <div className="w-72 flex flex-col bg-white/[0.01]">
            <div className="p-8 space-y-12">
              
              {/* File Activity */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#63FF9D] uppercase 
                  tracking-[0.2em]">
                    File Activity
                  </span>
                </div>
                <div className={`space-y-4 transition-opacity duration-500 
                  ${isOffline ? 'opacity-30' : 'opacity-100'}`}>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    Collaborators ({isOffline ? '0' : '3'})
                  </p>
                  {!isOffline && (
                    <div className="space-y-4">
                      {[{n:"Arti (AI)", c:"bg-orange-500"}, {n:"Mili (Peer)", c:"bg-purple-500"}, {n:"You", c:"bg-[#63FF9D]"}].map((m,i)=>(
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full ${m.c} flex items-center 
                          justify-center text-[8px] font-bold text-black`}>
                            {m.n[0]}
                          </div>
                          <span className="text-xs text-gray-400 font-medium">{m.n}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Flashcards */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <CheckSquare size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Flashcards
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <p className="text-[10px] text-gray-600 italic">2 Concept cards linked.</p>
                </div>
              </div>

              {/* Telemetry/Resilience */}
              <div className="pt-8 border-t border-white/5 space-y-6">
                 <button 
                  onClick={handleSimulateOffline} 
                  disabled={isOffline}
                  className="relative w-full flex items-center justify-between p-4 rounded-xl border
                   border-orange-500/20 bg-orange-500/5 group hover:bg-orange-500/10 
                   transition-all"
                >
                  <div className="text-left">
                    <span className="block text-[8px] font-black text-orange-500 uppercase
                     tracking-widest mb-1">Stability Test</span>
                    <span className="block text-[10px] text-white font-bold">
                      {isOffline ? `Buffered: ${syncBuffer}` : 'Cut Connection'}
                    </span>
                  </div>

                  {/* Ghost pointer */}
                  <div className="absolute right-4 top-8 text-[#A78BFF] 
                  pointer-events-none z-[100] animate-bounce">
                    <div className="flex flex-col items-center gap-1.5">
                      <MousePointerClick 
                      size={36} 
                      className="drop-shadow-[0_0_20px_rgba(167,139,255,0.9)]"
                      />
                    <span className="text-[8px] font-black uppercase bg-[#A78BFF] text-black
                     px-1.5 rounded-sm shadow-xl">
                      Try it
                    </span>
                  </div>
                </div>

                  <RefreshCw size={14} className={`text-orange-500 ${isOffline 
                    ? 'animate-spin' : ''}`} />
                </button>
                <div className="space-y-3 font-mono text-[9px]">
                    <div className="flex justify-between text-gray-700">
                      <span>Latency</span> 
                      <span className={isOffline 
                        ? 'text-gray-800' 
                        : 'text-white'}>
                          24ms
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Sync Protocol</span> 
                      <span className="text-[#63FF9D]">Yjs CRDT</span>
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>
    )
}
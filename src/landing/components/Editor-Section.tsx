'use client';

import { 
    Network, Hash, AlignLeft, List, CheckSquare, 
    Zap, Users, WifiOff, Activity, RefreshCw, 
    Shield, FileText, ChevronRight, MessageSquare,
    MousePointerClick,
    MousePointer2
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

const HEADING_PHRASE = "Getting Started with StudySprout";
const LOOP_ACTIONS = [
  {
    type:      "paragraph",
    phrase:    "Organize your notes with rich text, headings, lists, and media blocks.",
  },
  {
    type:      "bulletListItem",
    phrase:    "Collaborate live with classmates — see their cursors in real time",
  },
] as const;

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export const EditorSection = () => {
  const [artiStatus,    setArtiStatus]    = useState("Arti typing...");
  const [artiPos,       setArtiPos]       = useState({ top: 0, left: 0, height: 24 });
  const [isOffline,     setIsOffline]     = useState(false);
  const [syncBuffer,    setSyncBuffer]    = useState(0);
  // User presence state
  const [ userHasTyped, setUserHasTyped ] = useState(false);

  const editor       = useCreateBlockNote();
  const editorRef    = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);
  const artiBlockIdx = useRef(0);

  const handleSimulateOffline = async () => {
    if (isOffline) return;
    setIsOffline(true);
    for(let i = 1; i <= 12; i++) {
        await delay(180);
        setSyncBuffer(i);
    }
    await delay(2500);
    setIsOffline(false);
    setSyncBuffer(0);
  };

  const syncCaret = useCallback(() => {
    const editorEl = editorRef.current?.querySelector(".bn-editor");
    if (!editorEl || !contentRef.current) return;
    const outers   = editorEl.querySelectorAll(".bn-block-outer");
    const outerEl  = outers[artiBlockIdx.current];
    if (!outerEl) return;
    const inlineEl = outerEl.querySelector(".bn-inline-content");
    if (!inlineEl) return;

    try {
      const range  = document.createRange();
      const node   = inlineEl.lastChild ?? inlineEl;
      const offset = node.nodeType === Node.TEXT_NODE ? (node.textContent?.length ?? 0) : 0;
      range.setStart(node, offset);
      range.collapse(true);
      const rects      = range.getClientRects();
      const parentRect = contentRef.current.getBoundingClientRect();
      const rect       = rects.length > 0 ? rects[0] : inlineEl.getBoundingClientRect();
      setArtiPos({
        top: (rect.top - parentRect.top),
        left: rect.left - parentRect.left,
        height: rect.height || 24,
      });
    } catch (_) {}
  }, []);

  useEffect(() => {
  const checkContent = () => {
    // If user has created more blocks than the initial header + Arti's paragraph
    if (editor.topLevelBlocks.length > 4) {
      setUserHasTyped(true);
      return;
    }

    const secondBlock = editor.topLevelBlocks[1];
    if (secondBlock && Array.isArray(secondBlock.content)) {
        // We only mark as "typed" if the content differs from Arti's current phrase 
        // OR if the user has manually entered text. 
        // A simple way is to check if the user has clicked/focused or added specific text.
        const textValue = secondBlock.content.map((c:any) => c.text || "").join("");
        
        // If textValue exists and doesn't match the current LOOP_ACTIONS, it's user input
        if (textValue.length > 0 && !LOOP_ACTIONS.some(a => a.phrase.startsWith(textValue))) {
            setUserHasTyped(true);
        }
    }
  };

  const unsub = editor.onChange(checkContent);
  return () => { if (unsub) unsub(); };
}, [editor]);
  useEffect(() => {
    let frameId: number;
    const obs = new MutationObserver(() => {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => syncCaret());
    });
    if (editorRef.current) {
        obs.observe(editorRef.current, { childList: true, subtree: true, characterData: true });
    }
    return () => { obs.disconnect(); cancelAnimationFrame(frameId); };
  }, [syncCaret]);

  useEffect(() => {
    let alive = true;
    const typePhrase = async (blockId: string, phrase: string): Promise<string> => {
      let typed = "";
      for (const ch of phrase) {
        if (!alive) return typed;
        typed += ch;
        editor.updateBlock(blockId, { content: typed });
        syncCaret();
        await delay(52);
      }
      return typed;
    };

    const deletePhrase = async (blockId: string, typed: string) => {
      setArtiStatus("Arti deleting...");
      for (let i = typed.length; i >= 0; i--) {
        if (!alive) return;
        editor.updateBlock(blockId, { content: typed.substring(0, i) });
        syncCaret();
        await delay(28);
      }
      setArtiStatus("Arti typing...");
    };

    const run = async () => {
      const block0Id = editor.topLevelBlocks[0].id;
      artiBlockIdx.current = 0;
      await typePhrase(block0Id, HEADING_PHRASE);
      editor.insertBlocks([{ type: "paragraph", content: "" }], block0Id, "after");
      while (alive) {
        for (const action of LOOP_ACTIONS) {
          if (!alive) return;
          const block1Id = editor.topLevelBlocks[1]?.id;
          if (!block1Id) { await delay(200); continue; }
          artiBlockIdx.current = 1;
          const typed = await typePhrase(block1Id, action.phrase);
          await delay(2200);
          await deletePhrase(block1Id, typed);
        }
      }
    };
    run();
    return () => { alive = false; };
  }, [editor, syncCaret]);

  return (
    <section id="editor-section" className="scroll-mt-32 relative py-20 px-6 bg-[#050A0A] overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">

        {/* Section Heading */}
        <div className="text-center mb-16 space-y-4">
            <h3 className="text-[#63FF9D] font-mono text-xs uppercase tracking-[0.4em] opacity-80">
                Performance Core
            </h3>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                The <span className="text-[#63FF9D]">Sprout</span> Editor.
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
                A high-performance, local-first environment built for deep work. 
                Experience seamless collaboration with zero latency.
            </p>
        </div>

        {/* Main Editor Wrapper */}
        <div className={`flex flex-col lg:flex-row w-full overflow-hidden rounded-2xl border transition-all duration-500 bg-[#080C0C] shadow-2xl ${isOffline ? 'border-orange-500/30' : 'border-white/5'}`}>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-[700px] border-r border-white/5">
            
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

        {/* Technical Deep-Dive: Proving the Engineering */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full">
            <div className="space-y-4 p-8 rounded-3xl bg-white/[0.02] border
             border-white/5 hover:border-[#63FF9D]/20 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-[#63FF9D]/10 flex items-center 
                justify-center text-[#63FF9D] group-hover:scale-110 transition-transform">
                    <Activity size={22} />
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-white">Conflict-Free Sync</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        {`Powered by **Yjs CRDTs**. Multiple users can edit the same document 
                        simultaneously 
                        without ever seeing a "merge conflict" or losing a single keystroke.`}
                    </p>
                </div>
            </div>

            <div className="space-y-4 p-8 rounded-3xl bg-white/[0.02] border
             border-white/5 hover:border-purple-400/20 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-purple-400/10 flex items-center
                 justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Users size={22} />
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-white">Real-Time Awareness</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Utilizes **Socket.io** for ultra-low latency cursor tracking and presence. 
                        See exactly where your collaborators are working in real-time.
                    </p>
                </div>
            </div>

            <div className="space-y-4 p-8 rounded-3xl bg-white/[0.02] border
             border-white/5 hover:border-orange-500/20 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center 
                justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <Shield size={22} />
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-white">Local-First Privacy</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        {`Your data is stored in a **Local Vault** before hitting the cloud. 
                        If your network fails, editing continues instantly—syncing only when
                        you're back online.`}
                    </p>
                </div>
            </div>
        </div>
      </div>

      <style jsx global>{`
        .bn-editor { 
            caret-color: #63FF9D !important; 
            min-height: 400px; 
            background: transparent !important; 
        }
        .bn-container { background: transparent !important; }
        .bn-editor ::selection { background: rgba(99, 255, 157, 0.1); }
      `}</style>
    </section>
  );
};
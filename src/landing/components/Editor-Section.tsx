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
import { CollapsedPreview } from "./Dashboard-preview-parts/Collapsed-Preview";
import { MainEditorWrapper, MainEditorWrapperProps } from "./editor-section-parts/main-editor-wrapper";
import { FullscreenPopup } from "./Dashboard-preview-parts/Fullscreen-Popup";


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
  const [ showCollapsed, setShowCollapsed ] = useState(false);
  const [ isExpanded, setIsExpanded ] = useState(false);

  const editor       = useCreateBlockNote();
  const editorRef    = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const artiBlockIdx = useRef(0);

  useEffect(() => {
     const check = () => {
            if(containerRef.current){
                // Below 1024 px (lg) the flex-row layout collapses and the editor becomes too
                // cramped to interact with comfortably.
                setShowCollapsed(containerRef.current.offsetWidth < 768);
            }
        };
        check();
        const observer = new ResizeObserver(check);
        if(containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
  },[])
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

  const editorProps: MainEditorWrapperProps = {
    isOffline,
    contentRef,
    artiPos,
    artiStatus,
    editorRef,
    userHasTyped,
    handleSimulateOffline,
    syncBuffer,
    editor,
  }

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
        <div 
        ref={containerRef}
        className="w-full"
        >
          {showCollapsed ? (
             /*--- Small screen: hint badge + collapsed preview --- */
            <div className="flex flex-col items-center gap-4">
              {/* Hint badge */}
              <div className="px-4 py-2 bg-[#63FF9D]/10 border border-[#63FF9D]/20
                rounded-full animate-bounce">
                  <p className="text-[#63FF9D] text-[10px] font-black uppercase tracking-widest">
                      Tap Expand to interact with the editor
                  </p>
              </div>
            
              {/* Card wrapper - same visual chrome as the large-screen card */}
              <div className="w-full rounded-3xl border border-white/10 bg-[#080C0C]/80 
              backdrop-blur-3xl shadow-2xl overflow-hidden">
                {/* Inner top bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b 
                  border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#63FF9D] animate-pulse"/>
                        <span className="text-white font-black uppercase tracking-widest 
                        text-[10px]">
                            Editor
                          <span className="text-gray-500 font-medium ml-2">
                            - Interactive Playground
                          </span>
                        </span>
                      </div>
                    </div>
            
                    {/* Collapsed preview with ghost chrome */}
                    <div className="p-1">
                      <CollapsedPreview 
                        onExpand={() => setIsExpanded(true)}
                        heading="Interactive Editor"
                        subHeading=" Tap to launch full editor experience"
                        type="editor"
                      />
                    </div>
                  </div>
                </div>
          ) : (
            <MainEditorWrapper {...editorProps}/>
          )}
        </div>

        <FullscreenPopup 
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          sandboxContent = { <MainEditorWrapper {...editorProps}/>}
        />

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
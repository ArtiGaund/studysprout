'use client';

import { 
    CheckCircle2,
    ChevronRight, 
    FileText, 
    FileUp, 
    Folder, 
    Globe, 
    Layout, 
    Loader2, 
    Lock, 
    Users,
    Zap,
    MousePointerClick,
    Paperclip
 } from "lucide-react";
import { useState } from "react";

export const WorkspaceShowcaseSection = () => {
    const [ mode, setMode ] = useState<'private' | 'public'>('private');
    const [ isExtracting, setIsExtracting ] = useState(false);
    const [ hasExtracted, setHasExtracted ] = useState(false);
    const [ progress, setProgress ] = useState(0); 
    const [ activeFolder, setActiveFolder ] = useState<'drafts' | 'extracted'>('drafts');

    const handleSimulateExtraction = async () => {
        if(isExtracting) return;

        setIsExtracting(true);
        setHasExtracted(false);
        setProgress(0);
        setActiveFolder('extracted');

        await new Promise(r => setTimeout(r, 1000));
        setProgress(1); 

        await new Promise(r => setTimeout(r, 800));
        setProgress(2);

        await new Promise(r => setTimeout(r, 800));
        setProgress(3);

        await new Promise(r => setTimeout(r, 400));
        setIsExtracting(false);
        setHasExtracted(true);
    }

    return (
        <section 
            id="workspaces-section"
            className="scroll-mt-20 relative isolate py-16 md:py-32 px-4 sm:px-6 lg:px-8
            overflow-hidden bg-[#120C0E]"
        >
            {/* Background Texture and Lighting */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[80vw] h-[40vh] max-w-[1000px] rounded-full blur-[100px] md:blur-[140px]
                    transition-all duration-700
                     ${mode === 'private' ? 'bg-[#C9A227]/10' : 'bg-purple-600/10'}`}
                />
                <div className="absolute inset-0 opacity-[0.03]
                 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)]
                 [background-size:48px_48px]"/>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col items-center">
                <div className="text-center mb-12 md:mb-16 space-y-4 px-4">
                    <h3 className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                     bg-[#C9A227]/10 border border-[#C9A227]/20 text-[#C9A227] font-mono 
                     text-[10px] uppercase tracking-[0.3em]">
                        Knowledge Management
                    </h3>
                    <h2 className="text-4xl md:text-5xl font-serif text-[#F5F0EB] leading-tight">
                        Cultivate Your <span className="font-serif italic text-[#C9A227]">
                            Digital Forest.</span>
                    </h2>
                    <p className="mt-4 text-sm sm:text-base md:text-lg leading-relaxed 
                    text-[#A09388] font-serif max-w-2xl mx-auto">
                        Switch between high-security private vaults and collaborative public gardens. 
                        Decompose complex research into infinite nested architectures.
                    </p>
                </div>
                {/* Interactive Toggle */}
                <div className="inline-flex items-center p-1 bg-[#160F12] border border-[#2A1E22] 
                    rounded-2xl mb-12 md:mb-24 backdrop-blur-md
                    transform-gpu will-change-transform backface-hidden w-full sm:w-auto">
                    <button
                        onClick={() => setMode('private')}
                        className={`flex-1 sm:flex-none flex items-center gap-2 px-4 md:px-6 py-3
                            rounded-xl text-xs md:text-sm font-bold transition-all
                            duration-300 ${ mode === 'private' 
                                ? 'bg-[#C9A227] text-[#0E090B] shadow-[0_0_20px_rgba(201,162,39,0.35)]' 
                                : 'text-stone-400 hover:text-white'}`}
                    >   
                        <Lock size={14}/> Private Vault
                    </button>
                    <button
                        onClick={() => setMode('public')}
                        className={`flex-1 sm:flex-none flex items-center gap-2 px-4 md:px-6 py-3
                            rounded-xl text-xs md:text-sm font-bold transition-all
                            duration-300 ${mode === 'public' 
                                ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.35)]' 
                                : 'text-stone-400 hover:text-white'}`}
                    >
                        <Globe size={16}/> Public Garden
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-start md:items-center
                w-full">
                    {/* Left Side: Technical Monitor */}
                    <div className="space-y-8 md:space-y-12 text-center lg:text-left 
                    transition-all duration-500">
                        <div className="space-y-5">
                            <h3 className="text-[#C9A227] font-mono text-xs uppercase tracking-[0.4em] opacity-80">
                                {mode === 'private' ? 'Deep Focus' : 'Shared Intelligence'}
                            </h3>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#F5F0EB]
                             leading-[1.1] font-serif">
                                { mode === 'private'
                                ? <> A <span className="text-[#C9A227]"> Sanctuary </span>for Your Second Brain.</>
                                : <>A Common for <br /> <span className="text-purple-400">Collaborative</span> Growth.</>}
                            </h2>
                        </div>

                        {/* BullMQ / Status Monitor Card */}
                        <div className="mx-auto lg:mx-0 relative group p-6 md:p-8 rounded-2xl 
                        border border-[#2A1E22] bg-[#120C0E] overflow-hidden max-w-md 
                        lg:max-w-lg">
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl transition-all duration-500
                                        ${isExtracting
                                        ? 'bg-[#C9A227] text-[#0E090B] scale-110 shadow-[0_0_25px_rgba(201,162,39,0.5)]'
                                        : 'bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/30'}`}>
                                        {isExtracting 
                                        ? <Loader2 size={24} className="animate-spin"/>
                                        : <Zap size={24}/>
                                        }
                                    </div>
                                    <div>
                                        <h4 className="text-[#F5F0EB] font-bold text-sm">
                                            Knowledge Architecture
                                        </h4>
                                        <p className="text-[10px] text-[#C9A227] font-mono
                                         font-bold tracking-widest uppercase">
                                            {isExtracting ? "BullMQ Worker Active" : hasExtracted ? "Structured Synthesized" : "Monitor: Standby"}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-stone-400 leading-relaxed">
                                    {isExtracting
                                    ? "Fracturing document into atomic nodes. Extracting structure from Methodology.pdf..."
                                    : "Drop research papers via the file tree to watch Studysprout fracture them into logical folder architecture automatically."
                                    }
                                </p>
                            </div>
                        </div>
                        
                        {/* Nesting Stats */}
                        <div className="flex justify-center lg:justify-start gap-8 md:gap-16 pt-4">
                            <div className="space-y-1">
                                <div className="text-[10px] text-stone-500 uppercase 
                                tracking-[0.2rem] font-mono font-bold">Nesting</div>
                                <div className="text-[#F5F0EB] font-bold text-2xl">Infinite</div>
                            </div>
                            <div className="w-px h-12 bg-[#2A1E22]"/>
                            <div className="space-y-2">
                                <div className="text-[10px] text-stone-500 uppercase
                                 tracking-[0.2em] font-mono font-bold">Access</div>
                                <div className="text-[#F5F0EB] font-bold text-2xl">
                                    {mode === 'private' ? 'Personal' : 'Multi-user'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Interactive 3D Hierarchy Visual */}
                    <div className="relative group [perspective:2000px] w-full max-w-lg mx-auto">
                        <div className="relative bg-[#0E090B] border border-[#2A1E22]
                        rounded-2xl p-6 md:p-10 backdrop-blur-3xl 
                        transform-gpu will-change-transform backface-hidden 
                        shadow-2xl transition-all 
                        duration-700 md:[transform:rotateY(-10deg)rotateX(5deg)] 
                        hover:[transform:rotateY(0deg)rotateX(0deg)]
                        [transform:rotateY(0deg)rotateX(0deg)]">

                            <div className="flex items-center justify-between mb-10 pb-5 
                            border-b border-[#2A1E22]">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl transition-colors 
                                        duration-500 ${mode === 'private' 
                                        ? 'bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/30' 
                                        : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'}`}>
                                        { mode === 'private' ? <Lock size={18}/> : <Users size={18}/> }
                                    </div>
                                    <span className="text-sm font-bold text-[#F5F0EB] uppercase 
                                    tracking-[0.2em]">
                                        { mode === 'private' ? 'Workspace_Vault' : 'Project_Garden' }
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-8 font-mono relative min-h-[400px]">
                                {/* Workspace Name */}
                                <div className="flex items-center gap-4 text-[#F5F0EB]">
                                    <Layout className={mode === 'private' 
                                        ? 'text-[#C9A227]' : 'text-purple-400'} size={20} />
                                    <span className="text-sm font-semibold tracking-tight">
                                        {mode === 'private'
                                        ? 'Personal_Thesis'
                                        : 'Neuroscience_Garden'
                                    }
                                    </span>
                                </div>

                                <div className="ml-6 space-y-6 relative">
                                    <div className="absolute left-[-22px] top-[-30px] bottom-0
                                     w-px bg-[#2A1E22]"/>
                                    
                                    {/* FOLDER Header & Attach action */}
                                    <div className="flex items-center justify-between group/heading">
                                        <span className="text-[10px] text-stone-500 font-bold
                                         tracking-[0.3em]">FOLDERS</span>
                                        <div className="relative">
                                            <button
                                                onClick={handleSimulateExtraction}
                                                className="p-1.5 rounded-lg bg-[#160F12] 
                                                hover:bg-[#C9A227]/20 text-[#C9A227] 
                                                transition-all border border-[#2A1E22]"
                                            >
                                                <Paperclip size={14}/>
                                            </button>
                                            {/* Ghost Pointer Targeting the Import Button */}
                                            {!isExtracting && !hasExtracted && (
                                                <div className="absolute right-[-45px] 
                                                top-[-10px] text-[#C9A227] pointer-events-none 
                                                z-[100] animate-bounce">
                                                    <div className="flex flex-col items-center 
                                                    gap-1.5">
                                                        <MousePointerClick 
                                                        size={36} 
                                                        className="drop-shadow-[0_0_15px_rgba(201,162,39,0.8)]"/>
                                                        <span className="text-[8px] font-black 
                                                        uppercase bg-[#C9A227] text-[#0E090B] 
                                                        px-1.5 rounded-sm shadow-xl">Try it</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Folder 1: Research Drafts /*/}
                                    <div className={`relative ml-4 p-3 rounded-xl transition-all 
                                    duration-500 border
                                        ${activeFolder === 'drafts' 
                                            ? 'bg-[#160F12] border-[#C9A227]/40 scale-105 shadow-[0_10px_30px_-5px_rgba(201,162,39,0.2)] z-10' 
                                            : 'border-transparent opacity-100'}`}>
                                        <div className="absolute -left-[30px] top-1/2 w-5 h-px 
                                        bg-[#2A1E22]"/>
                                        <div className="flex items-center gap-3 text-stone-400">
                                            <Folder size={18} 
                                            className={activeFolder === 'drafts' 
                                            ? 'text-[#C9A227]' : 'opacity-80'}/>
                                            <span className={`text-sm font-medium 
                                                ${activeFolder === 'drafts' ? 'text-[#F5F0EB]' : ''}`}>
                                                {mode === 'private'
                                                ? 'Research_Drafts'
                                                : 'Published_Notes'
                                                }
                                            </span>
                                            {activeFolder === 'drafts' && 
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full 
                                            bg-[#C9A227] animate-pulse"/>}
                                        </div>

                                        <div className="ml-10 mt-4 space-y-4 relative">
                                            <div className="absolute -left-6 -top-4 bottom-2 
                                            w-px bg-[#2A1E22]"/>
                                            <div className="relative flex items-center 
                                            justify-between group/item">
                                                <div className="flex items-center gap-3 
                                                text-stone-400 group-hover:text-[#C9A227] 
                                                transition-colors">
                                                    <div className="absolute -left-6 top-1/2 w-5 
                                                    h-px bg-[#2A1E22]"/>
                                                    <FileText size={14}/>
                                                    <span className="text-xs">
                                                        {mode === 'private'
                                                        ? 'Introduction.md'
                                                        : 'Executive_Summary.md'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* 2. Generated PDF Folder */}
                                    {(isExtracting || hasExtracted) && (
                                        <div className={`relative ml-4 p-3 rounded-xl 
                                            transition-all duration-700 border animate-in 
                                            fade-in slide-in-from-left-4
                                            ${activeFolder === 'extracted' 
                                                ? 'bg-[#160F12] border-[#C9A227]/40 scale-105 shadow-[0_10px_30px_-5px_rgba(201,162,39,0.2)] z-20' 
                                                : 'border-transparent opacity-50'}`}>
                                            <div className="absolute -left-[30px] top-1/2 w-5 h-px 
                                            bg-[#2A1E22]"/>
                                            <div className="flex items-center gap-3 text-[#F5F0EB]">
                                                <Folder size={18} className="text-[#C9A227]"/>
                                                <span className="text-sm font-bold">
                                                    {mode === 'private'
                                                    ? 'Methodology_Extraction'
                                                    : 'Methodology_Visualized'
                                                    }
                                                </span>
                                                {activeFolder === 'extracted' && 
                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full 
                                                    bg-[#C9A227] animate-pulse"/>}
                                            </div>
                                            
                                            {isExtracting && (
                                                <div className="h-1 w-full bg-[#2A1E22] rounded-full 
                                                mt-4 overflow-hidden">
                                                    <div
                                                        style={{ width: `${(progress / 3) * 100}%`}}
                                                        className="h-full bg-[#C9A227] transition-all
                                                         duration-500 shadow-[0_0_10px_#C9A227]"
                                                    />
                                                </div>
                                            )}

                                            <div className="ml-10 mt-5 space-y-5 relative">
                                                <div className="absolute -left-6 -top-4 bottom-2 w-px 
                                                bg-[#2A1E22]"/>
                                                {progress >= 1 && (
                                                    <div className="relative flex items-center 
                                                    justify-between gap-4 animate-in fade-in 
                                                    slide-in-from-top-2">
                                                        <div className="flex items-center gap-3 
                                                        text-stone-400">
                                                            <div className="absolute -left-6 top-1/2 
                                                            w-5 h-px bg-[#2A1E22]"/>
                                                            <FileText size={14} className="flex-shrink-0"/>
                                                            <span className="text-xs text-stone-200">
                                                                {mode === 'private'
                                                                ? 'Abstract.md'
                                                                : 'Core_Experimental_Design.md'
                                                                }
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] bg-[#C9A227]/15 
                                                        text-[#C9A227] px-2 py-0.5 rounded font-bold
                                                         border border-[#C9A227]/30 uppercase">
                                                            Extracted
                                                        </span>
                                                    </div>
                                                )}
                                                {progress >= 2 && (
                                                    <div className="relative flex items-center 
                                                    justify-between gap-4 animate-in fade-in 
                                                    slide-in-from-top-2">
                                                        <div className="flex items-center gap-3 
                                                        text-stone-400">
                                                            <div className="absolute -left-6 top-1/2 
                                                            w-5 h-px bg-[#2A1E22]"/>
                                                            <FileText size={14} className="flex-shrink-0"/>
                                                            <span className="text-xs text-stone-200">
                                                                { mode === 'private'
                                                                ? 'Analysis_Nodes.ss'
                                                                : 'Synthesized_Protocol_Nodes.ss'
                                                                }
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] bg-[#C9A227]/15 
                                                        text-[#C9A227] px-2 py-0.5 rounded font-bold
                                                         border border-[#C9A227]/30 uppercase tracking-tighter">Decomposed</span>
                                                    </div>
                                                )}
                                                {progress >= 3 && (
                                                    <div className="relative flex items-center 
                                                    justify-between gap-4 animate-in fade-in 
                                                    slide-in-from-top-2">
                                                        <div className="flex items-center gap-3 
                                                        text-stone-400">
                                                            <div className="absolute -left-6 top-1/2 
                                                            w-5 h-px bg-[#2A1E22]"/>
                                                            <FileText size={14} className="flex-shrink-0"/>
                                                            <span className="text-xs text-stone-200">
                                                                { mode === 'private'
                                                                ? 'Reference.md'
                                                                : 'Academic_Citations_Graph.md'
                                                                }
                                                            </span>
                                                        </div>
                                                        <ChevronRight size={14} className="text-[#C9A227]"/>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Status Footer */}
                            <div className="mt-12 pt-5 flex border-t border-[#2A1E22] items-center 
                            justify-between text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse 
                                        ${mode === 'private' ? 'bg-[#C9A227]' : 'bg-purple-500'}`}/>
                                    <span>Sync: {mode === 'private' ? 'Local-only' : 'Cloud_Realtime'}</span>
                                </div>
                                <span className={mode === 'private' ? 'text-[#C9A227]' : 'text-purple-400/60'}>
                                    {mode === 'private' ? 'Encrypted' : 'Live'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes ghost-pointer {
                    0% { transform: translate(15px, 15px); opacity: 0; }
                    20% { transform: translate(0, 0); opacity: 1; }
                    40% { transform: scale(0.8); }
                    50% { transform: scale(1.1); }
                    80% { opacity: 1; }
                    100% { transform: translate(-10px, -10px); opacity: 0; }
                }
                .animate-ghost {
                    animation: ghost-pointer 3s ease-in-out infinite;
                    backface-visibility: hidden;
                    perspective: 3000;
                }
            `}</style>
        </section>
    );
};
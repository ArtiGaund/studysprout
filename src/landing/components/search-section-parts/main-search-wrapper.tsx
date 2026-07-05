'use client';

import React, { useEffect, useRef, useState } from "react";
import { 
    ArrowDown, 
    ArrowUp, 
    Building2, 
    CornerDownLeft, 
    Database, 
    FileText, 
    FolderClosed,  
    Search,  
    X, 
} from "lucide-react";

// A result can either be owned by the visitor or merely shared with them.
// This distinction drives the "Cross-Workspace Search" highlight on the parent section. 
type Role = "Owner" | "Member";

interface WorkspaceResult{
    name: string;
    role: Role;
    itemCount: number;
};

interface FolderResult{
    name: string;
    breadcrumb: string; //human-readable path shown under the folder name
    workspace: string; // which workspace this folder lives in
    role: Role;
};

interface FileResult{
    name: string;
    snippet: string; //matched excerpt shown under the filename
    breadcrumb: string;
    workspace: string; //NOTE: for files this is something a "type" like "PDF"/"NOTE" rather
                        // then a real workspace name 
    role: Role;
};

/** MOCK DATA
 * 
 * This is all fake/demo data for the landing page. It exists purely so the interaction search
 * playground has something realistic to filter through - none of this touches a real backend.
 */

const WORKSPACES: WorkspaceResult[] = [
    {
        name: "Collaboration",
        role: "Owner",
        itemCount: 12,
    },
    {
        name: "Personal Vault",
        role: "Owner",
        itemCount: 34,
    },
    {
        name: "Biology Study Group",
        role: "Member",
        itemCount: 8,
    },
];

const FOLDER_DATA: FolderResult[] = [
    { 
        name: "Neural Network Machanics",
        breadcrumb: "Collaboration",
        workspace: "Collaboration",
        role: "Owner",
    },
    {
        name: "Midterm Prep / Biology",
        breadcrumb: "Collaboration > Courses",
        workspace: "Collaboration",
        role: "Member",
    },
];

const FILE_DATA: FileResult[] = [
    {
        name: "Backpropogation",
        snippet: "...s computationally tractable. For modern neural networks, it can make training with gradient descent as mu...",
        breadcrumb: "Collaboration > Neural Network Mechanics",
        workspace: "Collaboration",
        role: "Owner",
    },
    {
        name: "Gradient Descent",
        snippet: "...well, making them suitable for massive neural networks and huge datasets. Generality: you can apply grad...",
        breadcrumb: "Collaboration > Neural Network Mechanics",
        workspace: "Collaboration",
        role: "Owner",
    },
    {
        name: "Midterm_Cheatsheet.pdf",
        snippet: "Matched \"midterm\" in 3 headers...",
        breadcrumb: "Collaboration > Midterm Prep",
        workspace: "PDF",
        role: "Member",
    },
    {
        name: "Cell_Division_Notes.md",
        snippet: "Last edited yesterday by You",
        breadcrumb: "Collaboration > Midterm Prep",
        workspace: "NOTE",
        role: "Member",
    },
    {
        name: "Recall_Rate_Analysis.docx",
        snippet: "...tracks recall rate improvements across weekly quiz cycles for each concepts...",
        breadcrumb: "Personal Vault > Analytics",
        workspace: "Personal Vault",
        role: "Owner",
    } ,
];

// Which section of results is currently focused through the tab strip
type Tab = "all" | "workspace" | "folder" | "file";

// Discriminated union representing the three states the results body can be in:
// - nothing typed yet
// - typed something but nothing matched
// - typed something and got hits (broke down by category)
type SearchResult =
    | { kind: "empty" }
    | { kind: "no-results" }
    | { 
        kind: "results";
        workspaces: WorkspaceResult[];
        folders: FolderResult[];
        files: FileResult[];
      };

// Pure filter function - does a simple case-insensitive substring match against 
// name(workspaces/folders) or name+snippet (files). Mirrors the shape of what a real search 
// endpoint would return so the rendering logic below doesn't care whether the data is mocked 
// or real.
const getSearchResult = (raw: string): SearchResult => {
    const q = raw.trim();
    if(q.length === 0) return { kind: "empty" };

    const lower = q.toLowerCase();
    const workspaces = WORKSPACES.filter((w) => w.name.toLowerCase().includes(lower));
    const folders = FOLDER_DATA.filter((f) => f.name.toLowerCase().includes(lower));
    const files = FILE_DATA.filter(
        (f) => f.name.toLowerCase().includes(lower) || f.snippet.toLowerCase().includes(lower)
    );
    if( workspaces.length === 0 && folders.length === 0 && files.length === 0) 
        return { kind: "no-results" };
    return {
        kind: "results",
        workspaces,
        folders,
        files,
    };
};

// Small pill shown next to folder/file rows indicating which workspace (or file type, for files) 
// the result belongs to.
const WorkspaceTag: React.FC<{ workspace: string }> = ({ workspace }) => (
    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10
    text-gray-400 shrink-0">
        {workspace}
    </span>
);

// Wraps the first occurrence of `query` inside `text` in a <mark>, so the result list visually 
// echoes what the user typed (same green highlight used across the real app's search UI). 
// Only highlights the FIRST match per call-site usage, but the while-loop below actually 
// highlights every occurrance found - kept generic in case it's reused where multiple hits matched
const Highlight: React.FC<{
    text: string;
    query: string;
}> = ({ text, query }) => {
    if(!query) return <>{text}</>;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    let idx = lowerText.indexOf(lowerQuery, cursor);

    while(idx !== -1) {
        if(idx > cursor) parts.push(text.slice(cursor, idx));
        parts.push(
            <mark key={idx} className="bg-[#63FF9D]/25 text-[#63FF9D] rounded-sm px-0.5">
                {text.slice(idx, idx + query.length)}
            </mark>
        );
        cursor = idx + query.length;
        idx = lowerText.indexOf(lowerQuery, cursor);
    }
    if(cursor < text.length) parts.push(text.slice(cursor));

    return <>{parts}</>;
}

// Queries the auto-play "demo" cycles through when the visitor hasn't clicked in.
const AUTO_QUERIES = [ "neural", "midterm", "recall"];
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface MainSearchWrapperProps{
    // Lets the parent (SearchSection) know when a live results includes a "Member" (shared, 
    // not owned) item, so it can light up the Cross-workspace search capability card in the 
    // left rail.
    onCrossWorkspaceChange?: (active: boolean) => void;
}

export const MainSearchWrapper: React.FC<MainSearchWrapperProps> = ({ 
    onCrossWorkspaceChange 
}) => {
    // The current text in the search input — driven either by the visitor typing,
    // or by the auto-play loop below when nobody has taken control yet.
    const [ typed, setTyped ] = useState("");

    // Whether the visitor has "taken control" of the demo (clicked into it).
    // While false, the auto-play effect drives `typed`. Once true, auto-play
    // pauses and the real <input> becomes editable.
    const [ interactive, setInteractive ] = useState(false);

    // Which result-type tab (All/Workspace/Folder/File) is currently selected.
    const [ activeTab, setActiveTab ] = useState<Tab>("all");

    // Increments every time the auto-play loop finishes a type+delete cycle,
    // used purely to pick the next query out of AUTO_QUERIES.
    const [ autoCycle, setAutoCycle ] = useState(0);
   
    // wrapperRef: used to detect "click outside" to release control back to auto-play.
    // inputRef: used to auto-focus the real <input> the instant the visitor takes control.
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const activate = () => setInteractive(true);

    // Resets everything back to the pristine auto-play state: control released,
    // text cleared, tab reset to "all".
    const deactivate = () => {
        setInteractive(false);
        setTyped("");
        setActiveTab("all");
    };

    // The moment the visitor takes control (clicks anywhere in the card — a tab,
    // a row, the backdrop), immediately focus the real <input> so they can start
    // typing without an extra click.
    useEffect(() => {
        if(interactive) inputRef.current?.focus();
    },[interactive]);

    
    // Clicking (or pressing Escape) anywhere OUTSIDE this component hands control
    // back to the auto-playing demo. Listens on `document` rather than the wrapper
    // itself, since we specifically need to know about clicks that land elsewhere.
    useEffect(() => {
        if(!interactive) return;
        const onDown = (e: MouseEvent) => {
            if(wrapperRef.current && !wrapperRef.current.contains(e.target as Node)){
                deactivate();
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if(e.key === "Escape") deactivate();
        }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        }
    },[interactive]);

    // Auto-play loop: only runs while the visitor hasn't taken control.
    // For the current query in AUTO_QUERIES:
    //   1. types it out one character at a time (70ms per keystroke)
    //   2. holds for 2.6s so a visitor can read the results
    //   3. deletes it one character at a time (30ms per keystroke, faster than typing)
    //   4. waits 250ms, then advances autoCycle to move to the next query
    // The `alive` flag guards against state updates firing after the effect has
    // been cleaned up (e.g. if `interactive` flips true mid-animation).
    useEffect(() => {
        if(interactive) return;
        let alive = true;

        const run = async () => {
            const query = AUTO_QUERIES[autoCycle % AUTO_QUERIES.length];

            for(let i = 1; i <=query.length; i++){
                if(!alive) return;
                setTyped(query.slice(0, i));
                await delay(70);
            }
            if(!alive) return;
            await delay(2600);

            for(let i = query.length; i >= 0; i--){
                if(!alive) return;
                setTyped(query.slice(0, i));
                await delay(30);
            }
            if(!alive) return;
            await delay(250);
            setAutoCycle((prev) => prev + 1);
        };
        run();
        return () => { alive = false; };
    },[
        interactive,
        autoCycle,
    ]);

    // Re-derive the result set every render from whatever `typed` currently is —
    // cheap enough given the tiny mock dataset, so no memoization needed.
    const result = getSearchResult(typed);
    const workspaces = result.kind === "results" ? result.workspaces : [];
    const folders = result.kind === "results" ? result.folders : [];
    const files = result.kind === "results" ? result.files : [];
    
    // True whenever the CURRENT result set includes at least one item the
    // visitor only has "Member" (shared) access to, not "Owner". Drives the
    // Cross-Workspace Search card highlight in the parent SearchSection.
    const hasCrossWorkspaceMatch = 
        workspaces.some((w) => w.role === "Member") ||
        folders.some((f) => f.role === "Member") ||
        files.some((f) => f.role === "Member");

    // Bubble the cross-workspace flag up to the parent every time it changes.
    useEffect(() => {
        onCrossWorkspaceChange?.(hasCrossWorkspaceMatch);
    },[
        onCrossWorkspaceChange,
        hasCrossWorkspaceMatch,
    ]);

    // On unmount, make sure we tell the parent to turn the highlight back off —
    // otherwise if this component disappears (e.g. swapped for CollapsedPreview
    // on resize) while a match was active, the card would stay lit forever.
    useEffect(() => {
        return () => onCrossWorkspaceChange?.(false);
    },[]);

    // Counts shown as small numbers next to each tab label.
    const counts = {
        all: workspaces.length + folders.length + files.length,
        workspace: workspaces.length,
        folder: folders.length,
        file: files.length,
    };

    // Which arrays actually get rendered in the body depends on the active tab —
    // "all" shows everything, otherwise only the matching category is shown.
    const showWorkspaces = activeTab === "all" || activeTab === "workspace" ? workspaces : [];
    const showFolders = activeTab === "all" || activeTab === "folder" ? folders : [];
    const showFiles = activeTab === "all" || activeTab === "file" ? files : [];

    // The very first result across all visible categories — used to apply the
    // "selected/highlighted" row style and show the ↵ (open) icon, mimicking a
    // real command palette's default-selected-first-result behavior.
    const firstResultKey = showWorkspaces[0]?.name ?? showFolders[0]?.name ?? showFiles[0]?.name;

    return(
        <div 
            ref={wrapperRef}
            onMouseDown={activate}
            className="relative flex w-full rounded-2xl border border-white/10
            bg-[#070B0A] shadow-2xl overflow-hidden min-h-[560px] items-center justify-center
            p-4 sm:p-8 cursor-text"
        >
            {/* Decorative, non-interactive "fake dashboard" background — only shown
                on lg+ screens, blurred and dimmed, purely to suggest there's a real
               app behind the search overlay. Never receives clicks (pointer-events-none). */}
            <div className="hidden lg:block absolute inset-0 opacity-[0.35] pointer-events-none
            blur-[1px] select-none">
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
                    <span className="text-xs text-gray-500">📁 Collaboration</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#63FF9D]/10
                     text-[#63FF9D] font-bold uppercase tracking-widest">
                        Saved
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-4 px-8 pt-6">
                    {["Reading Time", "Concepts Mastered", "Recall Rate"].map((label) => (
                        <div key={label}
                            className="p-4 rounded-xl border border-white/5 bg-white/[0.02]
                            space-y-2"
                        >
                            <span className="text-[9px] text-gray-600 uppercase tracking-widest">
                                {label}
                            </span>
                            <div className="h-4 w-1/2 bg-white/10 rounded"/>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating pill above the modal that tells the visitor whether they're
                watching the auto-play demo or driving it themselves. Bounces to draw
               attention while in demo mode; goes still once interactive. */}
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5
                rounded-full text-[9px] font-black uppercase tracking-widest border
                transition-all z-10 text-center max-w-[92%] ${interactive
                    ? "bg-white/5 border-white/10 text-gray-400"
                    : "bg-violet-400/10 border-violet-400/20 text-violet-400 animate-bounce"
                }
            `}>
                {interactive 
                    ? "Click outside to resume demo"
                    : "Click the search bar to take control"
                }
            </div>

            {/* The Search modal itself — everything below this point is the actual
                fake command palette UI (input, tabs, results, footer). */}
            <div className="relative z-[1] w-full max-w-xl rounded-2xl border border-white/10
            bg-[#0d1210]/95 backdrop-blur-2xl shadow-2xl overflow-hidden mt-10">

                {/* Input row: search icon, either a live editable <input> (interactive
                    mode) or a static "fake caret" text display (auto-play mode) so the
                   demo text can't accidentally be edited by the user, plus a close (X)
                   button that always deactivates regardless of mode. */}
                <div className="flex items-center gap-3 px-5 py-4">
                    <Search size={16} className="text-gray-500 shrink-0"/>
                    {interactive ? (
                        <input 
                            ref={inputRef}
                            value={typed}
                            onChange={(e) => {
                                setTyped(e.target.value);
                                setActiveTab("all");
                            }}
                            onKeyDown={(e) => {
                                if(e.key === "Escape"){
                                    deactivate();
                                }
                            }}
                            placeholder="Search files, folders, workspace, content..."
                            className="flex-1 bg-transparent text-white text-sm font-medium
                            placeholder:text-gray-600 outline-none min-w-0"
                        />
                    ) : (
                        <div className="flex-1 text-sm font-medium min-w-0 truncate">
                            {typed 
                                ? <span className="text-white">{typed}</span>
                                : <span className="text-gray-600">Search files, folders, workspace, content...</span>
                            }
                            <span className="inline-block w-[2px] h-4 bg-[#63FF9D] ml-0.5
                            align-middle animate-pulse"/>
                        </div>
                    )}

                    <button
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            deactivate();
                        }}
                        className="shrink-0 text-gray-600 hover:text-white transition-colors"
                        aria-label="Close search"
                    >
                        <X size={16}/>
                    </button>
                </div>

                 {/* Tab strip: All / Workspace / Folder / File. Clicking a tab both
                       activates the component (in case it was still auto-playing) and
                       switches the filter. Count badges only render once we actually
                       have a `results` state and the count is non-zero. */}
                <div className="flex items-center gap-1 px-5 pb-3 border-b border-white/5">
                    {([
                        ["all", "All"],
                        ["workspace", "Workspace"],
                        ["folder", "Folder"],
                        ["file", "File"],
                    ] as [ Tab, string][]).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={(e) => {
                                e.stopPropagation();
                                activate();
                                setActiveTab(key);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold
                                transition-colors ${activeTab === key
                                    ? "bg-[#63FF9D]/15 text-[#63FF9D]"
                                    : "text-gray-500 hover:text-white"
                                }`}
                        >
                            {label}
                            {result.kind === "results" && counts[key] > 0 && (
                                <span className="ml-1 opacity-70">{counts[key]}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Results body — scrolls internally if content exceeds 320px so the
                       modal's overall height stays fixed regardless of result count. */}
                <div className="max-h-[320px] overflow-y-auto px-3 py-3">

                     {/* Nothing typed yet: show the generic empty state, plus (only when
                           interactive) quick-pick buttons for the demo queries so the visitor
                           has an easy way to see real results without guessing what to type. */}
                    {result.kind === "empty" && (
                        <div className="flex flex-col items-center justify-center gap-3
                        py-16 text-center">
                            <Search size={20} className="text-gray-700"/>
                            <p className="text-xs text-gray-400 font-medium">
                                Search across all your workspaces
                            </p>
                            <p className="text-[11px] text-gray-600">
                                Finds files by title and content inside them.
                            </p>

                            {interactive && (
                                <div className="flex flex-col items-center gap-2 pt-3">
                                    <span className="text-[9px] text-gray-600 font-bold
                                    uppercase tracking-widest">
                                        Try one of these
                                    </span>
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        {AUTO_QUERIES.map((q) => (
                                            <button key={q}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTyped(q);
                                                    setActiveTab("all");
                                                }}
                                                className="px-2.5 py-1 rounded-full border
                                                border-white/10 bg-white/5 text-[11px]
                                                font-mono text-gray-300 hover:text-white 
                                                hover:border-[#63FF9D]/40 transition-colors"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Typed something, but it matched nothing in the mock dataset —
                           same quick-pick buttons here too, so the visitor always has an
                           easy path back to a working query. */}
                    {result.kind === "no-results" && (
                        <div className="flex flex-col items-center justify-center gap-3
                        py-16 text-center">
                            <p className="text-xs text-gray-400 font-medium">
                                No matches for &ldquo;{typed}&rdquo;
                            </p>
                            <p className="text-[11px] text-gray-600">
                               Try a different term or keyword
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {AUTO_QUERIES.map((q) => (
                                    <button key={q}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTyped(q);
                                            setActiveTab("all");
                                        }}
                                        className="px-2.5 py-1 rounded-full border
                                        border-white/10 bg-white/5 text-[11px]
                                        font-mono text-gray-300 hover:text-white 
                                        hover:border-[#63FF9D]/40 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.kind === "results" && (
                        <div className="space-y-4">
                            {showWorkspaces.length > 0 && (
                                <div className="space-y-1">
                                    <p className="px-2 pb-1 text-[10px] text-gray-600
                                    font-bold uppercase tracking-widest">
                                        Workspaces ({showWorkspaces.length})
                                    </p>
                                    {showWorkspaces.map((w) => (
                                        <div key={w.name}
                                            className={`flex items-center justify-between px-3 \
                                                py-2.5 rounded-lg transition-colors
                                                ${w.name === firstResultKey
                                                    ? "bg-[#63FF9D]/10"
                                                    : "hover:bg-white/[0.03]"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Building2 size={15}
                                                    className="text-violet-400 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-white
                                                    font-medium truncate">
                                                        <Highlight text={w.name} query={typed}/>
                                                    </p>
                                                    <p className="text-[10px] text-gray-600
                                                    truncate">
                                                        {w.itemCount}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {w.name === firstResultKey && (
                                                    <CornerDownLeft size={12} 
                                                    className="text-[#63FF9D]"/>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showFolders.length > 0 && (
                                <div className="space-y-1">
                                    <p className="px-2 pb-1 text-[10px] text-gray-600
                                    font-bold uppercase tracking-widest">
                                        Folders ({showFolders.length})
                                    </p>
                                    {showFolders.map((f) => (
                                        <div key={f.name}
                                            className={`flex items-center justify-between
                                                px-3 py-2.5 rounded-lg transition-colors
                                                ${f.name === firstResultKey
                                                    ? "bg-[#63FF9D]/10"
                                                    : "hover:bg-white/[0.03]"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FolderClosed 
                                                    size={15}
                                                    className="text-amber-400 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-white
                                                    font-medium truncate">
                                                        <Highlight text={f.name} query={typed}/>
                                                    </p>
                                                    <p className="text-[10px] text-gray-600
                                                    truncate">
                                                        {f.breadcrumb}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <WorkspaceTag workspace={f.workspace}/>
                                                {f.name === firstResultKey && (
                                                    <CornerDownLeft size={12} 
                                                    className="text-[#63FF9D]" />  
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showFiles.length > 0 && (
                                <div className="space-y-1">
                                    <p className="px-2 pb-1 text-[10px] text-gray-600
                                    font-bold uppercase tracking-widest">
                                        MAtching content ({showFiles.length})
                                    </p>
                                    {showFiles.map((f) => (
                                        <div key={f.name}
                                            className={`flex items-center justify-between
                                                px-3 py-2.5 rounded-lg transition-colors
                                                ${f.name === firstResultKey
                                                    ? "bg-[#63FF9D]/10"
                                                    : "hover:bg-white/[0.03]"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FileText size={15} 
                                                className="text-gray-500 shrink-0"/> 
                                                <div className="min-w-0">
                                                    <p className="text-xs text-white
                                                    font-medium truncate">
                                                        <Highlight text={f.name} query={typed}/>                                                                                                                            
                                                    </p>
                                                    <p className="text-[10px] text-gray-600
                                                    truncate">
                                                        <Highlight text={f.snippet} query={typed} />
                                                    </p>
                                                    <p className="text-[10px] text-gray-600
                                                    truncate">
                                                        {f.breadcrumb}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <WorkspaceTag workspace={f.workspace}/>
                                                {f.name === firstResultKey && (
                                                    <CornerDownLeft 
                                                        size={12}
                                                        className="text-[#63FF9D]"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[9px] text-gray-600 
                        font-bold">
                            <ArrowUp size={11}/><ArrowDown size={11}/> Navigate
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-gray-600
                        font-bold">
                            <CornerDownLeft size={11}/> Command
                            <span className="uppercase tracking-widest ml-0.5">Open</span>
                        </span>
                        <span className="text-[9px] text-gray-600 font-bold uppercase
                        tracking-widest">
                            Esc close
                        </span>
                    </div>
                    <span className="text-[9px] text-gray-600 font-medium">
                        {result.kind === "results" 
                            ? `${counts.all} results${counts.all === 1 ? "" : "s"}`
                            : ""
                        }
                    </span>
                </div>
            </div>       
        </div>
    );
};
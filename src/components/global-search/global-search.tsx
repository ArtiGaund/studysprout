"use client";

import { SearchResult } from "@/app/api/search/route";
import { FilterType, useGlobalSearch } from "@/hooks/useGlobalSearch";
import clsx from "clsx";
import { 
    AlertCircle, 
    AlignLeft, 
    Clock, 
    CornerDownLeft, 
    FileText, 
    FolderOpen, 
    LayoutDashboard, 
    Loader2, 
    Trash2, 
    X 
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CypressSearchIcon from "../icons/CypressSearchIcon";
import { Dialog, DialogContent } from "../ui/dialog";

// --- Props ---
interface GlobalSearchProps{
    onNavigateToWorkspace: (workspaceId: string) => void;
    onNavigateToFolder: (workspaceId: string, folderId: string) => void;
    onNavigateToFile: (workspaceId: string, folderId: string, fileId: string) => void; 
}

// --- Filter tabs ---
const TABS: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Workspace", value: "workspace" },
    { label: "Folder", value: "folder" },
    { label: "File", value: "file" },
];

// --- Type icon ---
function ItemIcon({ result}: { result: SearchResult }){
    if(result.iconId){
        return(
            <span className="text-base leading-none shrink-0">
                {result.iconId}
            </span>
        );
    }

    const cls = "w-4 h-4 shrink-0";
    if(result.type === "workspace") 
        return <LayoutDashboard className={clsx(cls, "text-violet-400")}/>;
    if(result.type === "folder")
        return <FolderOpen className={clsx(cls, "text-yellow-400")}/>;
    if(result.matchedInContent)
        return <AlignLeft className={clsx(cls, "text-blue-400")}/>;
    return <FileText className={clsx(cls, "text-zinc-400")}/>
}

// --- Highlight matching icon ---
function Highlighted({ text, query }: { text: string; query: string; }){
    if(!query.trim()) return <>{text}</>;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return (
        <>
            {parts.map((part, i) => 
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-primary/25 text-foreground rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

// --- Single result ---
function ResultRow({
    result,
    query,
    active,
    onSelect,
}: {
    result: SearchResult;
    query: string;
    active: boolean;
    onSelect: (r: SearchResult) => void;
}){
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if(active) ref.current?.scrollIntoView({ block: "nearest"});
    },[active]);

    const breadcrumb = 
        result.type === "file" && result.folderTitle
            ? `${result.workspaceTitle} › ${result.folderTitle}`
            : result.type === "folder"
                ? result.workspaceTitle
                : null;
    return (
        <button
            ref={ref}
            onClick={() => onSelect(result)}
            className={clsx(
                "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left",
                "transition-colors duration-75",
                active 
                    ? "bg-primary/15 text-foreground ring-1 ring-primary/20"
                    : "text-zinc-300 hover:text-zinc-800/60"
            )}
        >
            <div className="mt-0.5 shrink-0">
                <ItemIcon result={result}/>
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
                {/* Title with highlight */}
                <p className="text-sm font-medium leading-tight truncate">
                    <Highlighted text={result.title} query={query}/>
                </p>

                {/* Content snippet for content-matched files */}
                {result.snippet && (
                    <p className="text-xs text-zinc-400 leading-snug line-clamp-2">
                        <Highlighted text={result.snippet} query={query}/>
                    </p>
                )}

                {/* Breadcrumb */}
                {breadcrumb && (
                    <p className="text-xs text-zinc-600 truncate">
                        {breadcrumb}
                    </p>
                )}
            </div>

            {/* Workspace badge */}
            {result.type !== "workspace" && (
                <span className="hidden xs:inline-block shrink-0 self-center text-[10px]
              text-zinc-500 bg-zinc-800 rounded px-1.5 py-0.5 max-w-[80px] sm:max-w-[100px] 
                truncate">
                    {result.workspaceTitle}
                </span>
            )}

            {active && (
                <CornerDownLeft className="hidden sm:block w-3 h-3 text-zinc-500 shrink-0 
                self-center"/>
            )}
        </button>
    );
}

// --- Section Label ---
function SectionLabel({ icon, label, count}: {
    icon: React.ReactNode;
    label: string;
    count: number;
}){
    return (
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 pt-3 pb-1">
            <span className="text-zinc-600">{icon}</span>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                {label}
            </p>
            <span className="text-[10px] text-zinc-600">({count})</span>
        </div>
    );
}

// --- Loading Skeleton ----
function Skeleton(){
    return(
        <div className="space-y-1 p-1">
            {[65, 80, 55, 72, 48].map((w, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg animate-pulse"
                >   
                    <div className="w-4 h-4 bg-zinc-800 rounded shrink-0"/>
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-zinc-800 rounded" style={{ width: `{w}%`}}/>
                        <div className="h-2.5 bg-zinc-800/60 rounded w-1/3"/>
                    </div>
                    <div className="hidden xs:block w-14 h-4 bg-zinc-800 rounded"/>
                </div>
            ))}
        </div>
    );
}

export function GlobalSearch({
    onNavigateToWorkspace,
    onNavigateToFolder,
    onNavigateToFile,
}: GlobalSearchProps){
    const {
        open, setOpen,
        query, setQuery,
        filter, setFilter,
        results,
        recentItems,
        loading,
        error,
        hasQuery,
        onSelect: hookOnSelect,
        clearRecent,
    } = useGlobalSearch();

    const inputRef = useRef<HTMLInputElement>(null);
    const [ activeIndex, setActiveIndex ] = useState(0);
    
    // Flat list for keyboard navigation
    const flatItem = useMemo<SearchResult[]>(() => {
        if(!hasQuery) return recentItems;
        return [
            ...results.workspaces,
            ...results.folders,
            ...results.titleFiles,
            ...results.contentFiles,
        ];
    },[
        hasQuery,
        results,
        recentItems,
    ]);

    useEffect(() => {
        setActiveIndex(0);
    },[
        query,
        filter,
        open,
    ]);

    // Navigate to selected item
    const navigate = useCallback((result: SearchResult) => {
        hookOnSelect(result);
        if(result.type === "workspace"){
            onNavigateToWorkspace(result.workspaceId);
        }else if(result.type === "folder"){
            onNavigateToFolder(result.workspaceId, result._id);
        }else {
            onNavigateToFile(result.workspaceId, result.folderId!, result._id);
        }
    },[
        hookOnSelect,
        onNavigateToWorkspace,
        onNavigateToFolder,
        onNavigateToFile,
    ]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if(e.key === "ArrowDown"){
            e.preventDefault();
            setActiveIndex((i) => Math.min(i+1, flatItem.length - 1));
        }else if(e.key === "ArrowUp"){
            e.preventDefault();
            setActiveIndex((i) => Math.max(i-1, 0));
        }else if(e.key === "Enter"){
            e.preventDefault();
            const item = flatItem[activeIndex];
            if(item) navigate(item);
        }
    };

    useEffect(() => {
        if(open){
            setTimeout(() => inputRef.current?.focus(), 60);
        }
    },[ open ]);

    const showRecent = !hasQuery && recentItems.length > 0;
    const showEmpty = 
        hasQuery && !loading && !error &&
        results.workspaces.length === 0 &&
        results.folders.length === 0 &&
        results.titleFiles.length === 0 &&
        results.contentFiles.length === 0;

    // Count for active filter tab badge
    const tabCount = (tab: FilterType) => {
        if(!hasQuery) return 0;
        if(tab === "all") return results.total;
        if(tab === "workspace") return results.workspaces.length;
        if(tab === "folder") return results.folders.length;
        return results.titleFiles.length + results.contentFiles.length;
    };

    return (
        <>
            {/* Sidebar trigger */}
            <button
                onClick={() => setOpen(true)}
                className={clsx(
                    // "group w-full flex items-center gap-2.5 px-3 py-2 rounded-md",
                    // "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60",
                    // "transition-colors text-sm",
                    "group/native w-full flex items-center gap-2 text-Neutrals/neutrals-7 transition-all"
                )}
                aria-label="Search everywhere (Cmd+k)"
            >
                <CypressSearchIcon />
                <span>Search</span>
                <kbd className="ml-auto hidden sm:flex items-center gap-0.5 text-[10px] text-zinc-600
                font-mono group-hover:text-zinc-400 transition-colors">
                    <span>⌘</span><span>K</span>
                </kbd>
            </button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className={clsx(
                        "grid-none flex flex-col gap-0 p-0",
                        "bg-zinc-900 border-zinc-700 shadow-2xl overflow-hidden",
                        "top-[5vh] sm:top-[50%] translate-y-0 sm:translate-y-[-50%]",
                        "z-[200]",
                        "left-[50%] -translate-x-[50%]",
                        "w-[calc(100vw-1rem)]",
                        "sm:w-[calc(100vw-3rem)] sm:max-w-[560px]",
                        "lg:max-w-[640px]",
                        "max-h-[calc(100svh-7vh)] sm:max-h-[min(580px,calc(100svh-6rem))]",
                        "rounded-xl",
                    )}
                >
                    {/* Input */}
                    <div className="flex items-center gap-2.5 sm:gap-3 pl-3 sm:pl-4 pr-9 py-3
                    sm:py-3.5 border-b border-zinc-800 shrink-0">
                        {loading 
                            ? <Loader2  className="w-4 h-4 text-zinc-500 shrink-0 animate-spin"/>
                            : <CypressSearchIcon />
                        }
                        <input 
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search files, folders, workspace, content..."
                            className="flex-1 bg-transparent text-sm text-foreground
                            placeholder:text-zinc-500 outline-none"
                            autoComplete="off"
                            spellCheck={false}
                            inputMode="search"
                            enterKeyHint="search"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="text-zinc-500 hover:text-zinc-300 
                                transition-colors shrink-0"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        )}
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1 px-2 sm:px-3 py-2 border-b
                     border-zinc-800 shrink-0 flex-wrap">
                        {TABS.map((tab) => {
                            const count = tabCount(tab.value);
                            return(
                                <button
                                    key={tab.value}
                                    onClick={() => setFilter(tab.value)}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs",
                                        "font-medium whitespace-nowrap transition-colors",
                                        filter === tab.value
                                            ? "bg-primary/20 text-primary"
                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
                                    )}
                                >
                                    {tab.label}
                                    {hasQuery && count > 0 && (
                                        <span className="text-[10px] opacity-60">{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Results */}
                    <div className="flex-1 overflow-y-hidden p-2 scrollbar-thin scrollbar-thumb-zinc-700">

                        {/* Loading */}
                        {loading && <Skeleton />}

                        {/* Error */}
                        {!loading && error && (
                            <div className="flex items-center gap-2 px-3 py-4 text-sm text-red-400">
                                <AlertCircle className="w-4 h-4 shrink-0"/>
                                {error}
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && showEmpty && (
                            <div className="py-10 sm:py-12 text-center space-y-1.5 px-4">
                                <CypressSearchIcon />
                                <p className="text-sm text-zinc-400 break-words">
                                    No results for{" "}
                                    <span className="font-semibold text-zinc-200">{query}</span>
                                </p>
                                <p className="text-xs text-zinc-600">
                                    Try different words - titles and file content are both searched.
                                </p>
                            </div>
                        )}

                        {/* Idle state */}
                        {!hasQuery && !showRecent && (
                            <div className="py-10 sm:py-12 text-center space-y-1.5 px-4">
                                <CypressSearchIcon />
                                <p className="text-xs text-zinc-500">
                                    Search across all your workspace
                                </p>    
                                <p className="text-xs text-zinc-400">
                                    Finds files by title and by content inside them
                                </p>
                            </div>
                        )}

                        {/* Recent */}
                        {!loading && showRecent && (
                            <>
                                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                                    <p className="text-[10px] font-semibold text-zinc-500
                                    uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock className="w-3 h-3"/> Recent
                                    </p>
                                    <button
                                        onClick={clearRecent}
                                        className="flex items-center gap-1 text-[10px] text-zinc-600
                                        hover:text-zinc-400"
                                    >
                                        <Trash2 className="w-3 h-3"/> Clear
                                    </button>
                                </div>
                                {recentItems.map((item, idx) => (
                                    <ResultRow 
                                        key={item._id}
                                        result={item}
                                        query=""
                                        active={idx === activeIndex}
                                        onSelect={navigate}
                                    />
                                ))}
                            </>
                        )}

                        {/* Results - grouped */}
                        {!loading && !error && hasQuery && (
                            <>
                                {results.workspaces.length > 0 && (
                                    <>
                                        <SectionLabel 
                                            icon={<LayoutDashboard className="w-3 h-3"/>}
                                            label="Workspaces"
                                            count={results.workspaces.length}
                                        />
                                        {results.workspaces.map((r) => (
                                            <ResultRow 
                                                key={r._id}
                                                result={r}
                                                query={query}
                                                active={flatItem.indexOf(r) === activeIndex}
                                                onSelect={navigate}
                                            />
                                        ))}
                                    </>
                                )}

                                {results.folders.length > 0 && (
                                    <>
                                        <SectionLabel 
                                            icon={<FolderOpen className="w-3 h-3"/>}
                                            label="Folders"
                                            count={results.folders.length}
                                        />
                                        {results.folders.map((r) => (
                                            <ResultRow 
                                                key={r._id}
                                                result={r}
                                                query={query}
                                                active={flatItem.indexOf(r) === activeIndex}
                                                onSelect={navigate}
                                            />
                                        ))}
                                    </>
                                )}

                                {results.titleFiles.length > 0 && (
                                    <>
                                        <SectionLabel 
                                            icon={<FileText className="w-3 h-3"/>}
                                            label="Files"
                                            count={results.titleFiles.length}
                                        />
                                        {results.titleFiles.map((r) => (
                                            <ResultRow 
                                                key={r._id}
                                                result={r}
                                                query={query}
                                                active={flatItem.indexOf(r) === activeIndex}
                                                onSelect={navigate}
                                            />
                                        ))}
                                    </>
                                )}

                                {results.contentFiles.length > 0 && (
                                    <>
                                        <SectionLabel 
                                            icon={<AlignLeft className="w-3 h-3"/>}
                                            label="Matching content"
                                            count={results.contentFiles.length}
                                        />
                                        {results.contentFiles.map((r) => (
                                            <ResultRow 
                                                key={r._id}
                                                result={r}
                                                query={query}
                                                active={flatItem.indexOf(r) === activeIndex}
                                                onSelect={navigate}
                                            />
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 border-t border-zinc-800 px-4 py-2 flex items-center
                    gap-3 sm:gap-4 overflow-x-auto">
                        <span className="hidden sm:flex items-center gap-1 text-[10px] 
                        text-zinc-600 shrink-0">
                            <kbd className="font-mono border border-zinc-700 rounded px-1">↑</kbd>
                            <kbd className="font-mono border border-zinc-700 rounded px-1">↓</kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-600
                        shrink-0">
                            <kbd className="font-mono border border-zinc-700 rounded px-1">↵</kbd>
                            open
                        </span>
                        <span className="hidden sm:flex items-center gap-1 text-[10px]
                         text-zinc-600 shrink-0">
                        <kbd className="font-mono border border-zinc-700 rounded px-1">esc</kbd>
                        close
                        </span>
                        {hasQuery && results.total > 0 && (
                        <span className="ml-auto text-[10px] text-zinc-600 shrink-0">
                            {results.total} result{results.total !== 1 ? "s" : ""}
                        </span>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
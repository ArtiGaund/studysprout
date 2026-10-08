'use client';

import { useFolder } from "@/hooks/useFolder";
import { useWorkspace } from "@/hooks/useWorkspace";
import { GitBranch, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

export interface LearningPathFileNode{
    id: string;
    title: string;
    prerequisites: string[];
    level: number;
    fileCount?: number;
}

interface Props{
    level: "folder" | "workspace";
    id: string;
}

export const LearningPathView = ({ level, id }: Props) => {
    const [ nodes, setNodes ] = useState<LearningPathFileNode[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);
    const [ hoveredId, setHoveredId ] = useState<string | null>(null);
    const [ hasFetched, setHasFetched ] = useState(false);

    const { getLearningPath } = useFolder();
    const { getWorkspaceLearningPath } = useWorkspace();

    // Level-aware labels
    const nodeLabel = level === "folder" ? "files" : "folders";
    const legendDependsLabel = level === "folder"
        ? "Depends on hovered file"
        : "Depends on hovered folder";

    useEffect(() => {
        if(!id || hasFetched) return;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                if(level === "folder"){
                    const result = await getLearningPath(id);
                    if(result.success && result.data){
                        setNodes(result.data);
                    }else{
                        setError(result?.error ?? "Failed to load learning path");
                    }
                }else{
                    const result = await getWorkspaceLearningPath(id);
                    if(result.success && result.data){
                        setNodes(result.data);
                    }else{
                        setError(result?.error ?? "Failed to load learning path");
                    }
                }
            } catch (error) {
                console.error("[Learning Path View] Failed to load learning path ", error);
                setError("Unexpected error");
            }finally{
                setLoading(false);
            }
        };
        setHasFetched(true);
        load();
    },[
        id,
        level,
        hasFetched,
    ]);

    if(loading){
        return(
            <div className="flex items-center justify-center h-64 gap-x-2 text-zinc-500 
            font-mono text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500"/>
                <span>
                    Building learning path...
                </span>
            </div>
        );
    };

    if(error){
        return(
            <div className="flex items-center justify-center h-64 font-mono">
                <p className="text-xs text-red-400">
                    {error}
                </p>
            </div>
        );
    };

    if(!nodes.length){
        return(
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 
            font-mono">
                <GitBranch className="w-8 h-8 mb-2 opacity-30"/>
                <p className="text-xs font-semibold text-zinc-400">
                    No prerequisite relationships found
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                   {level === "folder"
                        ? "Files appear to be independent - any reading order works"
                        : "Folders appear to be independent - any study order works"
                   }
                </p>
            </div>
        );
    };

    const maxLevel = Math.max(...nodes.map(n => n.level));
    const levels: LearningPathFileNode[][] = Array.from(
        { length: maxLevel + 1 }, 
        ( _, i) => nodes.filter(n => n.level === i )
    ).filter(levelNodes => levelNodes.length > 0); //filter out empty levels before rendering

    const connectedToHovered = hoveredId ? new Set([
        hoveredId,
        ...(nodes.find(n => n.id === hoveredId)?.prerequisites ?? []),
        ...nodes.filter(n => n.prerequisites.includes(hoveredId)).map(n => n.id),
    ]) : null;

    const HORIZONTAL_MAX_LEVEL = 5;
    const useVertical = maxLevel + 1 > HORIZONTAL_MAX_LEVEL;
    const displayMaxLevel = levels.length - 1;

    const renderCard = (node: LearningPathFileNode, compact = false) => {
        const isDimmed = connectedToHovered && !connectedToHovered.has(node.id);
        const isHovered = hoveredId === node.id;
        const isPreq = hoveredId
            ? (nodes.find(n => n.id === hoveredId)?.prerequisites ?? []).includes(node.id)
            : false;
        const isDependant = hoveredId
            ? node.prerequisites.includes(hoveredId)
            : false;

    return (
        <div
            key={node.id}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative px-4 py-2.5 rounded-xl border transition-all duration-200 
            cursor-default font-mono"
            style={{
                opacity: isDimmed ? 0.2 : 1,
                backgroundColor: isHovered ? "#1A0F18" : "#0A0507",
                borderColor: isHovered 
                    ? "#0A0507" 
                    : isPreq 
                        ? "#0A0507" 
                        : isDependant 
                            ? "#9333EA"
                            : "rgba(255,255,255,0.08)",
                }}
        >
            {isPreq && (
                <span className="absolute -top-2 left-2 text-[8px] bg-emerald-950 border
                 border-emerald-500/30
                 text-emerald-400 px-1.5 py-0.5 rounded font-bold tracking-wide uppercase">
                    READ FIRST    
                </span>
            )}
            {isDependant && (
                <span className="absolute -top-2 left-2 text-[8px] bg-purple-900 
                border border-purple-500/30 uppercase
                text-purple-300 px-1.5 py-0.5 rounded font-bold tracking-wide">
                    THEN READ
                </span>
            )}
            <p className="text-xs font-semibold text-zinc-200 leading-tight truncate">
                {node.title}
            </p>
            {node.prerequisites.length > 0 && (
                <p className="text-[10px] text-zinc-500 mt-1 text-center">
                    {node.prerequisites.length} prerequisites{node.prerequisites.length !== 1 
                        ? "s" : ""
                    }
                </p>
            )}
        </div>
    )}

    return (
       <div
            className="px-6 py-5 overflow-auto bg-[#0A0507] font-mono"
            style={{ maxHeight: 500}}
       >
            <div className="flex items-center gap-x-2 mb-5">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                    Study order
                </span>
                <div className="flex-1 h-px bg-white/10"/>
                <span className="text-[10px] text-zinc-500">
                    {nodes.length} {nodeLabel} · {maxLevel + 1} level{maxLevel !== 0 ? "s" : ""}
                </span>
            </div>

           {useVertical ? (
            <div 
                className="flex flex-col gap-y-4 overflow-auto pr-1"
                style={{ maxHeight: 420 }}
            >
               {levels.length > 0 && ( 
                    <div className="flex items-center gap-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                        <span className="text-[12px] text-zinc-400 uppercase tracking-widest 
                            font-bold">
                            Start here
                        </span>
                        <div className="flex-1 h-px bg-white/10"/>
                    </div>
                )}
                {levels.map((levelNode, levelIdx) => (
                    <div
                        key={levelIdx}
                        className="flex flex-col gap-y-2 items-center justify-center"
                    >
                        {/* Level Header */}
                        <div className="flex items-center gap-x-2">
                            <div className={`w-1.5 h-1.5 rounded-full 
                                ${levelIdx === displayMaxLevel 
                                    ? "bg-purple-500" 
                                    : "bg-blue-500"
                                }`}
                            />
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest
                            font-bold">
                                {
                                    levelIdx === displayMaxLevel && displayMaxLevel > 0 
                                        ? "Advanced"
                                        : `Step ${levelIdx + 1}`
                                }
                            </span>
                        </div>

                        {/* Files in this level - horizontal row */}
                        <div className="flex flex-wrap gap-x-2 gap-y-2 pl-4">
                            {levelNode.map(node => renderCard(node, false))}
                        </div>

                        {/* Downward arrow except last level */}
                        {levelIdx < displayMaxLevel && (
                            <div className="flex justify-center py-1">
                                <svg
                                    width="10"
                                    height="16"
                                    viewBox="0 0 10 16"
                                    fill="none"
                                >
                                    <path 
                                        d="M5 0V14M5 14L1 10M5 14L9 10"
                                        stroke="#3f3f46" 
                                        strokeWidth="1.5"
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
           ) : (
             <div className="relative flex flex-col items-stretch gap-x-0 gap-y-5 w-full">
                <div className="flex">
                    {levels.length > 0 && ( 
                        <div className="flex items-center gap-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                            <span className="text-[12px] text-zinc-400 uppercase 
                            tracking-widest font-bold">
                                Start here
                            </span>
                            <div className="flex-1 h-px bg-white/10"/>
                        </div>
                    )}
                </div>
                <div className="flex gap-x-3 overflow-x-auto pb-2">
                    {levels.map((levelNode, levelIdx) => (
                        <React.Fragment key={levelIdx}>
                            <div className="flex flex-col gap-y-3 flex-1 min-w-0">
                                {/* Level header */}
                                <div className="flex items-center gap-x-1.5 mb-1">
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 
                                        ${ levelIdx === displayMaxLevel && displayMaxLevel > 0 
                                            ? "bg-purple-500" : "bg-blue-500"
                                    }`}/>
                                    <span className="text-[9px] text-zinc-500 uppercase 
                                    tracking-widest font-bold">
                                        {levelIdx === displayMaxLevel && displayMaxLevel > 0
                                            ? "Advanced"
                                            : `Step ${levelIdx + 1}`
                                        }
                                    </span>
                                </div>

                                {levelNode.map(node => renderCard(node, true))}
                            </div>
                    
                            {/* Arrows between levels */}
                            {levelIdx < displayMaxLevel && (
                                <div
                                    className="flex flex-col flex-shrink-0 w-8 pt-7"
                                    style={{ paddingTop: "1.5rem"}}
                                >
                                {/* One arrow per card in this level to align with cards */}
                                    {levelNode.map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-center
                                             text-zinc-600"
                                            style={{ height: "52px"}}
                                        >
                                            <svg
                                                width="20"
                                                height="12"
                                                viewBox="0 0 20 12"
                                                fill="none"
                                            >
                                                <path 
                                                    d="M0 6H18M18 6L13 1M18 6L13 11"
                                                    stroke="#52525b" 
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        )}
          
        {/* Legend */}
        <div className="flex items-center gap-x-5 mt-6 pt-4 border-t border-white/10 
            text-[10px]">
            <div className="flex items-center gap-x-1.5">
                <div className="w-2 h-px bg-emerald-500 rounded-full"/>
                <span className="text-zinc-400">
                    Prerequisite (hover to see)
                </span>
            </div>
            <div className="flex items-center gap-x-1.5">
                <div className="w-2 h-px bg-purple-500 rounded-full"/>
                <span className="text-zinc-400">
                    {legendDependsLabel}
                </span>
            </div>
        </div>
    </div>
)};
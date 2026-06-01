'use client';

import { selectCurrentFolder } from "@/store/selectors/folderSelector";
import { Maximize2 } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { ConceptGraphModal } from "./concept-graph-modal";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";

export const RelationshipGraph = ({ level }: { level: "folder" | "workspace"}) => {
    const currentFolder = useSelector(selectCurrentFolder);
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const [ modalOpen, setModalOpen ] = useState(false);

    const conceptGraph = level === "folder"
        ? currentFolder?.conceptGraph
        : currentWorkspace?.conceptGraph;

     const title = level === "folder"
        ? (currentFolder?.title ?? "")
        : (currentWorkspace?.title ?? "");

    
    const hasGraph = (conceptGraph?.nodes?.length ?? 0) > 0;
    // Don't render the panel at all if no concept graph
    if(!hasGraph) return null;

    // Pick top 5 nodes of fileCount for the mini preview
    const topNodes = [ ...conceptGraph!.nodes]
        .sort((a, b) => b.fileCount - a.fileCount)
        .slice(0, 5);

    const topNodeIds = new Set(topNodes.map(n => n.id));
    const previewEdges = conceptGraph!.edges
        .filter(e => topNodeIds.has(e.target))
        .slice(0, 5);

    // Simply fixed position for mini preview ( no force layout needed)
    const positions: Record<number, { x: number; y: number }> ={
        0: { x: 50, y: 50 },
        1: { x: 20, y: 75 },
        2: { x: 80, y: 75 },
        3: { x: 30, y: 25 },
        4: { x: 70, y: 25 },
    };

    const nodePositions = new Map(
        topNodes.map((n, i) => [ n.id, positions[i] ?? { x: 50, y: 50 }])
    );

    // Collect unique file IDs from preview edges for file nodes
    const previewSourceIds = Array.from(new Set(
        previewEdges.map(e => e.source)
    )).slice(0,3);

    const sourcePositions: Record<number, { x: number; y: number }> = {
        0: { x: 10, y: 50 },
        1: { x: 50, y: 90 },
        2: { x: 90, y: 50 },
    };

    const sourcePosMap = new Map(
        previewSourceIds.map((id, i) => [ id, sourcePositions[i] ?? { x: 50, y: 50 }])
    );

    // Most connected term = active cluster label
    const activeCluster = topNodes[0]?.label ?? "";

    // Level-aware labels
    const nodeLabel = level === "folder" ? "concepts" : "folders";
    const edgeSourceLabel = level === "folder" ? "files" : "folders";
    const nodeColor = level === "folder" ? "#7c3aed" : "#0e7490";
    const nodeColorDim = level === "folder" ? "#5b21b6" : "#0c5e73";

    return(
        <>
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 flex flex-col gap-y-4">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
                    Relationship Graph
                </span>
                <Maximize2 
                size={14}
                onClick={() => setModalOpen(true)}
                className="text-zinc-600 cursor-pointer hover:text-white transition-colors"
                />
            </div>

            {/* Simulated Graph Area */}
            <div 
            className="relative h-32 w-full bg-[#0d0d0d] rounded-lg border border-white/5
            flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => setModalOpen(true)}
            >
                
                {/* Simulated Nodes and Connections */}
                <svg 
                className="w-full h-full opacity-50"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                >
                    {previewEdges.map((edge, i) => {
                        const src = sourcePosMap.get(edge.source);
                        const tgt = nodePositions.get(edge.target);
                        if(!src || !tgt) return null;
                        return (
                             <line 
                             key={i}
                             x1={`${src.x}%`}  y1={`${src.y}%`} 
                             x2={`${tgt.x}%`}  y2={`${tgt.y}%`} 
                             stroke="#52525b" 
                             strokeWidth="0.5" 
                             />
                        )
                    })}

                    {/* 
                        Source nodes:
                        folder level -> grey squares (files)
                        workspace level -> small teal circles (folders)
                    */}
                    {previewSourceIds.map((id, i) => {
                        const pos = sourcePosMap.get(id);
                        if(!pos) return null;
                        return level === "folder" ? (
                            <rect 
                                key={id}
                                x={`${pos.x -2}%`} y={`${pos.y - 2}%`}
                                width="4%" height="4%"
                                fill="#3f3f46" stroke="#71717a" strokeWidth="0.3"
                            />
                        ) : (
                            <circle 
                                key={id}
                                cx={`${pos.x}%`} cy={`${pos.y}%`}
                                r="2.5%"
                                fill={nodeColorDim}
                            />
                        )
                    })}

                    {/* Term nodes - purple circles, size of fileCount */}
                    {topNodes.map((node, i) => {
                        const pos = positions[i];
                        if(!pos) return null;
                        const r = i === 0 ? 4 : 2.5;
                        const fill = i === 0 ? "#7c3aed" : "#5b21b6";
                        return (
                            <circle 
                            key={node.id}
                            cx={`${pos.x}%`} cy={`${pos.y}%`}
                            r={`${r}%`}
                            className={ i === 0 ? "animate-pulse" : ""}
                            />
                        )
                    })}
                </svg>

                {/* Overlay Label */}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1
                rounded border border-white/10">
                    <p className="text-[9px] text-zinc-400">
                        Active Cluster: <span className="text-white
                        font-medium">{activeCluster}</span>
                    </p>
                </div>
            </div>

            {/* Stats - level aware */}
            <div className="flex justify-between text-[10px] text-zinc-600">
                <span>{conceptGraph!.nodes.length} {nodeLabel}</span>
                <span>{Array.from(new Set(
                    conceptGraph!.edges.map(e => e.source)
                )).length} {edgeSourceLabel}</span>
            </div>
        </div>
        
        {modalOpen && (
            <ConceptGraphModal 
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            level={level}
            title={title}
            />
        )}

        </>
    )
}
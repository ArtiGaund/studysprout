'use client';

import { selectCurrentFolder } from "@/store/selectors/folderSelector";
import { ConceptGraphEdge } from "@/types/state.type";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AnyNode, runForceLayout } from "./concept-graph-modal";
import { Network, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";

export const ConceptGraphView = ({ level }: { level: "folder" | "workspace"}) => {
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const currentFolder = useSelector(selectCurrentFolder);

    const conceptGraph = level === "folder"
        ? (currentFolder?.conceptGraph ?? null)
        : (currentWorkspace?.conceptGraph ?? null);

    const [layoutNodes, setLayoutNodes] = useState<AnyNode[]>([]);
    const [edges, setEdges] = useState<ConceptGraphEdge[]>([]);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const WIDTH = 800;
    const HEIGHT = 560;

    // Level-aware colors
    const termColor = level === "folder" ? "#5b21b6" : "#0c5e73";
    const termColorHover = level === "folder" ? "#7c3aed" : "#0e7490";
    const termStroke = level === "folder" ? "#7c3aed" : "#0e7490";
    const termStrokeHover = level === "folder" ? "#a78bfa" : "#22d3ee";
    const edgeColor = level === "folder" ? "#7c3aed" : "#0e7490";

    //Legend labels
    const termLabel = level === "folder" ? "Concept term" : "Folder";
    const sourceLabel = level === "folder" ? "File" : null;
    const countLabel = level === "folder" ? "concepts" : "folders";
    const sourceCountLabel = level === "folder" ? "files" : "folders";

     // Build layout when graph data changes
    useEffect(() => {
        if (!conceptGraph?.nodes?.length) return;

        const TOP_N = 80;
        const topNodes = [...conceptGraph.nodes]
            .sort((a,b) => b.fileCount - a.fileCount)
            .slice(0, TOP_N);

        const topNodeIds = new Set(topNodes.map(n => n.id));

        // Only keep edges connected to top nodes
        const filteredEdges = conceptGraph.edges.filter(
            e => topNodeIds.has(e.target)
        );

        // Collect unique file IDs from edges
        const fileIds = Array.from(new Set(filteredEdges.map(e => e.source)));

        // Build all nodes: term nodes + file nodes
        const termNodes: AnyNode[] = conceptGraph.nodes.map(n => ({
            id: n.id,
            label: n.label,
            fileCount: n.fileCount,
            x: 0,
            y: 0,
            type: "term" as const,
        }));

        let allNodes: AnyNode[] = termNodes;

        if(level === "folder"){
            const fileIds = Array.from(new Set(filteredEdges.map(e => e.source)));
            const fileNodes: AnyNode[] = fileIds.map(id => ({
                id,
                label: "File",
                x: 0,
                y: 0,
                type: "file" as const,
            }));
            allNodes = [ ...termNodes, ...fileNodes ];
        }

        // workspace level: all nodes are folders (term type), no separate source nodes
        const laid = runForceLayout(allNodes, conceptGraph.edges, WIDTH, HEIGHT);
        setLayoutNodes(laid);
        setEdges(conceptGraph.edges);
    }, [
        conceptGraph,
        level,
    ]);

    // Get connected node IDs for hover highlight
    const connectedIds = hoveredNode
        ? new Set([
              hoveredNode,
              ...edges
                  .filter(e => e.source === hoveredNode || e.target === hoveredNode)
                  .flatMap(e => [e.source, e.target]),
          ])
        : null;

    const nodeMap = new Map(layoutNodes.map(n => [n.id, n]));

    if(!conceptGraph?.nodes?.length){
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                <Network className="w-8 h-8 mb-2 opacity-30"/><p className="text-sm">
                    No concept data
                </p>
            </div>
        )
    }

    return (
        <>
             <div className="flex items-center gap-x-1.5 px-6 py-2 border-b border-white/5">
                <div className="flex items-center gap-x-1 bg-white/5 rounded-lg p-1">
                    {/* Zoom controls */}
                    <button
                        onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
                

                {/* Legend */}
                <div className="flex items-center gap-x-3 ml-4">
                    <div className="flex items-center gap-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-[10px] text-zinc-500">{termLabel}</span>
                    </div>
                    {/* Only show file legend at folder level */}
                   {level==="folder" && ( <div className="flex items-center gap-x-1.5">
                        <div className="w-2 h-2 rounded bg-zinc-600" />
                        <span className="text-[10px] text-zinc-500">File</span>
                    </div>)}
                    <span className="text-[10px] text-zinc-600 ml-auto">
                        {conceptGraph?.nodes?.length ?? 0} {countLabel} · {Array.from(
                            new Set(conceptGraph?.edges?.map(e => e.source) ?? []))
                            .length
                        } {sourceCountLabel}
                        </span>
                </div>
            </div>
                        <div
                        className="overflow-hidden cursor-grab active:cursor-grabbing relaive"
                        style={{ height: HEIGHT }}
                        onMouseDown={e => {
                            setIsDragging(true);
                            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                        }}
                        onMouseMove={e => {
                            if (!isDragging) return;
                            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                        }}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                    >
                        <svg
                            // ref={svgRef}
                            width="100%"
                            height={HEIGHT}
                            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                        >
                            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

                                {/* Edges */}
                                {edges.map((edge, i) => {
                                    const src = nodeMap.get(edge.source);
                                    const tgt = nodeMap.get(edge.target);
                                    if (!src || !tgt) return null;
                                    const isHighlighted = connectedIds
                                        ? connectedIds.has(edge.source) && connectedIds.has(edge.target)
                                        : true;
                                    return (
                                        <line
                                            key={i}
                                            x1={src.x} y1={src.y}
                                            x2={tgt.x} y2={tgt.y}
                                            stroke={isHighlighted ? "#7c3aed" : "#27272a"}
                                            strokeWidth={isHighlighted ? 1.5 : 0.5}
                                            strokeOpacity={isHighlighted ? 0.6 : 0.2}
                                            className="transition-all duration-200"
                                        />
                                    );
                                })}

                                {/* Nodes */}
                                {layoutNodes.map(node => {
                                    const isHovered = hoveredNode === node.id;
                                    const isDimmed = connectedIds ? !connectedIds.has(node.id) : false;
                                    const isFile = node.type === "file";
                                    // const termNode = node as LayoutNode;
                                    const radius = isFile 
                                        ? 7 
                                        : Math.max(8, Math.min(18, 8 + (node.fileCount ?? 1) * 2));

                                    return (
                                        <g
                                            key={node.id}
                                            transform={`translate(${node.x}, ${node.y})`}
                                            onMouseEnter={() => setHoveredNode(node.id)}
                                            onMouseLeave={() => setHoveredNode(null)}
                                            style={{ cursor: "pointer", opacity: isDimmed ? 0.2 : 1 }}
                                            // className="transition-opacity duration-200"
                                        >
                                            {/* Node shape */}
                                            {isFile ? (
                                                <rect
                                                    x={-radius} y={-radius}
                                                    width={radius * 2} height={radius * 2}
                                                    rx={3}
                                                    fill={isHovered ? "#52525b" : "#3f3f46"}
                                                    stroke="#71717a"
                                                    strokeWidth={1}
                                                />
                                            ) : (
                                                <circle
                                                    r={radius}
                                                    fill={isHovered ? "#7c3aed" : "#5b21b6"}
                                                    stroke={isHovered ? "#a78bfa" : "#7c3aed"}
                                                    strokeWidth={isHovered ? 2 : 1}
                                                />
                                            )}

                                            {/* Label */}
                                            {isHovered && <text
                                                y={radius + 14}
                                                textAnchor="middle"
                                                fontSize={isHovered ? 11 : 9}
                                                fill={isHovered ? "#e4e4e7" : "#a1a1aa"}
                                                className="pointer-events-none select-none"
                                            >
                                                {node.label.length > 16
                                                    ? node.label.slice(0, 14) + "…"
                                                    : node.label}
                                            </text>}

                                            {/* fileCount badge on term nodes */}
                                            {!isFile && node.fileCount > 1 && (
                                                <text
                                                    textAnchor="middle"
                                                    dominantBaseline="central"
                                                    fontSize={8}
                                                    fill="white"
                                                    fontWeight="bold"
                                                    className="pointer-events-none select-none"
                                                >
                                                    {node.fileCount}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>

                        {/* Hover tooltip */}
                        {hoveredNode && (() => {
                            const node = nodeMap.get(hoveredNode);
                            if (!node) return null;
                            const connectedEdges = edges.filter(
                                e => e.source === hoveredNode || e.target === hoveredNode
                            );
                            const isFile = node.type === "file";
                            return (
                                <div className="absolute bottom-4 left-6 bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-xs pointer-events-none">
                                    <p className="text-white font-semibold">{node.label}</p>
                                    <p className="text-zinc-500 mt-0.5">
                                        {isFile
                                            ? `Connected to ${connectedEdges.length} concept${connectedEdges.length !== 1 ? "s" : ""}`
                                            : level === "folder"
                                                ? `Appears in ${node.fileCount} file${node.fileCount !== 1 ? "s" : ""}`
                                                : `Contains ${node.fileCount} file${node.fileCount !== 1 ? "s" : ""} · ${connectedEdges.length} connection${connectedEdges.length !== 1 ? "s" : ""}`
                                        }
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                
        </>
    )
}
'use client';

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RefreshCw, Network, RefreshCcw, GitBranch } from "lucide-react";
import { ConceptGraph, ConceptGraphNode, ConceptGraphEdge } from "@/types/state.type";
import { useSelector } from "react-redux";
import { selectCurrentFolder } from "@/store/selectors/folderSelector";
import { ConceptGraphView } from "./concept-graph-view";
import { LearningPathView } from "./learning-path-view";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    level: "folder" | "workspace";
    title: string;
}

// ── Layout types ──────────────────────────────────────────────────────────────
interface LayoutNode {
    id: string;
    label: string;
    fileCount: number;
    x: number;
    y: number;
    type: "term"; // all nodes are terms
}

interface FileNode {
    id: string;
    label: string;
    x: number;
    y: number;
    type: "file";
}

export type AnyNode = LayoutNode | FileNode;

// ── Simple force-layout simulation (no D3 needed) ────────────────────────────
export function runForceLayout(
    nodes: AnyNode[],
    edges: ConceptGraphEdge[],
    width: number,
    height: number,
    iterations = 200
): AnyNode[] {
    // Place nodes in a circle initially
    const placed = nodes.map((n, i) => ({
        ...n,
        x: width / 2 + Math.cos((2 * Math.PI * i) / nodes.length) * (Math.min(width, height) * 0.35),
        y: height / 2 + Math.sin((2 * Math.PI * i) / nodes.length) * (Math.min(width, height) * 0.35),
        vx: 0,
        vy: 0,
    }));

    const nodeMap = new Map(placed.map(n => [n.id, n]));

    for (let iter = 0; iter < iterations; iter++) {
        const alpha = 1 - iter / iterations; // cooling

        // Repulsion between all nodes
        for (let i = 0; i < placed.length; i++) {
            for (let j = i + 1; j < placed.length; j++) {
                const a = placed[i], b = placed[j];
                const dx = b.x - a.x || 0.1;
                const dy = b.y - a.y || 0.1;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (3000 / (dist * dist)) * alpha;
                (a as any).vx -= (dx / dist) * force;
                (a as any).vy -= (dy / dist) * force;
                (b as any).vx += (dx / dist) * force;
                (b as any).vy += (dy / dist) * force;
            }
        }

        // Attraction along edges
        for (const edge of edges) {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) continue;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const idealDist = 120;
            const force = ((dist - idealDist) / dist) * 0.1 * alpha;
            (source as any).vx += dx * force;
            (source as any).vy += dy * force;
            (target as any).vx -= dx * force;
            (target as any).vy -= dy * force;
        }

        // Apply velocity + boundary clamp
        for (const n of placed) {
            n.x = Math.max(40, Math.min(width - 40, n.x + (n as any).vx));
            n.y = Math.max(40, Math.min(height - 40, n.y + (n as any).vy));
            (n as any).vx *= 0.8;
            (n as any).vy *= 0.8;
        }
    }

    return placed;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ConceptGraphModal = ({ 
    isOpen, 
    onClose, 
    level,
    title,
}: Props) => {
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const currentFolder = useSelector(selectCurrentFolder);
    const [activeTab, setActiveTab] = useState<"concepts" | "path">("concepts");

    const entityId = level === "folder"
        ? (currentFolder?._id ?? "")
        : (currentWorkspace?._id ?? "");

    const modalTitle = level === "folder" 
        ? "Folder Intelligence"
        : "Workspace Intelligence";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 
        backdrop-blur-sm">
            <div className="relative bg-[#111111] border border-white/10 rounded-2xl w-full
             max-w-4xl mx-4 overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                        <h2 className="text-sm font-semibold text-white">
                            {modalTitle}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">{title}</p>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex items-center gap-x-1 bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("concepts")}
                            className={`flex items-center gap-x-1.5 px-3 py-1.5 rounded-md text-sm
                                font-medium transition-all 
                                ${activeTab === "concepts"
                                    ? "bg-purple-600 text-white"
                                    : "text-zinc-400 hover:text-white"
                                }`
                            }
                        >   
                            <Network className="w-3.5 h-3.5"/>
                            Concept Map
                        </button>
                        <button
                            onClick={() => setActiveTab("path")}
                            className={`flex items-center gap-x-1.5 px-3 py-1.5 rounded-md text-sm
                                font-medium transition-all
                                ${activeTab === "path"
                                    ? "bg-purple-600 text-white"
                                    : "text-zinc-400 hover:text-white"
                                }
                                `}
                        >
                            <GitBranch className="w-3.5 h-3.5"/>
                            Learning Path
                        </button>
                    </div>
                       
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 
                        rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                        
                </div>
                
                {/* Content */}
                {activeTab === "concepts"
                    ? <ConceptGraphView level={level}/>
                    : <LearningPathView level={level} id={entityId}/>
                }
            </div>
        </div>
    );
};
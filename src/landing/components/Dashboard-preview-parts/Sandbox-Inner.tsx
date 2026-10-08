'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Node } from "../Dashboard-preview";
import { MousePointer2 } from "lucide-react";
import { SidebarView } from "./Sidebar-View";
import { MainCanvas } from "./Main-Canvas";

// ---SmartTooltip ---
// the tooltip measures iteself after render and clamps its position so it never overflow the 
// sandbox container on any screen size - including inside the fullscreen popup on small screens.
interface SmartTooltipProps{
    pointerX: number;
    pointerY: number;
    text: string;
    isSidebarItem: boolean;
    containerRef: React.RefObject<HTMLDivElement>;
};

const SmartTooltip:React.FC<SmartTooltipProps> = ({
    pointerX,
    pointerY,
    text,
    isSidebarItem,
    containerRef,
}) => {
    const tipRef = useRef<HTMLDivElement>(null);
    const [ pos, setPos ] = useState<React.CSSProperties>({ visibility: 'hidden' });
    const [ arrowRight, setArrowRight ] = useState(false);

    // useLayoutEffect so the position is set before the browser paints avoiding a single-frame
    // flicker of the unclamped position.
    useLayoutEffect(() => {
        if(!tipRef.current || !containerRef.current) return;

        const MARGIN = 6;
        const CURSOR = 20; //approximate cursor icon width/height
        const tipW = tipRef.current.offsetWidth;
        const tipH = tipRef.current.offsetHeight;
        const contW = containerRef.current.offsetWidth;
        const contH = containerRef.current.offsetHeight;

        // Preferred side: left of pointer for sidebar items, right otherwise.
        let left: number;
        let preferRight = !isSidebarItem;

        if(preferRight){
            left = pointerX + CURSOR + 4;
            // Would overflow the right edge? flip to the left
            if(left + tipW > contW - MARGIN){
                left = pointerX - tipW - 4;
                preferRight = false;
            }
        }else{
            left = pointerX - tipW - 4;
            // Would overflow the left edge? Flip to the right
            if(left < MARGIN){
                left = pointerX + CURSOR + 4;
                preferRight = true;
            }
        }

        // Hard clamp so it never escapes the container in either direction
        left = Math.max(MARGIN, Math.min(left, contW - tipW - MARGIN));

        // Vertical: center on pointer, then clamp
        let top = pointerY - tipH / 2;
        top = Math.max(MARGIN, Math.min(top, contH - tipH - MARGIN));

        setArrowRight(!preferRight);
        setPos({
            position: 'absolute',
            left,
            top,
            visibility: 'visible',
        });
    },[
        pointerX,
        pointerY,
        text,
        isSidebarItem,
        containerRef,
    ])

    return(
        <div 
        ref={tipRef}
        style={pos}
        className="z-[210] pointer-events-none transition-all duration-300"
        >   
            <div className="relative bg-[#C9A227] text-[#120C0E] text-[10px] font-mono font-bold 
            px-3 py-2 rounded-lg border border-[#E5C158]
            shadow-[0_0_20px_rgba(201,162,39,0.35)] whitespace-nowrap">
                {text}
                {/* Arrow painting toward the cursor */}
                <div 
                className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#C9A227] rotate-45
                    ${arrowRight ? '-right-1' : '-left-1'}`}
                />
            </div>
        </div>
    )
}

interface SandboxInnerProps{
    nodes: Node[];
    expandedFolders: Record<string, boolean>;
    editingId: string | null;
    pointerPos: { x: number; y: number; opacity: number };
    spotlightPos: { x: number; y: number; opacity: number; scale: number };
    contextText: string;
    isPaused: boolean;
    isSidebarItem: boolean;
    sandboxRef: React.RefObject<HTMLDivElement>;
    onUpdateName: (id: string, name: string) => void;
    onSetEditingId: (id: string | null) => void;
    onToggleFolder: (id: string) => void;
    onAddFolder: () => void;
    onAddFile: (id: string) => void;
    onDelete: (id: string) => void;
    onViewChange: (id: string) => void;
    onRecordInteracion: () => void;
    // When true the sandbox fills available height instead of using fixed px value
    fillHeight?: boolean;
}

export const SandboxInner: React.FC<SandboxInnerProps> = ({
    nodes,
    expandedFolders,
    editingId,
    pointerPos,
    spotlightPos,
    contextText,
    isPaused,
    isSidebarItem,
    sandboxRef,
    onUpdateName,
    onSetEditingId,
    onToggleFolder,
    onAddFolder,
    onAddFile,
    onDelete,
    onViewChange,
    onRecordInteracion,
    fillHeight=false,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(editingId && inputRef.current){
            inputRef.current.focus();
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
        }
    },[editingId]);

    return(
        <div 
        ref={sandboxRef}
        style={fillHeight ? { width: 1200, height: 740, position: 'relative' } : undefined}
        className={fillHeight 
            ? 'overflow-hidden bg-[#0A0608] rounded-2xl border border-[#3A282E]' 
            : 'relative overflow-hidden w-full h-full bg-[#0A0608] rounded-2xl border border-[#3A282E]'}
        >
            {/* Spotlight */}
            <div 
            className="absolute z-[190] pointer-events-none border border-[#C9A227] rounded-lg
            transition-all duration-700 ease-in-out shadow-[0_0_15px_#C9A227]"
            style={{
                left: spotlightPos.x - 12,
                top: spotlightPos.y - 12,
                width: '30px',
                height: '30px',
                opacity: spotlightPos.opacity,
                transform: `scaleX(${spotlightPos.scale})`,
                transformOrigin: 'left center',
            }}
            />

            {/* Guide Pointer */}
            <div
            className="absolute z-[200] pointer-events-none transition-all duration-700 ease-in-out"
            style={{
                left: pointerPos.x,
                top: pointerPos.y,
                opacity: pointerPos.opacity,
            }}
            >
                <MousePointer2 
                className="text-[#C9A227] fill-[#C9A227] drop-shadow-[0_0_10px_#C9A227]"
                size={20}
                />
            </div>


            {/* Smart clamped tooltip - always stays inside the sandbox */}
            {pointerPos.opacity > 0 && contextText && (
                <SmartTooltip 
                    pointerX={pointerPos.x}
                    pointerY={pointerPos.y}
                    text={contextText}
                    isSidebarItem={isSidebarItem}
                    containerRef={sandboxRef}
                />
            )}

            {/* Main Layout */}

            {/* 
                Inner layout
                -On normal (hero) view: min-h ensures a comfortable height but never overflow
                the viewpoint.
                -When fillHeight=true (fullscreen popup): takes all available height from the 
                popup
                -Only the sidebar list and main canvas scroll internally.
            */}
            <div className={`flex text-left overflow-hidden rounded-xl border border-[#2A1E22]
             bg-[#160F12] ${fillHeight ? 'h-full' : 'h-[80vh] min-h-[500px]'}`}
             >
                <SidebarView 
                     nodes={nodes}
                    expandedFolders={expandedFolders}
                    editingId={editingId}
                    updateName={onUpdateName}
                    setEditingId={onSetEditingId}
                    toggleFolder={onToggleFolder}
                    addFolder={onAddFolder}
                    addFile={onAddFile}
                    onViewChange={onViewChange}
                    deleteOperation={onDelete}
                    onRecordInteraction={onRecordInteracion}
                />

                <MainCanvas 
                nodes={nodes}
                addFolder={onAddFolder}
                addFile={onAddFile}
                deleteOperation={onDelete}
                onRecordInteraction={onRecordInteracion}
                />
            </div>
        </div>
    )
}
'use client';

import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ScaledContent } from "../Scaled-Content";

interface FullscreenPopupProps{
    isOpen: boolean;
    onClose: () => void;
    isPaused?: boolean;
    sandboxContent: React.ReactNode;
    /* Natural pixel width the content expects at scale=1. Default 1200 */
    naturalWidth?: number;
    /* Natural pixel height the content expects at scale=1. Default 740 */
    naturalHeight?: number;
    type?: 'sandbox' | 'flashcard';
}

export const FullscreenPopup: React.FC<FullscreenPopupProps> = ({
    isOpen,
    onClose,
    isPaused,
    sandboxContent,
    naturalWidth = 1200,
    naturalHeight = 740,
    type = 'sandbox',
}) => {
   
    const [ dims, setDims ] = useState({ w: 0, h: 0});
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); },[])
    // Tracking window dimensions reactively instead of reading window.innerWidth/Height at 
    // Rendering time (which freezes after orientation changes)
    useEffect(() => {
        if(!isOpen) return;
        const update = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            setDims({ w, h});
            //  if(w >= h) onClose();
            // Auto-exit when screen is wide enough for the normal inline layout
            if(type === 'flashcard' && w >= 1024) onClose();
            if(type === 'sandbox' && w >= 750) onClose();
        }
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    },[
        isOpen, 
        onClose,
        type,
    ]);

    // Lock body scroll while popup is open so the page behind doesn't scroll
    useEffect(() => {
        if(!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        const prevPosition = document.body.style.position;
        const prevWidth = document.body.style.width;
        const scrollY = window.scrollY;

        // Full lock:fix the body in place at its current scroll position
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${scrollY}px`;

        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.position = prevPosition;
            document.body.style.width = prevWidth;
            document.body.style.top = '';
            window.scrollTo(0, scrollY);
        }
    },[isOpen]);

    // shouldRotate is now derived from live dims, never stale.
    // const shouldRotate = dims.h > dims.w && dims.w > 0 && dims.w < 640;

    if(!isOpen || dims.w === 0 || !mounted) return null;
    const isPortraitMobile = dims.h > dims.w && dims.w < 640;
    // Header height constant - used for rotation offset calculation
    const HEADER_H = 48;

    // --- Portrait mode: rotate 90 deg CW and scale to fill with No scroll ---
    if(isPortraitMobile){
        // After rotating 90 deg, the screen's visual width = dims.h and height = dims.w
        // We want the content ( naturalWidth + naturalHeight ) to fit inside that.
        const availW = dims.h;  //visual width after rotation
        const availH = dims.w;  // visual height after rotation

        const scaleX = availW / naturalWidth;
        const scaleY = availH / naturalHeight;

        // Use the smaller of the two so both dimensions fit without overflow
        const scale = Math.min(scaleX, scaleY);

        // The pre-rotation container must be sized to the NATURAL dimensions so scale() works
        // correctly from the centre.
        const rotW = dims.h;   //pre-rotation width = screen height
        const rotH = dims.w;    // pre-rotation height = screen width

        const accentColor = type === 'flashcard' ? 'text-purple-400' : 'text-[#63FF9D]';
        

    return createPortal(
        /**
         * Portrait-phone fullscreen - rotated like landscape video.
         * The close button is fixed and NEVER inside the rotated layer so it's always reachable.
         */
        <div
        className="fixed inset-0 bg-[#050A0A]"
        style={{ zIndex: 2147483647}}
        >
            {/* Always visible close button */}
            <button
            onClick={onClose}
            className="fixed bottom-0 right-0 flex items-center justify-center w-9 h-9 rounded-lg
            border border-white/20 bg-black/90 text-gray-300 hover:text-white
             hover:border-white/40 transition-all"
             style={{
                zIndex: 2147483647,
                touchAction: 'manipulation'
             }}
            >
                <X size={18}/>
            </button>

            {/* AI guide status */}
            {/* <div
            className={`fixed top-4 left-3 text-[9px] font-black uppercase tracking-widest
                ${isPaused ? 'text-[#63FF9D]' : 'text-gray-600'}`}
            >
                {isPaused ? 'Override' : 'AI Guide'}
            </div> */}

            {/* Label */}
            <div className={`fixed top-4 left-3 text-[9px] font-black uppercase tracking-widest
                ${accentColor}`}
                style={{ zIndex: 2147483647 }}    
            >
                {type === 'flashcard' ? 'Flashcard Editor' : 'Sandbox' }
            </div>

            {/* 
                Rotated sandbox.
                Pre-rotated: width = screenH, height: screenW
                Post-rotated (90 deg CW): visually fills screenW x screenH
                rotated(90deg) + translateY(-screenW) corrects the origin shifts. 
             */}
             <div
             style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: rotW,
                height: rotH,
                transformOrigin: 'top left',
                transform: `rotate(90deg) translateY(-${rotH}px)`,
                overflow: 'hidden',
                // WebkitOverflowScrolling: 'touch',
                backgroundColor: '#050A0A',
                zIndex: 2147483646,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
             }}
             >
                <div 
                    style={{
                        width: naturalWidth,
                        height: naturalHeight,
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                        flexShrink: 0,
                        overflow: 'hidden',
                    }}
                >
                    {sandboxContent}
                </div>
             </div>
        </div>,
        document.body
    ) 
    }
    return createPortal(
         /**
         * Landscape / desktop fullscreen.
         * Header bar + sandbox filling remaining height
         */
        <div
        className="fixed inset-0 bg-black flex flex-col"
        style={{ zIndex: 2147483646}}
        >
            {/* Header */}
            <div
            className="flex items-center justify-between px-4 border-b border-white/10 gap-2
            shrink-0 bg-[#080C0C]"
            style={{ height: HEADER_H }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full bg-[#63FF9D] animate-pulse shrink-0
                        ${type === 'flashcard' 
                        ? 'bg-purple-400' 
                        : 'bg-[#63FF9D]'}`
                        }/>
                    <span className="text-white font-black uppercase tracking-widest text-[10px]
                    sm:text-xs truncate">
                       {type === 'flashcard' ? 'Flashcard Editor' : ' Studysprout Sandbox'}
                        <span className="hidden sm:inline text-gray-500 font-medium ml-2">
                            - Interactive Playground
                        </span>
                    </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {isPaused !== undefined &&(<span className={`text-[9px] sm:text-[10px] 
                    font-bold transition-all duration-500 ${isPaused 
                        ? 'text-[#63FF9D] opacity-100' 
                        : 'text-gray-600 opacity-50'}`}>
                            {isPaused ? 'OVERRIDE ACTIVE' : 'AI GUIDE RUNNING'}
                    </span>)}
                    <button
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border
                     border-white/10 text-gray-400 hover:text-white hover:border-white/30
                     transition-all shrink-0"
                    >
                        <X size={16}/>
                    </button>
                </div>
            </div>

            {/* Sandbox content */}
            <div
            className="flex-1 overflow-clip bg-[#050A0A] flex items-stretch justify-center p-3"
            style={{ height: `calc(100vh - ${HEADER_H}px)` }}
            >
                {/* 
                    Scale to fit available space.
                    The content renders at naturalWidth x naturalHeight, then scaled down so it
                    fits without overflow on any landscape screen size.
                 */}
                <ScaledContent
                naturalWidth={naturalWidth}
                naturalHeight={naturalHeight}
                availW={dims.w}
                availH={dims.h - HEADER_H - 24} //subtract padding
                >
                    {sandboxContent}
               </ScaledContent>
            </div>
        </div>
        , document.body);
}
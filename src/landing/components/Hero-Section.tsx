'use client';

import { useEffect, useState } from "react";
import { DashboardPreview } from "./Dashboard-preview";

// Technical phrase scrambling effect
const useScrambleText = (text: string, delay: number = 0) => {
    const [display, setDisplay] = useState("");
    const chars = "!<>-_\\/[]{}—=+*^?#________";

    useEffect(() => {
        let frame = 0;
        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                setDisplay(
                    text.split("").map((char, index) => {
                        if (index < frame / 3) return char;
                        return chars[Math.floor(Math.random() * chars.length)];
                    }).join("")
                );
                frame++;
                if (frame / 3 >= text.length) clearInterval(interval);
            }, 30);
        }, delay);
        return () => clearTimeout(timer);
    }, [text, delay]);

    return display;
};

export const HeroSection = () => {
    const scrambledTitle = useScrambleText("Architected.", 500);

    return (
       <section 
       id="hero-section"
       className="relative isolate flex flex-col items-center justify-center bg-[#050A0A] px-6
        py-40 text-center overflow-hidden min-h-screen"
       >
            {/* Animated Background Orbs */}
            <div className="absolute top-1/4 left-1/4 -z-10 h-[400px] w-[400px] rounded-full
             bg-[#63FF9D] opacity-[0.05] blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 -z-10 h-[500px] w-[500px] rounded-full
             bg-blue-500 opacity-[0.03] blur-[150px] animate-pulse [animation-delay:2s]" />

            {/* Badge Entrance */}
            {/* <div className="mb-8 flex items-center gap-2 rounded-full border
             border-[#63FF9D]/20 bg-[#63FF9D]/10 px-4 py-1.5 text-[11px] font-black 
             tracking-[0.3em] text-[#63FF9D] uppercase animate-in fade-in slide-in-from-top-4 duration-1000">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full 
                    rounded-full bg-[#63FF9D] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#63FF9D]"></span>
                </span>
                Systems Active • v2.0
            </div> */}

            {/* Main Heading with Scramble */}
            <h1 className="max-w-5xl text-6xl font-extrabold tracking-tighter text-white 
            md:text-8xl lg:text-9xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
               Your Knowledge, <br />
                <span className="bg-gradient-to-r from-[#63FF9D] via-emerald-400
                 to-[#63FF9D] bg-clip-text text-transparent font-mono min-h-[1.2em]
                  inline-block">
                    {scrambledTitle}
                </span>
            </h1>

            {/* Subtext Fade */}
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-gray-500 animate-in 
            fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                The block-based workspace that turns your notes into action. 
                Auto-generate flashcards, visualize concept graphs, and extract knowledge from 
                PDFs—all in one place.
            </p>

            {/* CTA Interaction */}
            <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row animate-in 
            fade-in zoom-in duration-1000 delay-500">
                <button className="group relative flex items-center gap-3 rounded-2xl
                 bg-[#63FF9D] px-10 py-5 font-black text-black transition-all
                  hover:scale-105 hover:shadow-[0_0_40px_rgba(99,255,157,0.4)] uppercase
                   text-[12px] tracking-widest">
                    Start Growing for free
                     <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
                <button className="rounded-2xl border border-white/10 bg-white/5 px-10 py-5 
                font-black text-white text-[12px] uppercase tracking-widest transition-all
                 hover:bg-white/10 hover:border-white/20">
                    View Demo
                </button>
            </div>

            {/* Dashboard 3D Entrance */}
            <div className="relative mt-24 w-full max-w-6xl mx-auto px-4 [perspective:2000px]
             animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
                <div className="absolute -inset-10 bg-[#63FF9D] opacity-[0.02] blur-[120px] 
                rounded-full" />

                <div className="relative rounded-2xl border border-white/10 bg-[#080C0C]/80 
                backdrop-blur-3xl p-1.5 shadow-2xl transition-all duration-1000 ease-out
                [transform:rotateX(15deg)_translateY(20px)] 
                hover:[transform:rotateX(0deg)_translateY(0px)]">
    
                    <DashboardPreview />
                </div>
            </div>
       </section>
    );
};
'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MousePointer2 } from "lucide-react";

export const Navbar = () => {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("hero-section");

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-30% 0px -30% 0px',
            threshold: 0.1
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            const intersectingEntries = entries.filter(entry => entry.isIntersecting);
            
            if (intersectingEntries.length > 0) {
                const mostVisible = intersectingEntries.reduce((prev, current) => {
                    return (current.intersectionRatio > prev.intersectionRatio) ? current : prev;
                });
                
                setActiveSection(mostVisible.target.id);
            }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const sections = ["hero-section", "workspaces-section", "editor-section", "flashcard-section", "ecosystem"];
        const observedSections = new Set<string>();

        const observeSections = () => {
            sections.forEach((id) => {
                if (!observedSections.has(id)) {
                    const el = document.getElementById(id);
                    if (el) {
                        observer.observe(el);
                        observedSections.add(id);
                        console.log(`✅ Observing section: ${id}`);
                    }
                }
            });
        };

        // Initial observation with delay for dynamic imports
        setTimeout(observeSections, 500);

        // Watch for new sections being added (handles dynamic imports)
        const mutationObserver = new MutationObserver(() => {
            observeSections();
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, []);

    const navLinks = [
        { name: "Workspaces", id: "workspaces-section" },
        { name: "Editor", id: "editor-section" },
        { name: "Flashcards", id: "flashcard-section" },
        { name: "Ecosystem", id: "ecosystem" },
    ];

    return (
        <nav className="fixed top-0 w-full z-[100] border-b border-white/10
         bg-[#050A0A]/90 backdrop-blur-xl h-20 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                
                {/* Brand */}
                <div className="text-[#63FF9D] font-black text-xl tracking-tighter">
                    <a href="#hero-section" className="hover:text-white transition-colors 
                    duration-300">
                        StudySprout
                    </a>
                </div>

                {/* Dynamic Links */}
                <div className="hidden md:flex items-center gap-12">
                    {navLinks.map((link) => {
                        const isActive = activeSection === link.id;
                        return (
                            <div key={link.id} className="relative py-2">
                                {/* Glow Background for Active Item */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-[#63FF9D]/10 blur-xl
                                     rounded-full scale-150 animate-pulse" />
                                )}

                                <a
                                    href={`#${link.id}`}
                                    className={`relative text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500
                                    ${isActive ? 
                                        'text-[#63FF9D] scale-110' 
                                        : 'text-gray-500 hover:text-white'}`
                                    }
                                >
                                    {link.name}
                                </a>

                                {/* Pointing UP Pointer */}
                                {isActive && (
                                    <div className="absolute -bottom-6 left-1/2 
                                    -translate-x-1/2 animate-bounce">
                                        <MousePointer2 
                                            size={14} 
                                            className="text-[#63FF9D] fill-[#63FF9D] 
                                            rotate-0 drop-shadow-[0_0_8px_#63FF9D]" 
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6">
                    <button
                        className="text-gray-400 hover:text-white text-[10px] font-black 
                        uppercase tracking-widest transition"
                        onClick={() => router.push("/sign-in")}
                    >
                        Sign In
                    </button>
                    <button className="bg-[#63FF9D] text-black px-6 py-2.5 rounded-xl 
                    text-[10px] font-black uppercase tracking-widest hover:brightness-110 
                    hover:shadow-[0_0_25px_rgba(99,255,157,0.4)] transition-all active:scale-95">
                        Get Started
                    </button>
                </div>
            </div>
        </nav>
    );
};
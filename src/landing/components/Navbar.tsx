'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, MousePointer2, X } from "lucide-react";

export const Navbar = () => {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("hero-section");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        const sections = [
            "hero-section", 
            "workspaces-section", 
            "clipper-section",
            "editor-section", 
            "flashcard-section",
            "search-section", 
            "ecosystem"
        ];
        const observedSections = new Set<string>();

        const observeSections = () => {
            sections.forEach((id) => {
                if (!observedSections.has(id)) {
                    const el = document.getElementById(id);
                    if (el) {
                        observer.observe(el);
                        observedSections.add(id);
                    }
                }
            });
        };

        setTimeout(observeSections, 500);

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
        { name: "Clipper", id: "clipper-section", isNew: true },
        { name: "Editor", id: "editor-section" },
        { name: "Flashcards", id: "flashcard-section" },
        { name: "Search", id: "search-section" },
        { name: "Ecosystem", id: "ecosystem" },
    ];

    return (
        <>    
            <nav className="fixed top-0 left-0 right-0 w-full border-b border-[#2A1E22] bg-[#120C0E]/95 backdrop-blur-md z-[120] h-16 md:h-20 flex items-center transition-all">
                <div className="max-w-[95vw] lg:max-w-7xl mx-auto px-4 md:px-6 w-full flex items-center justify-between">
                    
                    {/* Brand */}
                    <div className="shrink-0">
                        <a href="#hero-section" className="font-serif italic text-2xl text-[#C9A227] tracking-normal hover:opacity-90 transition-opacity">
                            studysprout
                        </a>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-6 xl:gap-10">
                        {navLinks.map((link) => {
                            const isActive = activeSection === link.id;
                            return (
                                <div key={link.id} className="relative py-2">
                                    <a
                                        href={`#${link.id}`}
                                        className={`relative inline-flex items-center gap-1.5 text-[10px] xl:text-[11px] font-mono uppercase tracking-[0.2em] transition-all duration-200 ${
                                            isActive
                                                ? 'text-[#C9A227] font-semibold'
                                                : 'text-zinc-400 hover:text-zinc-200'
                                        }`}
                                    >
                                        {link.name}
                                        {link.isNew && (
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C9A227] opacity-75"/>
                                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#C9A227]" />
                                            </span>
                                        )}
                                    </a>

                                    {isActive && (
                                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 animate-bounce">
                                            <MousePointer2 
                                                size={12} 
                                                className="text-[#C9A227] fill-[#C9A227]" 
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions & Mobile Trigger */}
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="hidden md:flex items-center gap-6">
                            <button
                                className="text-zinc-400 hover:text-zinc-200 text-[10px] font-mono uppercase tracking-[0.2em] transition"
                                onClick={() => router.push("/sign-in")}
                            >
                                SIGN IN
                            </button>
                            <button 
                                className="text-[10px] font-mono tracking-[0.2em] text-[#C9A227] border border-[#C9A227]/60 hover:border-[#C9A227] hover:bg-[#C9A227]/10 px-4 py-2 uppercase transition-all"
                                onClick={() => router.push("/sign-up")}
                            >
                                GET STARTED
                            </button>
                        </div>

                        {/* Hamburger / Close Toggle */}
                        <button 
                            className="md:hidden p-2 z-[130] relative flex items-center justify-center text-[#C9A227] focus:outline-none" 
                            aria-label="Toggle Navigation Menu"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        >
                            <div className="relative w-6 h-6">
                                <X 
                                    size={24}
                                    className={`absolute inset-0 transition-all duration-300 transform ${
                                        isMobileMenuOpen 
                                            ? 'opacity-100 scale-100 rotate-0'
                                            : 'opacity-0 scale-50 -rotate-90'
                                    }`}
                                />
                                <Menu 
                                    size={24}
                                    className={`absolute inset-0 transition-all duration-300 transform ${
                                        isMobileMenuOpen
                                            ? 'opacity-0 scale-50 rotate-90'
                                            : 'opacity-100 scale-100 rotate-0'
                                    }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div 
                className={`fixed inset-0 z-[110] bg-[#120C0E] transition-all duration-300 ease-in-out md:hidden flex flex-col justify-between px-6 pt-24 pb-10 ${
                    isMobileMenuOpen 
                        ? 'opacity-100 pointer-events-auto translate-y-0' 
                        : 'opacity-0 pointer-events-none -translate-y-4'
                }`}
            >
                <div className="flex flex-col space-y-6">
                    {navLinks.map((link) => (
                        <a
                            key={link.id}
                            href={`#${link.id}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`text-sm font-mono uppercase tracking-[0.2em] flex items-center justify-between py-2 border-b border-[#2A1E22]/50 ${
                                activeSection === link.id ? 'text-[#C9A227] font-bold' : 'text-zinc-400'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                {link.name}
                                {link.isNew && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]" />
                                )}
                            </span>
                        </a>
                    ))}
                </div>

                <div className="flex flex-col space-y-3 pt-6 border-t border-[#2A1E22]">
                    <button
                        className="w-full text-zinc-400 hover:text-zinc-200 py-3 font-mono uppercase text-xs tracking-[0.2em] border border-transparent"
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            router.push("/sign-in");
                        }}
                    >
                        SIGN IN
                    </button>
                    <button
                        className="w-full border border-[#C9A227] text-[#C9A227] py-3 font-mono uppercase text-xs tracking-[0.2em] hover:bg-[#C9A227]/10 transition-colors"
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            router.push("/sign-up");
                        }}
                    >
                        GET STARTED
                    </button>
                </div>
            </div>
        </>
    );
};
'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, MousePointer2, X } from "lucide-react";

export const Navbar = () => {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("hero-section");
    const [ isMobileMenuOpen, setIsMobileMenuOpen ] = useState(false);

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
    <>    
        <nav className={`fixed top-0 w-full border-b border-white/10
         bg-[#050A0A]/90 backdrop-blur-xl h-16 md:h-20 flex items-center transition-all
         ${isMobileMenuOpen ? 'z-[110]' : 'z-[100]'}`}>

            <div className="max-w-[95vw] lg:max-w-7xl mx-auto px-4 md:px-6 w-full flex 
            items-center justify-between">
                
                {/* Brand */}
                <div className="text-[#63FF9D] font-black text-lg sm:text-xl tracking-tighter
                shrink-0">
                    <a href="#hero-section" className="hover:text-white transition-colors 
                    duration-300">
                        StudySprout
                    </a>
                </div>

                {/* Desktop Links */}
                <div className="hidden lg:flex items-center gap-8 xl:gap-12">
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
                                    className={`relative text-[10px] xl:text-[11px] font-black
                                        uppercase tracking-[0.2em] transition-all duration-500
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

                {/* Desktop Actions + Mobile Toggle*/}
                <div className="flex items-center gap-3 sm:gap-6">
                    <div className="hidden lg:flex items-center gap-6">
                        <button
                            className="text-gray-400 hover:text-white text-[10px] font-black 
                            uppercase tracking-widest transition"
                            onClick={() => router.push("/sign-in")}
                        >
                            Sign In
                        </button>
                        <button className="bg-[#63FF9D] text-black px-4 xl:px-6 py-2
                        md:py-2.5 rounded-xl 
                        text-[10px] font-black uppercase tracking-widest hover:brightness-110 
                        hover:shadow-[0_0_25px_rgba(99,255,157,0.4)] transition-all active:scale-95">
                            Get Started
                        </button>
                    </div>

                    {/* Hamburger Button */}
                    <button 
                        className="lg:hidden p-2 z-[200] relative flex items-center justify-center" 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                       <div className="relative w-7 h-7">
                            <X 
                            size={28}
                            className={`absolute inset-0 text-[#63FF9D] transition-all duration-300
                                transform ${isMobileMenuOpen 
                                    ? 'opacity-100 scale-100 rotate-0'
                                    : 'opacity-0 scale-50 -rotate-90'
                                }`}
                            />
                            <Menu 
                            size={28}
                            className={`absolute inset-0 text-[#63FF9D] transition-all duration-300
                                transform ${isMobileMenuOpen
                                    ? 'opacity-0 scale-50 rotate-90'
                                    : 'opacity-100 scale-100 rotate-0'
                                }`}
                            />
                       </div>
                    </button>
                </div>
            </div>
        </nav>

        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-[105] bg-[#050A0A]/95 backdrop-blur-2xl transition-transform
            duration-500 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full p-8 pt-24 space-y-8">
                {navLinks.map((link) => (
                    <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-2xl font-bold flex items-center justify-between group
                        ${activeSection === link.id ? 'text-[#63FF9D]' : 'text-gray-500'}`}
                    >
                        {link.name}
                        <div className={`h-1 w-1 rounded-full bg-[#63FF9D] transition-all
                            duration-300 ${activeSection === link.id
                                ? 'opacity-100 scale-150'
                                : 'opacity-0'
                            }`}/>
                    </a>
                ))}

                <div className="mt-auto space-y-4">
                    <button
                    className="w-full bg-[#63FF9D] text-black py-4 rounded-2xl font-black
                    uppercase text-xs tracking-widest"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    </>
    );
};
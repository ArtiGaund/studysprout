'use client';

import { useEffect, useState } from "react";

export const NavbarDebugger = () => {
    const [foundSections, setFoundSections] = useState<string[]>([]);
    const [activeSection, setActiveSection] = useState<string>("");
    const [intersections, setIntersections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // Check which sections exist in the DOM
        const sections = ["hero-section", "workspaces-section", "editor-section", "flashcard-section", "ecosystem"];
        const found: string[] = [];
        
        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                found.push(id);
            }
        });
        
        setFoundSections(found);

        // Set up intersection observer
        const observerOptions = {
            root: null,
            rootMargin: '-30% 0px -30% 0px',
            threshold: 0.1
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            const newIntersections: Record<string, boolean> = {};
            
            entries.forEach((entry) => {
                newIntersections[entry.target.id] = entry.isIntersecting;
            });
            
            setIntersections(prev => ({ ...prev, ...newIntersections }));
            
            // Find most visible
            const intersectingEntries = entries.filter(e => e.isIntersecting);
            if (intersectingEntries.length > 0) {
                const mostVisible = intersectingEntries.reduce((prev, current) => {
                    return (current.intersectionRatio > prev.intersectionRatio) ? current : prev;
                });
                setActiveSection(mostVisible.target.id);
            }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        
        setTimeout(() => {
            sections.forEach((id) => {
                const el = document.getElementById(id);
                if (el) observer.observe(el);
            });
        }, 100);

        return () => observer.disconnect();
    }, []);

    return (
        <div className="fixed bottom-4 right-4 bg-black/90 border border-white/20 rounded-lg p-4 text-xs font-mono z-[200] max-w-xs">
            <div className="text-[#63FF9D] font-bold mb-2">Navbar Debug Info</div>
            
            <div className="space-y-2">
                <div>
                    <div className="text-gray-400 mb-1">Active Section:</div>
                    <div className="text-white font-bold">{activeSection || "none"}</div>
                </div>
                
                <div>
                    <div className="text-gray-400 mb-1">Found Sections ({foundSections.length}/5):</div>
                    <div className="space-y-1">
                        {["hero-section", "workspaces-section", "editor-section", "flashcard-section", "ecosystem"].map(id => (
                            <div key={id} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${foundSections.includes(id) ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className={foundSections.includes(id) ? 'text-green-400' : 'text-red-400'}>
                                    {id}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div>
                    <div className="text-gray-400 mb-1">Currently Intersecting:</div>
                    <div className="space-y-1">
                        {Object.entries(intersections).map(([id, isIntersecting]) => (
                            <div key={id} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isIntersecting ? 'bg-blue-500' : 'bg-gray-600'}`} />
                                <span className={isIntersecting ? 'text-blue-400' : 'text-gray-600'}>
                                    {id}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
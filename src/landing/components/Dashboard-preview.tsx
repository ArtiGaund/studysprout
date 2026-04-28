'use client';

import { Briefcase, Folder, FileText, MousePointer2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { SidebarView } from "./Dashboard-preview-parts/Sidebar-View";
import { MainCanvas } from "./Dashboard-preview-parts/Main-Canvas";

export interface Node {
    id: string;
    type: 'folder' | 'file';
    name: string;
    parentId: string | null;
}

export const DashboardPreview = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [pointerPos, setPointerPos] = useState({ x: 100, y: 100, opacity: 0 });
    const [contextText, setContextText] = useState("");
    const [ spotlightPos, setSpotlightPos ] = useState({ x: 0, y: 0, opacity: 0, scale: 1});
    const [ currentView, setCurrentView ] = useState<
            'dashboard' |
            'flashcard-section' |
            'workspaces-section'
            >('dashboard');
    const [ isPaused, setIsPaused ] = useState(false);

    const lastInteraction = useRef<number>(0);
    const sandboxRef = useRef<HTMLDivElement>(null);
    // will check whether the dashboard-preview is active or not.
    const isVisible = useRef(false);
    
    const steps = [
        // Sidebar Items (Tooltip should be on the LEFT of the sandbox)
        { 
            x: 35, 
            y: 55, 
            text: "Current Workspace: Switch environments easily.", 
            delay: 3000 
        },
        { 
            x: 35, 
            y: 118, 
            text: "Global Search: Find notes across your vault.", 
            delay: 3000 
        },
        { 
            x: 35, 
            y: 155, 
            text: "Home: Return to your primary workspace.", 
            delay: 3000 
        },
        { 
            x: 35, 
            y: 190, 
            text: "Trash: Recover deleted documents.", 
            delay: 3000 
        },
        { 
            x: 35, 
            y: 225, 
            text: "Revision: Toggle SRS flashcard sidebar.", delay: 
            3000 
        },
        
        // Control Items (Tooltip should be on the RIGHT of the pointer)
        { 
            x: 193, 
            y: 320, 
            text: "PDF Parser: Fracture documents into folders.", 
            action: 'highlightPdf', 
            delay: 3000 
        },
        { 
            x: 225, 
            y: 320, 
            text: "Create Folder: Architect your structure.", 
            action: 'addFolder', 
            delay: 3000 
        },
        { 
            x: 225, 
            y: 355, 
            text: "Double-click to rename your folder.", 
            action: 'renameFolder', 
            delay: 4500 
        },
        { 
            x: 210, 
            y: 360, 
            text: "Create File: Deep dive into concepts.", 
            action: 'addFile', 
            delay: 3000 
        },
        { 
            x: 233, 
            y: 385, 
            text: "Double-click to rename your file.", 
            action: 'renameFile', 
            delay: 4000 
        },
    ];

    const recordInteraction = useCallback(() => {
        lastInteraction.current = Date.now();
        setIsPaused(true);
    },[])
  
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible.current = entry.isIntersecting;
            },
            { threshold: 0.1 }
        );

        if(sandboxRef.current) observer.observe(sandboxRef.current);

        return () => observer.disconnect();
    },[])

      const getNodeCoords = (id: string) => {
        const element = document.getElementById(`node-${id}`);
        const container = sandboxRef.current;

        if(element && container){
            const rect = element.getBoundingClientRect();
            const contRect = container.getBoundingClientRect();

            const isFile = id.startsWith("fi-");

            return {
                x: rect.left - contRect.left + (isFile ? 40 : 20),
                y: rect.top - contRect.top + ( rect.height / 2),
            };
        }
        return null;
    }


    useEffect(() => {
        const interval = setInterval(() => {
            if(Date.now() - lastInteraction.current > 10000){
                setIsPaused(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    },[])
    useEffect(() => {
        let alive = true;
        const runGuide = async () => {
            await new Promise(r => setTimeout(r, 1000));
            
            while (alive) {

                if(!isVisible.current){
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                for (let i = 0; i < steps.length; i++) {


                    if(!isVisible.current){
                        break; // Exit loop if not visible
                    }
                    // If user interacted in the last 10s, wait here
                    while(Date.now() - lastInteraction.current < 10000){
                        if(!alive) break;

                        if(!isVisible.current){
                            break; // Exit loop if not visible
                        }

                        // Hide guide pointer
                        setPointerPos(prev => ({
                            ...prev,
                            opacity: 0,
                        }));

                        setContextText("User Mode Active...");
                        await new Promise(r => setTimeout(r, 1000));
                    }

                    if (!alive) break;

                    if(!isVisible.current){
                        break; // Exit loop if not visible
                    }
                    const step = steps[i];
                    
                    // Default pointer movement
                    setPointerPos({ x: step.x, y: step.y, opacity: 1 });
                    setContextText(step.text);
                    await new Promise(r => setTimeout(r, 800)); 

                    if (step.action === 'highlightPdf') {
                        if(!isVisible.current) break;
                        setSpotlightPos({ x: step.x, y: step.y, opacity: 1, scale: 1 });
                    } 
                    
                    else if (step.action === 'addFolder') {
                        if(!isVisible.current) break;
                        setSpotlightPos({ x: step.x, y: step.y, opacity: 1, scale: 1 });
                        await new Promise(r => setTimeout(r, 400));
                        if (!alive) return;
                        setNodes(prev => {
                            if (prev.some(n => n.id === 'f-guide')) return prev;
                            // APPEND to bottom
                            return [...prev, { id: 'f-guide', type: 'folder', name: 'Untitled Folder', parentId: null }];
                        });
                    } 

                    else if (step.action === 'renameFolder') {
                        if(!isVisible.current) break;
                        const coords = getNodeCoords('f-guide');
                        const finalY = coords ? coords.y : step.y;
                        
                        setPointerPos({ x: 50, y: finalY, opacity: 1 });
                        setSpotlightPos({ x: 50, y: finalY, opacity: 1, scale: 5.5 });
                        await new Promise(r => setTimeout(r, 500));
                        setEditingId('f-guide');
                        
                        const target = "Machine Learning";
                        let current = "";
                        for (const char of target) {
                            await new Promise(r => setTimeout(r, 70));
                            if (!alive) return;
                            current += char;
                            // FIX: Use .map to prevent deleting user folders
                            setNodes(prev => prev.map(n => n.id === 'f-guide' ? { ...n, name: current } : n));
                        }
                        await new Promise(r => setTimeout(r, 1000));
                        setEditingId(null);
                    } 

                    else if (step.action === 'addFile') {
                        if(!isVisible.current) break;
                        const coords = getNodeCoords('f-guide');
                        const finalY = coords ? coords.y : step.y;

                        // Point to the Plus icon on the guide folder specifically
                        setPointerPos({ x: 230, y: finalY, opacity: 1 });
                        setSpotlightPos({ x: 210, y: finalY, opacity: 1, scale: 1 });
                        await new Promise(r => setTimeout(r, 600)); 
                        if (!alive) return;
                        setNodes(prev => [...prev, { 
                            id: 'fi-guide', 
                            type: 'file', 
                            name: 'Untitled File', 
                            parentId: 'f-guide' 
                        }]);
                        setExpandedFolders(prev => ({ ...prev, 'f-guide': true }));

                        await new Promise(r => setTimeout(r, 300));
                    } 

                    else if (step.action === 'renameFile') {
                        if(!isVisible.current) break;
                        // FIX: Dynamic positioning for the file as well
                        const coords = getNodeCoords('fi-guide');
                        const finalY = coords ? coords.y : 385; 

                        // If dynamic coords fail, we fallback to a calculated offset below the
                        // folder
                        const fallbackY = (getNodeCoords('f-guide')?.y || 355) + 32;

                        setPointerPos({ x: 75, y: finalY, opacity: 1 });
                        setSpotlightPos({ x: 75, y: finalY, opacity: 1, scale: 5.2 });
                        await new Promise(r => setTimeout(r, 500));
                        setEditingId('fi-guide');
                        
                        const target = "Neural_Networks.md";
                        let current = "";
                        for (const char of target) {
                            await new Promise(r => setTimeout(r, 60));
                            if (!alive) return;
                            current += char;
                            setNodes(prev => prev.map(
                                n => n.id === 'fi-guide' 
                                ? { ...n, name: current } 
                                : n
                            ));
                        }
                        await new Promise(r => setTimeout(r, 1000));
                        setEditingId(null);
                    } 
                    
                    else {
                        setSpotlightPos(prev => ({ ...prev, opacity: 0 }));
                    }

                    await new Promise(r => setTimeout(r, step.delay));
                }

                // Reset cycle
                setPointerPos(prev => ({ ...prev, opacity: 0 }));
                setSpotlightPos(prev => ({ ...prev, opacity: 0 }));
                setNodes(prev => prev.filter(n => n.id !== 'f-guide' && n.id !== 'fi-guide'));
                setExpandedFolders(prev => {
                    const newState = { ...prev };
                    delete newState['f-guide'];
                    return newState;
                });
                await new Promise(r => setTimeout(r, 2000));
            }
        };

        runGuide();
        return () => { alive = false; };
    }, []);
    // Tooltip should be outside to the left if targeting the sidebar (x < 100)
    const isSidebarItem = pointerPos.x < 100;

    const getOrderedNodes = () => {
        const userNodes = nodes.filter( n => n.id.startsWith('manual-'));
        const guideNodes = nodes.filter(n => 
            n.id.startsWith('f-') || n.id.startsWith('fi-')
        );

        return [
            ...userNodes,
            ...guideNodes,
        ];
    }

    const handleUserNavigation = (viewId: string) => {
        // 1. Update internal sandbox view
        if(viewId === 'flashcard-section'){
            setCurrentView('flashcard-section');
        }
        else if(viewId === 'workspaces-section'){
            setCurrentView('dashboard');
        }

        // 2.Want to scroll the actual webpage to Flashcard section
        const targetSection = document.getElementById(viewId);
        if(targetSection){
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    const handleAddFolder = () => {
        const newFolder: Node = {
                id: `manual-${Date.now()}`,  //this is for user
                type: 'folder',
                name: 'New Folder',
                parentId: null
        };
        setNodes(prev => [...prev, newFolder]);
    };

    const handleAddFile = (parentId: string) => {
        const newFile: Node = {
            id: `manual-${Date.now()}`,  //this is for user
            type: 'file',
            name: 'New File.md',
            parentId: parentId
        };
        setNodes(prev => [...prev, newFile]);
        setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
    };

    const handleDelete = (id: string) => {
        setNodes(prev => prev.filter(node => node.id !== id && node.parentId !== id));
    };
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center mb-6 animate-bounce">
                <div className="px-4 py-2 bg-[#63FF9D]/10 border border-[#63FF9D]/20
                 rounded-full">
                    <p className="text-[#63FF9D] text-[10px] font-black uppercase 
                    tracking-widest">
                        Move your pointer inside to take control & try it yourself
                    </p>
                </div>
            </div>
            {/* Sandbox Heading */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#63FF9D] animate-pulse"/>
                    <h3 className="text-white font-black uppercase tracking-widest text-xs">
                        Studysprout Sandbox
                        <span className="text-gray-500 font-medium ml-2">
                            - Interactive Playground
                        </span>
                    </h3>
                </div>

                {/* Interactive Indicator */}
                <div className={`text-[10px] font-bold transition-all duration-500
                    ${isPaused 
                        ? 'text-[#63FF9D] opacity-100'
                        : 'text-gray-600 opacity-50'
                    }`}>
                    { isPaused 
                        ? "MANUAL OVERRIDE ACTIVE"
                        : "AI GUIDE RUNNING"
                    }
                </div>
            </div>
        <div 
        ref={sandboxRef}
        className="relative rounded-2xl border border-white/10 bg-[#080C0C]/80 
        backdrop-blur-3xl p-1.5 shadow-2xl transition-all duration-1000 
        [transform:rotateX(10deg)] hover:[transform:rotateX(0deg)]"
        >
            
            <div 
                className="absolute z-[190] pointer-events-none border border-[#63FF9D] 
                rounded-lg transition-all duration-700 ease-in-out shadow-[0_0_15px_#63FF9D]"
                style={{ 
                    left: spotlightPos.x - 12, 
                    top: spotlightPos.y - 12, // Adjusted for 24px height
                    width: '30px',             // Solid base width
                    height: '24px',            // Standard row height for sidebar items
                    opacity: spotlightPos.opacity,
                    transform: `scaleX(${spotlightPos.scale})`,
                    transformOrigin: 'left center'
                }}
            />

            {/* The Virtual Guide Pointer */}
            <div 
                className="absolute z-[200] pointer-events-none transition-all duration-700 
                ease-in-out"
                style={{ left: pointerPos.x, top: pointerPos.y, opacity: pointerPos.opacity }}
            >
                <MousePointer2 
                className="text-[#63FF9D] fill-[#63FF9D] drop-shadow-[0_0_10px_#63FF9D]" 
                size={20} />
                
                {/* TOOLTIP LOGIC */}
                <div className={`absolute top-[-10px] transition-all duration-500 
                whitespace-nowrap
                    ${isSidebarItem 
                        ? 'fixed-tooltip-left' // Moves tooltip OUTSIDE to the left
                        : 'left-[25px] ml-4'                   // Moves tooltip to the right
                    }`}
                    style={isSidebarItem ? {
                        left: `-${pointerPos.x + 10}px`, // Dynamically negate the pointer's X to stay at the edge
                        transform: 'translateX(-100%)',
                        marginRight: '20px'
                    } : {}}
                >
                    <div className="bg-[#63FF9D] text-black text-[10px] font-black px-3 py-2 
                    rounded-lg shadow-[0_0_30px_rgba(99,255,157,0.3)] relative">
                        {contextText}
                        {/* Arrow */}
                        <div className={`absolute top-[14px] w-2.5 h-2.5 bg-[#63FF9D] 
                        rotate-45 
                            ${isSidebarItem ? '-right-1' : '-left-1'}`} 
                        />
                    </div>
                </div>
            </div>

            <div className="flex h-[600px] text-left overflow-hidden rounded-xl">
                <SidebarView 
                    nodes={getOrderedNodes()}
                    expandedFolders={expandedFolders}
                    editingId={editingId}
                    updateName={(id, name) => setNodes(prev => 
                        prev.map(n => n.id === id ? { ...n, name } : n))
                    }
                    setEditingId={setEditingId}
                    toggleFolder={(id) => setExpandedFolders(prev => 
                        ({ ...prev, [id]: !prev[id] }))
                    }
                    addFolder={() => {
                        handleAddFolder();
                        recordInteraction();
                    }}
                    addFile={(id) => {
                        handleAddFile(id);
                        recordInteraction();
                    }}
                    onViewChange={(id) => {
                        handleUserNavigation(id);
                        recordInteraction();
                    }}
                    deleteOperation={handleDelete}
                />

               <MainCanvas 
                nodes={getOrderedNodes()}
                addFolder={handleAddFolder}
                addFile={handleAddFile}
                deleteOperation={handleDelete}
                />
            </div>
        </div>
        </div>
    );
};
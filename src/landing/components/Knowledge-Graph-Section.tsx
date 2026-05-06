'use client';

import { Share2, GitBranch, Target } from "lucide-react";
import { useState } from "react";

export const KnowledgeGraphSection = () => {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Nodes moved UP (Lower Y values) to prevent hiding at the bottom
    const concepts = [
        { id: 'nlp', label: 'NLP', x: 250, y: 60, color: 'bg-blue-500', delay: '0s' },
        { id: 'trans', label: 'Transformers', x: 250, y: 180, color: 'bg-[#63FF9D]', delay: '1s' },
        { id: 'attn', label: 'Attention', x: 150, y: 300, color: 'bg-purple-500', delay: '2s' },
        { id: 'math', label: 'Linear Algebra', x: 350, y: 300, color: 'bg-pink-500', delay: '1.5s' },
    ];

    return (
        <section
        id="ecosystem"
         className="py-16 md:py-32 px-4 sm:px-6 lg:px-8 bg-[#050A0A] relative overflow-hidden"
         >
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12
            lg:gap-16 items-center">
                
                {/*Visual Graph Container  */}
                <div className="relative aspect-square max-w-[90vw] sm:max-w-xl mx-auto w-full
                 bg-[#080C0C] rounded-[30px] order-last lg:order-first
                 md:rounded-[40px] border border-white/5 shadow-2xl overflow-hidden">
                    
                    {/* SVG Path: Coordinates updated to match node y-values */}
                    <svg viewBox="0 0 500 500" className="absolute inset-0 w-full h-full z-0">
                        <path 
                            d="M 250,60 L 250,180 M 250,180 L 150,300 M 250,180 L 350,300" 
                            fill="none" 
                            stroke="rgba(99, 255, 157, 0.3)" 
                            strokeWidth="2"
                            strokeDasharray="8,8"
                            className="animate-[draw-line_10s_linear_infinite]"
                        />
                    </svg>

                    <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                        {concepts.map((node) => (
                            <div 
                                key={node.id}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                className="absolute pointer-events-auto cursor-pointer"
                                style={{ 
                                    left: `${(node.x / 500) * 100}%`, 
                                    top: `${(node.y / 500) * 100}%`,
                                    animation: `float 6s ease-in-out infinite ${node.delay}`
                                }}
                            >
                                <div className="-translate-x-1/2 -translate-y-1/2 relative">
                                    <div className={`absolute inset-0 rounded-full ${node.color}
                                     opacity-20 animate-[pulse-ring_3s_ease-out_infinite] 
                                     scale-[2.5]`} />
                                    <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full 
                                    ${node.color} shadow-[0_0_20px_rgba(255,255,255,0.2)] 
                                    border-2 border-white/20`} />
                                    <div className={`absolute top-6 md:top-8 left-1/2 -translate-x-1/2 
                                        px-2 md:px-3 py-1 rounded-lg bg-[#0D1414] border
                                         border-white/10 text-[8px] md:text-[10px] font-black
                                          text-white transition-all whitespace-nowrap 
                                         ${hoveredNode === node.id 
                                         ? 'scale-110 opacity-100 border-[#63FF9D]/50 shadow-[0_0_15px_rgba(99,255,157,0.3)]' 
                                         : 'opacity-60 scale-90'}`}>
                                        {node.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Context Card */}
                    <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 
                    md:right-8 p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[#0D1414]/90 border
                     border-white/5 backdrop-blur-xl z-20">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={14} className="text-[#63FF9D]" />
                            <span className="text-[9px] md:text-[10px] font-black text-white 
                            uppercase tracking-widest">
                                Neural Mapping
                            </span>
                        </div>
                        <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed">
                            {hoveredNode === 'trans' 
                                ? "Critical path detected: 'Transformers' relies on 'Attention' and 'Linear Algebra' foundations."
                                : "The graph visualizes your cognitive dependencies. StudySprout's AI maps prerequisites as you build your second brain."}
                        </p>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-8 md:space-y-12 text-center lg:text-left order-first
                lg:order-last">
                    <div className="space-y-4">
                        <h3 className="text-[#63FF9D] font-mono text-[10px] uppercase 
                        tracking-[0.4em] opacity-80">
                            Knowledge Ecosystem
                        </h3>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white 
                        leading-tight">
                            Your Mind, <br/>
                            <span className="text-[#63FF9D]">Digitally Orchestrated.</span>
                        </h2>
                    </div>

                    <div className="space-y-4 max-w-xl mx-auto lg:mx-0">
                        <div className="flex gap-4 md:gap-5 items-start p-4 md:p-6 rounded-3xl 
                        border border-transparent hover:border-white/5 hover:bg-white/[0.02] 
                        transition-all group">
                            <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-2xl
                             bg-blue-500/10 flex items-center justify-center text-blue-400 
                             border border-blue-500/20 group-hover:scale-110 
                             transition-transform">
                                <Share2 size={24} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-white font-bold text-base md:text-lg mb-1">
                                    Non-Linear Discovery
                                </h4>
                                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                                    Map connections across subjects, revealing how different
                                     domains influence your core research.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 md:gap-5 items-start p-4 md:p-6 rounded-3xl 
                        border border-transparent hover:border-white/5 hover:bg-white/[0.02] 
                        transition-all group">
                            <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-2xl
                             bg-purple-500/10 flex items-center justify-center
                            text-purple-400 border border-purple-500/20 
                            group-hover:scale-110 transition-transform">
                                <GitBranch size={20} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-white font-bold text-base md:text-lg mb-1">
                                    Prerequisite Tracking
                                </h4>
                                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                                    Identify knowledge gaps and follow logical paths back to 
                                    foundational concepts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                @keyframes draw-line {
                    /* Reversed the flow direction (0 to 100) to move dashes UP */
                    from { stroke-dashoffset: 0; }
                    to { stroke-dashoffset: 100; } 
                }
            `}</style>
        </section>
    );
};
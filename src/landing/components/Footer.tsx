'use client';

import { Github, Globe, Heart, Terminal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ContactModal } from "./Contact-Modal";

export const Footer = () => {
    const [ isContactOpen, setIsContactOpen ] = useState(false);
    
    return(
        <footer className="w-full bg-[#120C0E] border-t border-[#2A1E22] py-12 md:py-20 px-4 
        sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Glow to separate from the previous section  */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] md:w-full h-px 
            bg-gradient-to-r from-transparent via-[#C9A227]/30 to-transparent"/>

            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start 
                md:items-center gap-12 lg:gap-8">
                    
                    {/* Brand Section */}
                    <div className="space-y-6 w-full lg:w-auto flex flex-col items-center
                    lg:items-start text-center lg:text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#C9A227]/10 flex 
                            items-center justify-center border border-[#C9A227]/20 text-[#C9A227]">
                                <Terminal size={18} />
                            </div>
                            <span className="text-xl font-serif text-[#F5F0EB] tracking-tight">
                                Studysprout
                            </span>
                        </div>
                        <p className="text-[#8C7A6B] text-sm md:text-base max-w-sm 
                        leading-relaxed font-sans">
                            Cultivating knowledge through surgical deconvolution and 
                            active recall.
                        </p>
                        <div className="text-[11px] text-[#8C7A6B] font-mono relative z-[20]">
                            © {new Date().getFullYear()} StudySprout. Engineering by{" "}
                            <a
                            href={process.env.NEXT_PUBLIC_LINKEDIN_PROFILE} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#A09388] hover:text-[#C9A227] transition-colors cursor-pointer pointer-events-auto"
                            >
                                Arti Gaund
                            </a>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-wrap justify-center lg:justify-start 
                    gap-x-10 gap-y-6 w-full lg:w-auto">
                        {[
                            { name: "Privacy Policy", href: "#" },
                            { name: "Terms of Service", href: "#"},
                            { name: "Contact Us", href: "#" },
                            { 
                                name: "GitHub", 
                                href: process.env.NEXT_PUBLIC_GITHUB_PROJECT_LINK || "#", 
                                icon: <Github size={14}/>
                            }
                        ].map((link) => (
                            <Link
                            key={link.name}
                            href={link.href}
                            className="text-xs font-mono text-[#8C7A6B] hover:text-[#C9A227] 
                            transition-all flex items-center gap-2 group"
                            onClick={(e) => {
                                if(link.name === "Contact Us"){
                                    e.preventDefault();
                                    setIsContactOpen(true);
                                }
                            }}
                            >
                                {link.icon && (
                                    <span className="text-[#8C7A6B] group-hover:text-[#C9A227] 
                                    transition-transform group-hover:scale-105">
                                        {link.icon}
                                    </span>
                                )}
                                    {link.name}
                            </Link>
                        ))}
                    </nav>
                    
                    <ContactModal 
                    isOpen={isContactOpen}
                    onClose={() => setIsContactOpen(false)}
                    />
                    
                    {/* Quick Action / Status */}
                    <div className="flex items-center justify-center lg:justify-end gap-4 w-full
                    lg:w-auto">
                        <div className="p-2.5 rounded-xl bg-[#181013] border border-[#2A1E22] 
                        text-[#8C7A6B] hover:border-[#C9A227]/40 hover:text-[#C9A227] 
                        transition-all cursor-pointer">
                            <Globe size={18}/>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#181013] border border-[#2A1E22] 
                        text-[#8C7A6B] hover:border-[#C9A227]/40 hover:text-[#C9A227] 
                        transition-all cursor-pointer">
                            <Terminal size={18}/>
                        </div>
                    </div>
                </div>

                {/* Bottom Signature */}
                <div className="pt-8 border-t border-[#2A1E22] flex flex-col md:flex-row 
                justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase 
                    tracking-widest text-[#8C7A6B]">
                        Built with <Heart size={10} className="text-[#C9A227] fill-[#C9A227]"/> 
                        for Developer Ecosystem
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-1 rounded-full 
                    bg-[#C9A227]/10 border border-[#C9A227]/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
                        <span className="text-[10px] font-mono text-[#C9A227] uppercase 
                        tracking-widest">
                            Systems Operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
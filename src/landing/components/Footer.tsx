'use client';

import { Github, Globe, Heart, Terminal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ContactModal } from "./Contact-Modal";

export const Footer = () => {
    const [ isContactOpen, setIsContactOpen ] = useState(false);
    
    return(
        <footer className="w-full bg-[#050A0A] border-t border-white/5 py-12 md:py-20 px-4 
        sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Glow to separate from the previous section  */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] md:w-full h-px 
            bg-gradient-to-r from-transparent via-[#63FF9D]/20 to-transparent"/>

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start 
                md:items-center gap-12 lg:gap-8">
                    
                    {/* Brand Section */}
                    <div className="space-y-6 w-full lg:w-auto flex flex-col items-center
                    lg:items-start text-center lg:text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#63FF9D]/10 flex 
                            items-center justify-center border border-[#63FF9D]/20 
                            shadow-[0_0_20px_rgba(99,255,157,0.1)]">
                                <Terminal size={18} className="text-[#63FF9D]"/>
                            </div>
                            <span className="text-xl font-bold text-[#63FF9D] tracking-tight">
                                Studysprout
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm md:text-base max-w-sm 
                        leading-relaxed font-medium">
                            Cultivating knowledge through surgical deconvolution and 
                            active recall.
                        </p>
                        <div className="text-[11px] text-gray-600 font-mono relative z-[20]">
                            © {new Date().getFullYear()} StudySprout. Engineering by{" "}
                            <a
                            href={process.env.NEXT_PUBLIC_LINKEDIN_PROFILE} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#63FF9D] transition-colors cursor-pointer pointer-events-auto"
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
                            className="text-xs md:text-sm text-gray-400 hover:text-[#63FF9D]
                             transition-all flex items-center gap-2 group"
                            onClick={(e) => {
                                if(link.name === "Contact Us"){
                                    e.preventDefault();
                                    setIsContactOpen(true);
                                }
                            }}
                            >
                                {link.icon && <span className="text-gray-600 group-hover:text-[#63FF9D]
                                transition-transform group-hover:scale-110">
                                    {link.icon}</span>}
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
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10
                         text-gray-400 active:scale-90 hover:border-[#63FF9D]/30
                        hover:text-[#63FF9D] transition-all cursor-pointer">
                            <Globe size={20}/>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10
                        text-gray-400 hover:text-[#63FF9D] hover:border-[#63FF9D]/30 
                        transition-all active:scale-90 cursor-pointer">
                            <Terminal size={20}/>
                        </div>
                    </div>
                </div>

                {/* Bottom Signature */}
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row
                justify-between items-center gap-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase
                    tracking-widest text-gray-700">
                        Built with <Heart size={10} className="text-red-500 fill-red-500"/>
                        for Developer Ecosystem
                    </div>
                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#63FF9D]/5
                     border border-[#63FF9D]/10">
                        <div className="w-2 h-2 rounded-full bg-[#63FF9D] animate-pulse shadow-[0_0_10px_#63FF9D]" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase 
                        tracking-widest">
                            Systems Stable
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
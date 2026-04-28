'use client';

import { Github, Globe, Heart, Terminal } from "lucide-react";
import Link from "next/link";

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return(
        <footer className="w-full bg-[#050A0A] border-t border-white/5 py-12 px-6 relative
        overflow-hidden">
            {/* Background Glow to separate from the previous section  */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r
            from-transparent via-[#63FF9D]/20 to-transparent"/>

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start 
                md:items-center gap-8">
                    
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#63FF9D]/10 flex items-center
                            justify-center border border-[#63FF9D]/20">
                                <Terminal size={18} className="text-[#63FF9D]"/>
                            </div>
                            <span className="text-xl font-bold text-[#63FF9D] tracking-tight">
                                Studysprout
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                            Cultivating knowledge through surgical deconvolution and 
                            active recall.
                        </p>
                        <div className="text-xs text-gray-600 font-mono">
                            © {currentYear} StudySprout. All rights reserved.
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-wrap gap-x-8 gap-y-4">
                        {[
                            { name: "Privacy Policy", href: "#" },
                            { name: "Terms of Service", href: "#"},
                            { name: "Contact Us", href: "#" },
                            { name: "GitHub", href: "#", icon: <Github size={14}/>}
                        ].map((link) => (
                            <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm text-gray-400 hover:text-[#63FF9D] transition-colors
                            flex items-center gap-2 group"
                            >
                                {link.icon && <span className="text-gray-600 group-hover:text-[#63FF9D]
                                transition-colors">
                                    {link.icon}</span>}
                                    {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Quick Action / Status */}
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400
                        hover:text-white transition-all cursor-pointer">
                            <Globe size={20}/>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10
                        text-gray-400 hover:text-white transition-all cursor-pointer">
                            <Terminal size={20}/>
                        </div>
                    </div>
                </div>

                {/* Bottom Signature */}
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row
                justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase
                    tracking-widest text-gray-700">
                        Built with <Heart size={10} className="text-red-500 fill-red-500"/>
                        for Developer Ecosystem
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#63FF9D] animate-pulse" />
                        <span className="text-[10px] font-mono text-gray-500 uppercase 
                        tracking-widest">
                            Systems Stable
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
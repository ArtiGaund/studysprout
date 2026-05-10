"use client"
import { ArrowLeft, Menu, X } from "lucide-react"
import React, { useState } from "react"
import CypressPageIcon from "../icons/CypressPageIcon"
import clsx from "clsx"
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider"

interface MobileSidebarProps{
    children: React.ReactNode;  //This is the main sidebar
    revisionContent: React.ReactNode; 
}


const MobileSidebar: React.FC<MobileSidebarProps> = ({ children, revisionContent }) => {
    const [ isOpen, setIsOpen ] = useState(false);

    const { isRevisionSidebarOpen, setRevisionSidebarOpen } = useRevisionSidebar();

    const handleClose = () => {
        setIsOpen(false);
        setRevisionSidebarOpen(false);
    }

    return(
        <>
            {/*1. TOP MENU BUTTON  */}
            <nav className="sm:hidden fixed top-0 left-0 p-4 z-50">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 bg-background/50 backdrop-blur-md rounded-md border
                     border-white/10"
                >
                    <Menu className="w-6 h-6 text-white"/>
                </button>
            </nav>

            {/* 2. OVERLAY BACKDROP */}
            <div 
                className={clsx(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 sm:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={handleClose}
            />

            {/* 3. SLIDING SIDEBAR CONTAINER */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 h-full w-[300px] bg-[#080C0C] z-[70] transition-transform",
                    "duration-300 ease-in-out sm:hidden border-r border-white/10",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                    {isRevisionSidebarOpen && (
                        <div className="flex items-center justify-between p-4 border-b
                         border-white/5">
                            <button
                            onClick={() => setRevisionSidebarOpen(false)}
                            className="flex items-center gap-2 text-muted-foreground hover:text-white
                            transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5"/>
                                <span className="text-sm font-medium">
                                    Back
                                </span>
                            </button>
                        </div>
                    )}
                    
                    <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-[80]"
                    >
                        <X className="w-5 h-5 text-muted-foreground"/>
                    </button>
                    <div className="overflow-y-auto h-full">
                        { isRevisionSidebarOpen ? revisionContent : children }
                    </div>
            </aside>
        </>
    )
}

export default MobileSidebar
'use client';

import React from "react";
import Sidebar from "@/components/sidebar/sidebar";
import MobileSidebar from "@/components/sidebar/mobile-sidebar";
import RevisionSidebar from "@/components/revision/revision-sidebar";
import { RevisionSidebarProvider } from "@/lib/providers/revision-sidebar-provider";
interface LayoutProps{
    children: React.ReactNode,
    params: any
}

const Layout: React.FC<LayoutProps> = ({ children, params }) => {
    return(
        <main className="flex overflow-hidden h-screen w-screen">
            <RevisionSidebarProvider>
            <Sidebar params={params} />
            <div className="border-neutral-12/70 border-l-[1px] relative overflow-scroll">
                 <RevisionSidebar params={params}/>
            </div>
           
            <MobileSidebar>
                <Sidebar 
                params={params}
                className="w-screen inline-block sm:hidden"
                />
            </MobileSidebar>
            <div className="border-neutral-12/70 border-l-[1px] w-full relative overflow-scroll">
                {children}
            </div>
            </RevisionSidebarProvider>
        </main>
    )
}

export default Layout
/**
 * @component UserCard
 * @description A compact UI element that displays the authenticated user's profile information
 * and provides a contextual dropup menu for account actions.
 * * * Key Functionality:
 * - Reactive UI: Adapts its layout based on the sidebar's expanded/collapsed state (`isRevisionSidebarOpen`).
 * - Outside Click Detection: Implements a custom `useEffect` hook to automatically close the menu when clicking elsewhere.
 * - Profile Integration: Consumes the `useUser` provider for real-time user data access.
 * - Action Suite: Provides access to the Settings modal and Logout functionality.
 */
"use client";

import React, { useEffect, useRef, useState} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CypressProfileIcon from "../icons/CypressProfileIcon";
import LogoutButton from "../global/logout-button";
import { LogOut, Settings, User2 } from "lucide-react";
import SettingsPage from "../settings/settings";
import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { useUser } from "@/lib/providers/user-provider";
const UserCard = () => {
    const [ isOpen, setIsOpen] = useState(false);
    const {user} = useUser();    
    const menuRef = useRef<HTMLDivElement>(null);
    const { isRevisionSidebarOpen } = useRevisionSidebar();
    
    /**
     * @effect ClickOutsideListener
     * Handles closing the action menu when a user clicks away from the component.
     * Essential for maintaining a clean UX in dense sidebars.
     */
    useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

    return(
        <article
        className={`hidden sm:flex justify-between items-center p-2.5 rounded-2xl
           ${!isRevisionSidebarOpen && 'bg-[#0D1414] border border-white/10 hover:bg-white/5'}
            transition-all group cursor-pointer `}
        >
          {/* Identity Section: Only visible when the sidebar is expanded */}
           {!isRevisionSidebarOpen && ( <aside
            className="flex justify-center items-center gap-3 min-w-0"
            >
                <Avatar>
                    <AvatarImage src={""}/>
                    <AvatarFallback>
                        <CypressProfileIcon />
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <small className="text-muted-foreground">
                        {user ? user?.username : ''}
                    </small>
                </div>
            </aside>)}

            {/* Action Section: Contains the Settings toggle and Dropup menu */}
            <div className="flex items-center justify-center">
                {/* dropup */}
                <div className="relative inline-block group">
                    {/* dropbtn */}
                    <button
                    onClick={toggleMenu}
                     className={`w-[40px] h-[40px] border-none hover:bg-zinc-800 rounded-lg cursor-pointer flex items-center justify-center
                     ${isRevisionSidebarOpen && 'bottom-4 ml-[-15px] mt-[-10px]'}`}>
                        <Settings />
                    </button>
                     {/* Dropdown */}

       {/* Contextual Dropup Menu */}              
      {isOpen && (
        <div className="absolute bottom-[45px] right-0 bg-gray-900 text-white px-0 py-1 rounded-md shadow-lg z-50 flex flex-col items-center space-y-1 min-w-[50px]">
          {/* Account Settings Trigger */}
          <SettingsPage>
                    <div 
                    className="w-full hover:bg-zinc-800 p-2 rounded-md flex justify-center"
                    >
                         <User2 className="w-4 h-4" />
                    </div>
                </SettingsPage> 
          
          {/* Authentication Termination */}
          <div className="w-full hover:bg-zinc-800 p-1 rounded-md flex justify-center">
            <LogoutButton>
              <LogOut className="w-4 h-4" />
            </LogoutButton>
          </div>
        </div>
      )}
                </div>
            </div>
        </article>
    )
}

export default UserCard
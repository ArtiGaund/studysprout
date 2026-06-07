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
  * Safely closes the menu dropdown context when a click occurs outside the ref perimeter
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

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return(
    <article
      ref={menuRef}
      onClick={(e) => {
        // If sidebar is collapsed, clicking the card itself can toggle the menu
        if(isRevisionSidebarOpen){
          setIsOpen((prev) => !prev);
        }
      }}
      className={`flex items-center rounded-xl transition-all relative select-none
        ${isRevisionSidebarOpen
          ? "w-10 h-10 justify-center bg-zinc-900 border border-white/5 hover:border-white/[0.04] cursor-pointer"
          : "w-full justify-between p-2.5 bg-[#141416]/90 border border-white/5 hover:bg-white/[0.04]"
        }`}
    >
      {/* 1. Identify Layout Cluster (Hidden when sidebar is tightly collapsed) */}
      {!isRevisionSidebarOpen && (
        <aside className="flex items-center gap-x-3 min-w-0">
          <Avatar className="w-8 h-8 rounded-lg border border-white/10 shrink-0">
            <AvatarImage 
              src={user?.avatarUrl || ""}
              className="object-cover"
            />
            <AvatarFallback className="bg-zinc-900 rounded-lg text-zinc-400 font-bold text-xs">
              {user?.username?.[0]?.toUpperCase() || <CypressProfileIcon />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-zinc-200 truncate max-w-[120px]
            sm:max-w-[140px]">
                {user?.username || "Anonymous"}
            </span>
          </div>
        </aside>
      )}

      {/* 2. Compact View Portrait Fallback */}
      {isRevisionSidebarOpen && (
        <Avatar className="w-7 h-7 rounded-lg border border-white/5 shrink-0 pointer-events-none">
            <AvatarImage src={user?.avatarUrl || ""} className="object-cover"/>
            <AvatarFallback className="bg-zinc-800 rounded-lg text-zinc-400 font-bold text-[10px]">
                {user?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
        </Avatar>
      )}
      {/* 3. Desk Trigger Control key*/}
      {!isRevisionSidebarOpen && ( 
         <div className="flex items-center justify-center shrink-0">
          <button
            type="button"
            onClick={toggleMenu}
            className={`w-8 h-8 hover:bg-white/5 text-zinc-400 hover:text-white flex
              items-center justify-center rounded-lg transition-colors cursor-pointer
              outline-none focus:outline-none`}
          >
            <Settings 
              size={16}
              className={isOpen ? "rotate-45 transition-transform" : "transition-transform"}
            />
          </button>
        </div>
      )}

      {/* 4. Contextual Dropup Menu Layout Container */}
      {isOpen && (
        <div 
          className={`absolute bottom-[calc(100%+10px)] bg-[#18181b] border border-white/10
            p-1.5 rounded-xl shadow-xl z-50 flex flex-col space-y-0.5 animate-in fade-in slide-in-from-bottom-2
            duration-150 ${isRevisionSidebarOpen ? "left-0 min-w-[140px]" : "left-0 right-0 w-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Profile/Account Action Row */}
          <SettingsPage>
            <div
              className="w-full hover:bg-white/[0.06] text-zinc-300 hover:text-white
                px-3 py-2.5 rounded-lg flex items-center gap-x-2.5 text-xs font-medium
                transition-colors select-none cursor-pointer"
            >
              <User2 size={14} className="text-zinc-400 shrink-0"/>
              <span>Profile</span>
            </div>
          </SettingsPage>

          {/* Authentication Termination Action Row */}
          <LogoutButton>
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full hover:bg-red-500/10 text-zinc-300 hover:text-red-400
                px-3 py-2.5 rounded-lg flex items-center gap-x-2.5 text-xs font-medium
                transition-colors select-none cursor-pointer">
                  <LogOut size={14} className="text-zinc-400 group-hover:text-red-400 shrink-0"/>
                  <span>Logout</span>
            </div>
          </LogoutButton>
        </div>
      )}
    </article>
  )
}

export default UserCard
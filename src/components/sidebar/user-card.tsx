"use client"
import React, { useEffect, useRef, useState} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CypressProfileIcon from "../icons/CypressProfileIcon";
import { useSession } from "next-auth/react";
import LogoutButton from "../global/logout-button";
import { LogOut, Settings, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/context/ModalProvider";
import SettingsPage from "../settings/settings";
const UserCard = () => {
    const [ isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession()
    const router = useRouter()
    const user = session?.user
    const { openModal } = useModal()
    const menuRef = useRef<HTMLDivElement>(null);
    
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
        className="hidden sm:flex justify-between items-center px-4 py-2 bg-Neutrals/neutrals-12 rounded-3xl"
        >
            <aside
            className="flex justify-center items-center gap-2"
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
            </aside>
            <div className="flex items-center justify-center">
                {/* dropup */}
                <div className="relative inline-block group">
                    {/* dropbtn */}
                    <button
                    onClick={toggleMenu}
                     className="w-[40px] h-[40px] border-none hover:bg-zinc-800 rounded-lg cursor-pointer flex items-center justify-center">
                        <Settings />
                    </button>
                     {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-[45px] right-0 bg-gray-900 text-white px-0 py-1 rounded-md shadow-lg z-50 flex flex-col items-center space-y-1 min-w-[50px]">
          {/* Profile */}
    
          {/* <button
          {/* <button
            className="w-full hover:bg-zinc-800 p-2 rounded-md flex justify-center"
            onClick={() => {
              openModal(<SettingsPage />)
                // router.push(`/dashboard/profile/${user?._id}`)
            //   console.log('Navigate to profile');
              setIsOpen(false);
            }}
          >
            <User2 className="w-4 h-4" />
          </button> */}
          <SettingsPage>
                    <div 
                    className="w-full hover:bg-zinc-800 p-2 rounded-md flex justify-center"
                    >
                         <User2 className="w-4 h-4" />
                    </div>
                </SettingsPage> 
          {/* Logout */}
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
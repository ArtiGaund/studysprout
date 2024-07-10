"use client"
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CypressProfileIcon from "../icons/CypressProfileIcon";
import { useSession } from "next-auth/react";
import LogoutButton from "../global/logout-button";
import { LogOut } from "lucide-react";
import ModeToggle from "../global/mode-toggle";

const UserCard = () => {
    const { data: session } = useSession()
    const user = session?.user
    return(
        <article
        className="hidden sm:flex justify-between items-center px-4 py-2 dark:bg-Neutrals/neutrals-12 rounded-3xl"
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
                <LogoutButton>
                    <LogOut />
                </LogoutButton>
                <ModeToggle />
            </div>
        </article>
    )
}

export default UserCard
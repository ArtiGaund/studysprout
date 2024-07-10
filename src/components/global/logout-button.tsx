"use client"

import { signOut, useSession } from "next-auth/react"
import React from "react"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

interface LogoutButtonProps{
    children: React.ReactNode
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ children }) => {
    const { data: session } = useSession()
    const router = useRouter()


    const logout = () => {
        if(!session) return
        signOut()
        router.push('/sign-in')
    }
    return(
        <Button
        variant="ghost"
        size="icon"
        className="p-0"
        onClick={logout}
        >
            {children}
        </Button>
    )
}

export default LogoutButton
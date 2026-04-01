/**
 * @component LogoutButton
 * @description A specialized trigger component that handles the application's 
 * teardown sequence during user sign-out. 
 * * * Key Responsibilities:
 * - Resource Cleanup: Explicitly disconnects WebSockets to prevent memory leaks or ghost connections.
 * - Session Management: Leverages NextAuth's `signOut` with controlled redirection.
 * - UX Consistency: Uses a 'ghost' variant to blend into navigation menus while maintaining accessibility.
 */
"use client"

import { signOut, useSession } from "next-auth/react"
import React from "react"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { disconnectSocket } from "@/lib/socket/socket"

interface LogoutButtonProps{
    children: React.ReactNode
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ children }) => {
    const { data: session } = useSession()
    const router = useRouter()

    /**
     * @function logout
     * Executes a three-step teardown:
     * 1. Socket Disconnection (State Cleanup)
     * 2. NextAuth Session Invalidation
     * 3. Programmatic Routing
     */
    const logout = async () => {
        // Prevent redundant calls if no session exists
        if(!session) return;

      try {
          // 1. Manually terminate the socket connection. 
          // Crucial for real-time apps to avoid 'zombie' listeners on the client.
          disconnectSocket();
  
          // 2. Perform the NextAuth Sign-out.
          // Setting 'redirect: false' allows us to handle the routing manually 
          // via the router.push for a smoother SPA feel.
          await signOut({ redirect: false });
          
          // 3. Clear the client-side route state and return to auth gateway
          router.push('/sign-in');
      } catch (error) {
        console.error("[Logout-button] Sign-out sequence failed: ",error);
      }
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
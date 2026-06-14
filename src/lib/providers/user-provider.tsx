/**
 * @provider UserProvider
 * @description A high-level context provider that synchronizes NextAuth sessions with custom user metadata.
 * * ARCHITECTURAL STRENGTHS:
 * 1. Hybrid State Management: Simultaneously updates React Context (for local use) and Redux (for global/persistent use).
 * 2. Request Throttling: Uses a `useRef` guard (`isFetching`) to prevent redundant API calls during rapid component remounts.
 * 3. Lifecycle Routing: Automatically handles redirection logic for unauthenticated users, ensuring protected routes stay secure.
 * 4. Error Resilience: Implements a "Sign-Out on Failure" strategy for 404 errors, maintaining local state integrity if a user record is missing.
 */
'use client'

import { useToast } from "@/components/ui/use-toast";
import { User } from "@/model/user.model"
import { CLEAR_USER, SET_AUTH_LOADING, SET_USER } from "@/store/slices/userSlice";
import axios from "axios";
import { Session } from "next-auth";
import { getSession, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

// this provider provides user data and session data any time in the application
type UserContextType = {
    user: User | null;
    session: Session | null;
}

const UserContext = createContext<UserContextType>({
    user: null,
    session: null
})

export const useUser = () => {
    return useContext(UserContext)
}
interface UserProviderProps {
    children: React.ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const { data: session, status } = useSession();
    const [ user, setUser ] = useState<User | null>(null)
    const [redirect, setRedirect] = useState(false);


    const { toast } = useToast()
    const router = useRouter();
    const dispatch = useDispatch();

    // --- Performance Guards ---
    // isFetching prevents race conditions and duplicate network requests
    const isFetching = useRef(false);

    /**
     * @effect AuthSync
     * Orchestrates the handshake between the NextAuth session and the backend user record.
     */
    useEffect(() => {
        // 1. Loading State: Signal Redux that auth is pending
        if(status === "loading") {
            dispatch(SET_AUTH_LOADING());
            return;
        } //wait for session to be determined

        // 2. Unauthenticated Guard: Cleanup state and redirect to entry point
        if( status === "unauthenticated"){
            setUser(null);
            dispatch(CLEAR_USER());
            router.replace("/sign-up");
            return;
        }

        const userId = session?.user._id;
        if(!userId){
            // setRedirect(true);
            setUser(null);
            dispatch(CLEAR_USER());
            router.replace("/sign-up");
            return;
        }

        /**
         * @function getUser
         * Fetches detailed user profile data from the internal API.
         */
       const getUser =  async() => {
           
                // 1. Guard:Only proceed if we don't have user and aren't already fetching
                if(user || isFetching.current ) return;
                 try {
                    const userId = session.user._id
                    const response = await axios.get(`/api/get-user?userId=${userId}`)
                    const userData = response.data.data 
                    isFetching.current = true;
                    if(!userData){
                        toast({
                            title: "Unexpected error",
                            description: "An unexpected error happened, please try again",
                            variant: "destructive",
                        })
                        setUser(null);
                        dispatch(CLEAR_USER());
                        signOut({ callbackUrl: "/sign-up"});
                        return;
                    }
                    
                    setUser(userData)
                    if(session.user._id){
                         dispatch(SET_USER({
                        userId: session.user._id,
                        status,
                        token: session.accessToken
                        }));
                    }
                   
                } catch (error: any) {
                    console.error("Throwing error ",error.response.status);
                    if (error?.response?.status === 404) {
                        setUser(null);
                        signOut({ callbackUrl: "/sign-up"});
                        return;
                    }
                    toast({
                        title: "Error",
                        description: "Error while fetching user from the database ",
                        variant: "destructive",
                    })
                    setUser(null);
                    signOut({ callbackUrl: "/sign-in" });
                }finally{
                    isFetching.current = false;
                }
            }
        getUser();
       
    }, [
        toast,
        session,
        status,
        router,
        dispatch,
        user
    ])



    return(
        <UserContext.Provider value={{ user, session}}>
            {children}
        </UserContext.Provider>
    )
}
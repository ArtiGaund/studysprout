'use client'

import { useToast } from "@/components/ui/use-toast";
import { User } from "@/model/user.model"
import axios from "axios";
import { Session } from "next-auth";
import { getSession, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

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
    // const { data: session, status } = useSession()
    // const [ session, setSession ] = useState<Session | null>(null)
    const [redirect, setRedirect] = useState(false);


    const { toast } = useToast()
    const router = useRouter();

    useEffect(() => {

        if(status === "loading") return; //wait for session to be determined

        if(!session || !session.user){
            setRedirect(true);
            return;
        }
       const getUser =  async() => {
            // const sessionData = await getSession()
            // console.log("Session in user provider ",sessionData)
            // setSession(sessionData)

            // if(!sessionData || !sessionData.user){
            //     setRedirect(true);
            //     return;
            // }

            // if(sessionData && sessionData.user){
            //     console.log("Coming inside the if block")
                try {
                    const userId = session.user._id
                    const response = await axios.get(`/api/get-user?userId=${userId}`)
                    console.log("[User-provider] User data", response);
                    const userData = response.data.data 
                    if(!userData){
                        toast({
                            title: "Unexpected error",
                            description: "An unexpected error happened, please try again",
                            variant: "destructive",
                        })
                        setUser(null);
                        return;
                    }
                    
                    // console.log("User in user provider ",userData)
                    setUser(userData)
                    
                } catch (error: any) {
                    console.log("Throwing error ",error.response.status);
                    if (error?.response?.status === 404) {
                        console.log("Redirecting to sign-up...");
                        // Make sure router is ready, then push
                        
                        setUser(null);
                        // setRedirect(true);
                        return;
                    }
                    console.log("Error while fetching user from the database ", error)
                    toast({
                        title: "Error",
                        description: "Error while fetching user from the database ",
                        variant: "destructive",
                    })
                }
            }
        getUser()
    }, [
        toast,
        session,
        status
    ])

    useEffect(() => {
        if(redirect && window.location.pathname !== "/sign-up"){
            console.log("Redirect effect running");
            // signOut();
                        router.replace("/sign-up");
            // window.location.href = "/sign-up";
        }
    },[
        redirect,
        router
    ])
    return(
        <UserContext.Provider value={{ user, session}}>
            {children}
        </UserContext.Provider>
    )
}
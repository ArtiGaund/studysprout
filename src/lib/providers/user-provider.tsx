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
    const [redirect, setRedirect] = useState(false);


    const { toast } = useToast()
    const router = useRouter();

    useEffect(() => {

        if(status === "loading") return; //wait for session to be determined

        if( status === "unauthenticated"){
            setUser(null);
            router.replace("/sign-up");
            return;
        }
        if(!session || !session.user || !session.user._id){
            // setRedirect(true);
            setUser(null);
            router.replace("/sign-up");
            return;
        }
       const getUser =  async() => {
           
                try {
                    const userId = session.user._id
                    const response = await axios.get(`/api/get-user?userId=${userId}`)
                    const userData = response.data.data 
                    if(!userData){
                        toast({
                            title: "Unexpected error",
                            description: "An unexpected error happened, please try again",
                            variant: "destructive",
                        })
                        setUser(null);
                        signOut({ callbackUrl: "/sign-up"});
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
                        signOut({ callbackUrl: "/sign-up"});
                        return;
                    }
                    console.log("Error while fetching user from the database ", error)
                    toast({
                        title: "Error",
                        description: "Error while fetching user from the database ",
                        variant: "destructive",
                    })
                    setUser(null);
                    signOut({ callbackUrl: "/sign-in" });
                }
            }
        getUser()
    }, [
        toast,
        session,
        status,
        router
    ])



    return(
        <UserContext.Provider value={{ user, session}}>
            {children}
        </UserContext.Provider>
    )
}
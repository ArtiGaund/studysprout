'use client'

import { useToast } from "@/components/ui/use-toast";
import { User } from "@/model/user.model"
import axios from "axios";
import { Session } from "next-auth";
import { getSession, useSession } from "next-auth/react";
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
    const [ user, setUser ] = useState<User | null>(null)
    // const { data: session, status } = useSession()
    const [ session, setSession ] = useState<Session | null>(null)


    const { toast } = useToast()

    useEffect(() => {
       const getUser =  async() => {
            const sessionData = await getSession()
            // console.log("Session in user provider ",sessionData)
            setSession(sessionData)

            if(sessionData && sessionData.user){
                try {
                    const userId = sessionData.user._id
                    const response = await axios.get(`/api/get-user?userId=${userId}`)
                    if(!response.status){
                        toast({
                            title: "Unexpected error",
                            description: "An unexpected error happened, please try again",
                            variant: "destructive",
                        })
                    }
                    const userData = response.data.data
                    // console.log("User in user provider ",userData)
                    setUser(userData)
                    
                } catch (error) {
                    console.log("Error while fetching user from the database ", error)
                    toast({
                        title: "Error",
                        description: "Error while fetching user from the database ",
                        variant: "destructive",
                    })
                }
                
            }
        }
        getUser()
    }, [toast])
    return(
        <UserContext.Provider value={{ user, session}}>
            {children}
        </UserContext.Provider>
    )
}
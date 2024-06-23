"use client"

import DashboardSetup from "@/components/dashboard-setup/dashboard-setup"
import axios from "axios"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const DashboardPage = () => {
    const { data: session, status} = useSession()
    const [workspace, setWorkspace ] = useState([])
    const [ isLoading, setIsLoading ]= useState(false)
    const [ error, setError ] = useState('')

    const router = useRouter()
    
    useEffect(() => {
        const fetchUserWorkspaces = async () => {
            // console.log("Session in Darshboard ",session)
            if(!session) return
            setIsLoading(true)
            setError('')
            const userId = session.user._id
            try {
                const response = await axios.get(`/api/check-user-have-created-workspace?userId=${userId}`)
                // console.log("Response ",response)
                setWorkspace(response.data)
            } catch (error) {
                console.log('Error while fetching user workspaces ',error)
                setError('Failed to fetch user workspace')
            }finally{
                setIsLoading(false)
            }
        }
        fetchUserWorkspaces()
    }, [session])

    // console.log("workspace ",workspace)
    // console.log("workspace length ", workspace.length)
   if(!workspace.length){
       return(
        <DashboardSetup />
       )
   }
//      if user have already created the workspace they can move directly to the workspace
    // router.push(`/dashboard/${workspace[0]._id}`)
}

export default DashboardPage
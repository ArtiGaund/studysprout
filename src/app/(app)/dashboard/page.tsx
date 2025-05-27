"use client"

import DashboardSetup from "@/components/dashboard-setup/dashboard-setup"
import { WorkSpace } from "@/model/workspace.model"
import axios from "axios"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const DashboardPage = () => {
    const { data: session, status} = useSession()
    const [workspace, setWorkspace ] = useState<WorkSpace[]>([])
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
                const result = response.data.data
                if (Array.isArray(result)) {
                setWorkspace(result)
            } else if (result && typeof result === 'object') {
                // Wrap single object in array
                setWorkspace([result])
            } else {
                setWorkspace([])
            }
            } catch (error) {
                console.log('Error while fetching user workspaces ',error)
                setError('Failed to fetch user workspace')
            }finally{
                setIsLoading(false)
            }
        }
        fetchUserWorkspaces()
    }, [session])

    //      if user have already created the workspace they can move directly to the workspace
    useEffect(() => {
        if(workspace.length >0){
            router.push(`/dashboard/${workspace[0]._id}`)
        }
    },[workspace, router])

    if(isLoading || status === "loading") return <div>Loading...</div>
    console.log("workspace ",workspace)
    console.log("workspace length ", workspace.length)
   if(!workspace.length){
       return(
        <DashboardSetup />
       )
   }

   return <div>Redirecting to your workspace...</div>

}

export default DashboardPage
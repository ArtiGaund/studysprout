"use client"

import DashboardSetup from "@/components/dashboard-setup/dashboard-setup"
import { useWorkspace } from "@/hooks/useWorkspace"
import { WorkSpace } from "@/model/workspace.model"
import axios from "axios"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const DashboardPage = () => {
    // const { data: session, status} = useSession()
    // const [workspace, setWorkspace ] = useState<WorkSpace[]>([])
    // const [ isLoading, setIsLoading ]= useState(false)
    // const [ error, setError ] = useState('')


    
    const { workspaces, isLoadingWorkspaces, workspaceError, hasWorkspaces } = useWorkspace();
    const router = useRouter()


    // 1. Redirection Logic (triggered by useEffect once data is ready)
   useEffect(() => {
        // If workspaces are loaded and there's at least one, redirect to the first one
        // This useEffect will run when `workspaces` (from Redux) changes.
        if (hasWorkspaces && workspaces.length > 0 && workspaces[0]?._id) {
            router.push(`/dashboard/${workspaces[0]._id}`);
        }
    }, [hasWorkspaces, workspaces, router]); 

    
    // 2. Initial Loading State (session or data)
    if (isLoadingWorkspaces) {
        return <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-700">Loading your dashboard...</div>;
    }

    // 3. Error State
    if (workspaceError) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-red-600 space-y-4">
                <p className="text-xl font-bold">Error Loading Dashboard</p>
                <p className="text-base">{workspaceError}</p>
                <p className="text-sm text-gray-500">Please try refreshing the page or contact support.</p>
            </div>
        );
    }


    
     // 4. No Workspaces State
    if (!hasWorkspaces) {
        return <DashboardSetup />;
    }
    // useEffect(() => {
    //     const fetchUserWorkspaces = async () => {
    //         // console.log("Session in Darshboard ",session)
    //         if(!session) return
    //         setIsLoading(true)
    //         setError('')
    //         const userId = session.user._id
    //         try {
    //             const response = await axios.get(`/api/check-user-have-created-workspace?userId=${userId}`)
    //             // console.log("Response ",response)
    //             const result = response.data.data
    //             if (Array.isArray(result)) {
    //             setWorkspace(result)
    //         } else if (result && typeof result === 'object') {
    //             // Wrap single object in array
    //             setWorkspace([result])
    //         } else {
    //             setWorkspace([])
    //         }
    //         } catch (error) {
    //             console.log('Error while fetching user workspaces ',error)
    //             setError('Failed to fetch user workspace')
    //         }finally{
    //             setIsLoading(false)
    //         }
    //     }
    //     fetchUserWorkspaces()
    // }, [session])

    //      if user have already created the workspace they can move directly to the workspace
    // useEffect(() => {
    //     if(workspace.length >0){
    //         router.push(`/dashboard/${workspace[0]._id}`)
    //     }
    // },[workspace, router])

    // if(isLoading || status === "loading") return <div>Loading...</div>
//     console.log("workspace ",workspace)
//     console.log("workspace length ", workspace.length)
//    if(!workspace.length){
//        return(
//         <DashboardSetup />
//        )
//    }

 // 5. Default/Pending Redirection Message
   return <div className="flex justify-center items-center h-screen text-gray-600">Redirecting to your workspace...</div>;

}

export default DashboardPage
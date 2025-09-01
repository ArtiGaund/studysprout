"use client"

import DashboardSetup from "@/components/dashboard-setup/dashboard-setup"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const DashboardPage = () => {
    
    const {
         workspaces,
          isLoadingWorkspaces, 
          workspaceError, 
          hasWorkspaces,
          getWorkspaces,
        } = useWorkspace();
    const router = useRouter()

    const { status } = useSession();

     useEffect(() => {
        if(status !== "authenticated") return;
        const fetchAndRedirect = async () => {
            console.log("[DashboardPage] Initial workspace fetch.");
            const response = await getWorkspaces();
            if (!response.success) {
                console.log(`[DashboardPage] Failed to fetch workspaces: `, response.error);
            }
        }
        fetchAndRedirect();
        },[
            status
        ])
    
    // 1. Redirection Logic (triggered by useEffect once data is ready)
   useEffect(() => {
        // If workspaces are loaded and there's at least one, redirect to the first one
        // This useEffect will run when `workspaces` (from Redux) changes.
        console.log(`[DashboardPage] workspaces:`, workspaces);
        console.log(`[DashboardPage] isLoadingWorkspaces:`, isLoadingWorkspaces);
        console.log(`[DashboardPage] hasWorkspaces:`, hasWorkspaces);
        if (!isLoadingWorkspaces && hasWorkspaces && workspaces.length > 0 && workspaces[0]?._id) {
            console.log(`[DashboardPage] Redirecting to workspace: ${workspaces[0]._id}`);
            router.replace(`/dashboard/${workspaces[0]._id}`);
        }
    }, [
        hasWorkspaces,
         workspaces, 
         router,
         isLoadingWorkspaces
        ]); 

       

    
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
   

 // 5. Default/Pending Redirection Message
   return <div className="flex justify-center items-center h-screen text-gray-600">Redirecting to your workspace...</div>;

}

export default DashboardPage
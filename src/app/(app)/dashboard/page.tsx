/**
 * DASHBOARD LANDING PAGE (Index)
 * ------------------------------
 * Role: Primary entry point for authenticated users.
 * * Logic Flow:
 * 1. Checks Auth Status: Waits for Redux/Session to hydrate.
 * 2. Fetches Workspace: Triggers 'useWorkspace' to pull user data.
 * 3. Smart Redirection:
 * - If no workspace exist: Shows <DashboardSetup /> (onboarding).
 * - If workspace exist: Redirect to the 'Last Active' workspace from LocalStorage
 * or defaults to the first available workspace 
 */
"use client"

import DashboardSetup from "@/components/dashboard-setup/dashboard-setup"
import { useWorkspace } from "@/hooks/useWorkspace"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useUser } from "@/lib/providers/user-provider"
import { clearLastWorkspace, getLastWorkspace } from "@/lib/local-storage-workspace"
import { useSelector } from "react-redux"
import { selectAuthStatus, selectUserId } from "@/store/selectors/userSelector"

const DashboardPage = () => {
    const { user } = useUser();
    
    // Global State Selectors
    const userId = useSelector(selectUserId);
    const authStatus = useSelector(selectAuthStatus);

    // Workspace Management Hook
    const {
         workspaces,
          isLoadingWorkspaces, 
          workspaceError, 
          hasWorkspaces,
          getWorkspaces,
        } = useWorkspace();

    const router = useRouter();
   
    /** *EFFECT: Workspace Synchronization
     * Fetch the workspace list once the user is confirmed as unauthenticated.
     */
     useEffect(() => {
         if(authStatus === "loading" ) return;
        if(authStatus !== "authenticated" || !userId){
            return;
        }
        
        const fetchAndRedirect = async () => {
            const response = await getWorkspaces();
            if (!response.success) {
                console.warn(`[DashboardPage] Failed to fetch workspaces: `, response.error);
            }
        }
        fetchAndRedirect();
        },[
            authStatus,
            userId,
        ])
    
        /**
         * EFFECT: Smart Redirection logic
         * After data is loaded, determine which specific workspace URL to push the user to.
         */
        useEffect(() => {
            if(authStatus !== "authenticated" || !userId) return;
            if(isLoadingWorkspaces) return;
            if(!hasWorkspaces) return;

            // Retrieve persistence: Try to find where the user left off
            const lastWorkspaceId = getLastWorkspace(userId);

            const validWorkspace = workspaces.find(
                workspace => workspace._id === lastWorkspaceId
            );

            // Cleanup: If the saved workspace ID no longer exists, clear it. 
            if(!validWorkspace && lastWorkspaceId){
                clearLastWorkspace(userId);
            }

            // Fallback: Use last valid workspace OR the first one in the list
            const workspaceToOpen = validWorkspace || workspaces[0];
            if(workspaceToOpen){
                router.replace(`/dashboard/${workspaceToOpen._id}`);
            }

        }, [
            workspaces,
            authStatus,
            isLoadingWorkspaces,
            hasWorkspaces,
            userId,
            router
        ])
       

        //  --- RENDER STATES (Conditional UI) ---

        // 1. Authentication check
        if (authStatus === "loading" || (authStatus === "authenticated" && user === null)) {
            return <div>Loading...</div>;
        }

        // 2. Account Consistency Check
        if (authStatus === "authenticated" && !user) {
            return (
                <div className="flex flex-col justify-center items-center h-screen text-red-600 space-y-4">
                    <p className="text-xl font-bold">Account Not Found</p>
                    <p className="text-base">Your account was not found in our database.</p>
                    <p className="text-sm text-gray-500">Please contact support or try signing up again.</p>
                </div>
            );
        }
    
    // 3. Data Loading State
    if (isLoadingWorkspaces) {
        return <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-700">Loading your dashboard...</div>;
    }

    // 4. API Error Handling
    if (workspaceError) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-red-600 space-y-4">
                <p className="text-xl font-bold">Error Loading Dashboard</p>
                <p className="text-base">{workspaceError}</p>
                <p className="text-sm text-gray-500">Please try refreshing the page or contact support.</p>
            </div>
        );
    }

    // 5. Onboarding / Empty State
    if (!hasWorkspaces) {
        return <DashboardSetup />;
    }
   

    // 6. Redirection Bridge (Temporary fallback while router.replace executes)
   return( <div className="flex justify-center items-center h-screen text-gray-600">
    Redirecting to your workspace...
    </div>);

}

export default DashboardPage
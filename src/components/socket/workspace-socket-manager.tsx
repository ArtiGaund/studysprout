/**
 * @component WorkspaceSocketManager
 * @description A headless side-effect component that synchronizes the application's 
 * real-time socket connection with the current navigation context.
 * * * Logic Flow:
 * 1. Extracts `workspaceId` from the URL via Next.js params.
 * 2. Monitors Redux `authStatus` to ensure socket connection only occurs for authenticated users.
 * 3. Triggers the `useWorkspaceSocket` hook to handle room joining/leaving logic.
 */
"use client";

import { useWorkspaceSocket } from "@/hooks/socket/useWorkspaceSocket";
import { selectAuthStatus } from "@/store/selectors/userSelector";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";

export const WorkspaceSocketManager = () => {
    const params = useParams();
    const authStatus = useSelector(selectAuthStatus);

    const workspaceId = params?.workspaceId as string;

    /**
     * Conditional hook execution:
     * Prevents socket initialization if the user is unauthenticated 
     * or if no workspaceId is present in the route.
     */
    useWorkspaceSocket(authStatus === "authenticated" ? workspaceId : null);

    return null;
}
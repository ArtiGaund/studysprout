/**
 * A lightweight global listener hook - listens regardless of which workspace the users currently
 * has open, since workspace:joined fires on the PERSONAL room, not a specific workspace room.
 */

"use client";

import { useToast } from "@/components/ui/use-toast";
import { useSocket } from "@/lib/providers/socket-provider";
import { useAppDispatch } from "@/store/hooks";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { ADD_WORKSPACE, DELETE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export function useGlobalSocketEvents(){
    const { socket, isConnected } = useSocket();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const router = useRouter();
    const currentWorkspace = useSelector(selectCurrentWorkspace);

    useEffect(() => {
        if(!socket || !isConnected) return;

        const handleWorkspaceJoined = ({ workspace }: { workspace: any }) => {
            dispatch(ADD_WORKSPACE(workspace));
            toast({
                title: `You've joined "${workspace.title}"`,
                description: "The workspace is now available in your sidebar",
            });
        };

        const handleWorkspaceLeft = ({ workspaceId }: { workspaceId : string}) => {
            dispatch(DELETE_WORKSPACE(workspaceId));

            if(currentWorkspace?._id === workspaceId){
                toast({
                    title: "You've been removed from this workspace",
                    variant: "destructive",
                });
                router.push("/dashboard");
            }else{
                toast({
                    title: "You've been removed from a workspace",
                });
            }
        }

        socket.off("workspace:joined");
        socket.off("workspace:left");
        socket.on("workspace:joined", handleWorkspaceJoined);
        socket.on("workspace:left", handleWorkspaceLeft);

        return () => {
            socket.off("workspace:joined", handleWorkspaceJoined);
            socket.off("workspace:left", handleWorkspaceLeft);
        };
    },[
        socket,
        isConnected,
        dispatch,
        toast,
        currentWorkspace?._id,
        router,
    ]);
}
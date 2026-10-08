/**
 * @component WorkspaceMembersAvatarGroup
 * @description A sophisticated avatar stack that provides a snapshot of workspace membership.
 * * Technical Highlights:
 * - Smart Ordering: Uses `useMemo` to prioritize the Current User and Owner at the 
 * front of the stack, improving the UX by showing relevant entities first.
 * - Overflow Handling: Implements a `MAX_VISIBLE` constant to gracefully handle 
 * large teams with a "+N" counter.
 * - Adaptive Rendering: Switches between `AvatarImage` and `AvatarFallback` (initials) 
 * based on the available user metadata.
 * - Loading States: Includes an `animate-pulse` skeleton loader to prevent layout shift 
 * during Redux state hydration.
 */
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAppSelector } from "@/store/hooks";
import { selectWorkspaceMembers, selectWorkspaceMembersLoading, selectWorkspaceOwner } from "@/store/selectors/workspaceMembersSelector";
import {  useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUserId } from "@/store/selectors/userSelector";
import { Plus } from "lucide-react";

const MAX_VISIBLE = 3;
const WorkspaceMembersAvatarGroup = ({
    workspaceId,
    editable = false,
} : {
    workspaceId: string;
    editable?: boolean;
}) => {
    const owner = useAppSelector(state => selectWorkspaceOwner(state, workspaceId));
    const members = useAppSelector(state =>selectWorkspaceMembers(state, workspaceId));
    const membersLoading = useAppSelector( state =>
        selectWorkspaceMembersLoading(state, workspaceId)
    );
    const currentUserId = useSelector(selectUserId);
    const currentUser = members.find( member => member._id === currentUserId);
    const isOwner = owner?._id === currentUserId;

    const orderedUsers = useMemo(() => {
        const result = [];
        
        // owner viewing
        if(isOwner){
            result.push(owner);
        }else{
            // members viewing
            if(currentUser){ 
                result.push(currentUser);
            }
            if(owner){
                result.push(owner);
            }
        }

        // add the remaining members
        result.push(
            ...members.filter(
                member => 
                    member && 
                member._id !== owner?._id &&
                member._id !== currentUserId
            )
        );

        return result;
    }, [
        owner,
        members,
        currentUser,
        isOwner,
        currentUserId
    ])

    const totalUsers = ( owner ? 1 : 0) + members.length;
    const visibleUsers = orderedUsers.slice(0, MAX_VISIBLE);
    const remainingCount = totalUsers - visibleUsers.length;

    if(membersLoading){
        return(
            <div className="flex items-center -space-x-2 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-purple-950/40 border border-white/10"/>
                <div className="w-7 h-7 rounded-full bg-purple-950/40 border border-white/10"/>
                <div className="w-7 h-7 rounded-full bg-purple-950/40 border border-white/10"/>
            </div>
        )
    }
    return (
        <div className="flex items-center select-none">
            <div className="flex items-center -space-x-2.5 isolation">
                {visibleUsers.map(user => (
                    <Avatar
                        key={user._id}
                        className="w-7 h-7 rounded-full border-2 border-[#0A0507] bg-purple-950/60
                        transition-transform duration-200 hover:scale-105 hover:z-30 relative"
                    >   
                        {user?.avatarUrl && (
                            <AvatarImage 
                                src={user.avatarUrl}
                                className="object-cover w-full h-full rounded-full"
                            />
                        )}
                        <AvatarFallback className="bg-purple-950 text-purple-200 font-mono text-[10px]
                        font-bold w-full h-full flex items-center justify-center rounded-full">
                            {user?.avatarInitials ?? user?.username?.[0].toUpperCase() ?? "U"}
                        </AvatarFallback>
                    </Avatar>
                ))}

                {/* Dynamic Action Trigger Block */}
                {remainingCount > 0 ? (
                    <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-[#110A10] border-2 border-[#0A0507]
                        text-purple-300 text-center flex items-center justify-center z-40
                        relative hover:border-purple-500/40 transition-colors"
                    >
                        <span className="font-mono text-[9px] font-bold tracking-tighter">
                            +{remainingCount}
                        </span>
                    </button>
                ) : (
                    // Additional Track: Only render the add button icon if user has administrative rights
                    editable && (
                        <div
                            className="w-7 h-7 rounded-full bg-[#110A10] border-2 
                            border-[#0A0507] hover:border-purple-500/50 text-zinc-400
                             hover:text-purple-200 transition-all flex items-center 
                             justify-center z-40 relative"
                        >
                            <Plus size={10} strokeWidth={3}/>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

export default WorkspaceMembersAvatarGroup;
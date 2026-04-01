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

const MAX_VISIBLE = 3;
const WorkspaceMembersAvatarGroup = ({
    workspaceId
} : {
    workspaceId: string
}) => {
    const owner = useAppSelector( state => 
        selectWorkspaceOwner(state, workspaceId) 
    )

    const members = useAppSelector( state =>
        selectWorkspaceMembers(state, workspaceId)
    )
    const membersLoading = useAppSelector( state =>
        selectWorkspaceMembersLoading(state, workspaceId)
    )

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

   if(!owner){
    return (
        <div className="flex -space-x-2">
            <Avatar>
                <AvatarFallback>
                    +
                </AvatarFallback>
            </Avatar>
        </div>
    )
   }
    return (
        <div className="flex flex-row flex-wrap items-center">
            <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2">
               {membersLoading ? 
               ( <div className="w-8 h-8 rounded-full bg-muted/50 animate-pulse"/>) 
               : (
                visibleUsers.map( user => (
                    <Avatar 
                    key={user?._id}
                    className="w-8 h-8"
                    >
                        { user?.avatarType === "image" && user.avatarUrl ? 
                        (
                            <AvatarImage 
                            src={user.avatarUrl}
                            className="object-cover"
                            />
                        ) : null}
                        <AvatarFallback>
                            {user?.avatarInitials ?? 
                            user?.username?.[0]?.toUpperCase()
                            }
                        </AvatarFallback>
                    </Avatar>
                ))
               )}

               {/* Always show + */}
               <Avatar className="w-8 h-8">
                    <AvatarFallback>
                        {remainingCount > 0 ? `+${remainingCount}` : "+"}
                    </AvatarFallback>
               </Avatar>
           </div>
        </div>
    )
}

export default WorkspaceMembersAvatarGroup;
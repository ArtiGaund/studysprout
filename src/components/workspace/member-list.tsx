/**
 * @component MemberList
 * @description Renders a detailed list of workspace participants, distinguishing between 
 * the Owner and regular Members. 
 * * Key Features:
 * - Real-time Presence: Integrates with Redux `workspacePresence` to show live online/offline status.
 * - Permission Gates: Conditionality renders "Remove" actions only if the viewing user `isOwner`.
 * - Visual Hierarchy: Uses distinct badges and background styling to highlight the Workspace Owner.
 */
'use client';

import { WorkspaceMember } from "@/types/workspace-member.type"
import { Button } from "../ui/button";
import { useAppSelector } from "@/store/hooks";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Crown, Loader2, LogOut, UserMinus } from "lucide-react";
import { Badge } from "../ui/badge";

interface MemberListProps {
    workspaceId: string;
    owner: WorkspaceMember | null;
    members: WorkspaceMember[];
    isOwner: boolean;
    currentUserId: string | null | undefined;
    onRemove: (userId: string) => Promise<void>;
}

const MemberList = ({
    workspaceId,
    owner,
    members,
    isOwner,
    onRemove,
    currentUserId,
}: MemberListProps) => {

    const [ removingId, setRemovingId ] = useState<string | null>(null);

    const handleRemove = async (userId: string) => {
        setRemovingId(userId);
        try {
            await onRemove(userId);
        } finally{
            setRemovingId(null);
        }
    };

    const renderAvatar = (user: WorkspaceMember) => (
        <Avatar className="h-8 w-8">
            {user.avatarType === "image" && user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.username}/>
            ): null}
            <AvatarFallback className="text-xs bg-zinc-700">
                {user.avatarInitials ?? user.username?.slice(0,2).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    )

    const onlineUsers = useAppSelector(
        state => state.workspacePresence[workspaceId] ?? []
    );

    return(
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
               Workspace Members
            </h4>

            {/* Owner */}
            {owner && (
                <div className="flex items-center justify-between px-2 py-2 rounded-md
                hover:bg-zinc-800/40">
                    <div className="flex items-center gap-3">
                        {renderAvatar(owner)}
                        <div>
                            <p className="text-sm font-medium leading-none">
                                {owner.username}
                                {owner._id === currentUserId && (
                                    <span className="ml-1 text-xs text-muted-foreground">
                                        (you)
                                    </span>
                                )}
                            </p>
                            {owner.email && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {owner.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-yellow-500"/>
                        <Badge variant="secondary" className="text-xs h-5">
                            Owner
                        </Badge>
                    </div>
                </div>
            )}
           
           {/* Members */}
            {members.length > 0 && members.map((member) => {
                const isSelf = member._id === currentUserId;
                const isRemoving = removingId === member._id;
                return (
                    <div 
                        key={member._id}
                        className="flex items-center justify-between rounded-md px-2 py-2
                        hover:bg-zinc-800/40"
                    >
                        <div className="flex items-center gap-3">
                            {renderAvatar(member)}
                            <div>
                                <p className="text-sm font-medium leading-none">
                                    {member.username}
                                    {isSelf && (
                                        <span className="ml-1 text-xs text-muted-foreground">
                                            (you)
                                        </span>
                                    )}
                                </p>
                                {member.email && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {member.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {member.role && (
                                <Badge variant="outline" className="text-xs h-5 capitalize">
                                    {member.role}
                                </Badge>
                            )}

                            {isRemoving ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground"/>
                            ) : (
                                <>
                                    {/* Owner sees "Remove" on every member row */}
                                    {isOwner && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-red-400 hover:text-red-500
                                            hover:bg-red-500/10"
                                            onClick={() => handleRemove(member._id)}
                                        >
                                            <UserMinus className="w-3.5 h-3.5 mr-1"/>
                                            Remove
                                        </Button>
                                    )}

                                    {/* Non-owner members see "Leave" only on their OWN row */}
                                    {!isOwner && isSelf && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-red-400 hover:text-red-500
                                            hover:bg-red-500/10"
                                            onClick={() => handleRemove(member._id)}
                                        >
                                            <LogOut className="w-3.5 h-3.5 mr-1"/>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )
            })}

            {members.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1">
                    No members yet. Invite someone to collaborator
                </p>
            )}
        </div>
    )
}

export default MemberList;
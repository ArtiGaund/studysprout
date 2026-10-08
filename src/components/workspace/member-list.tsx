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
        <Avatar className="h-8 w-8 border border-white/10">
            {user.avatarType === "image" && user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.username}/>
            ): null}
            <AvatarFallback className="text-xs font-mono font-bold bg-purple-950/60
             text-purple-200">
                {user.avatarInitials ?? user.username?.slice(0,2).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    )

    const onlineUsers = useAppSelector(
        state => state.workspacePresence[workspaceId] ?? []
    );

    return(
        <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold text-purple-300 uppercase 
            tracking-wider">
               Workspace Members
            </h4>

            {/* Owner */}
            {owner && (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg
                bg-purple-950/20 border border-purple-500/20">
                    <div className="flex items-center gap-3 min-w-0">
                        {renderAvatar(owner)}
                        <div>
                            <p className="text-xs font-medium text-zinc-100 truncate flex 
                            items-center gap-1e">
                                {owner.username}
                                {owner._id === currentUserId && (
                                    <span className="ml-1 text-[10px] font-mono text-purple-400">
                                        (you)
                                    </span>
                                )}
                            </p>
                            {owner.email && (
                                <p className="text-[11px] font-mono text-zinc-500 truncate 
                                mt-0.5">
                                    {owner.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <Crown className="w-3.5 h-3.5 text-amber-400"/>
                        <Badge 
                            variant="secondary" 
                            className="text-[10px] font-mono h-5 bg-amber-500/10
                             text-amber-300 border border-amber-500/20"
                        >
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
                        className="flex items-center justify-between rounded-lg px-3 py-2.5
                        hover:bg-white/[0.03] transition-colors border border-transparent
                         hover:border-white/5"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {renderAvatar(member)}
                            <div>
                                <p className="text-xs text-zinc-200 truncate flex items-center 
                                gap-1">
                                    {member.username}
                                    {isSelf && (
                                        <span className="ml-1 text-[10px] font-mono
                                         text-purple-400">
                                            (you)
                                        </span>
                                    )}
                                </p>
                                {member.email && (
                                    <p className="text-[11px] font-mono text-zinc-500 truncate 
                                    mt-0.5">
                                        {member.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            {member.role && (
                                <Badge 
                                    variant="outline" 
                                    className="text-[10px] font-mono h-5 capitalize
                                     bg-white/[0.02] text-zinc-400 border-white/10"
                                >
                                    {member.role}
                                </Badge>
                            )}

                            {isRemoving ? (
                                <Loader2 className="w-4 h-4 animate-spin text-purple-400"/>
                            ) : (
                                <>
                                    {/* Owner sees "Remove" on every member row */}
                                    {isOwner && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2.5 text-xs font-mono text-red-400 hover:text-red-500
                                            hover:bg-red-950/30 border border-red-500/200"
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
                                            className="h-7 px-2.5 text-xs font-mono text-red-400 hover:text-red-500
                                            hover:bg-red-950/30 border border-red-500/20"
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
                <p className="text-xs font-mono text-zinc-500 px-1 py-1">
                    No members yet. Invite someone to collaborator
                </p>
            )}
        </div>
    )
}

export default MemberList;
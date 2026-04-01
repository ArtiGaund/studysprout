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

const MemberList = ({
    workspaceId,
    owner,
    members,
    isOwner,
    onRemove,
}: {
    workspaceId: string,
    owner: WorkspaceMember | null,
    members: WorkspaceMember[],
    isOwner: boolean,
    onRemove: (userId: string) => void
}) => {

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
                <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                        {/* Online dot */}
                        <span 
                        className={`h-2 w-2 rounded-full ${
                            onlineUsers.includes(owner._id)
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                        />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{owner.username}</span>
                        <span className="text-xs text-muted-foreground">{owner.email}</span>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Owner
                    </span>
                </div>
                </div>
            )}
           
           {/* Members */}
           {members.length > 0 && (
            <div className="space-y-2">
                {members.map((member) => (
                    <div
                    key={member._id}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/40"
                    >
                        <div className="flex items-center gap-2">
                            {/* online / offline dot */}
                            <span 
                            className={`h-2 w-2 rounded-full ${
                                onlineUsers.includes(member._id)
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                            />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{member.username}</span>
                            <span className="text-xs text-muted-foreground">{member.email}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Member
                        </span>
                        </div>
                        {/* Remove button - OWNER Only */}
                        {isOwner && (
                            <Button 
                            variant="destructive"
                            size="sm"
                            onClick={() => onRemove(member._id)}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    
                ))}

                {members.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                        No members added yet.
                    </p>
                )}
            </div>
           )}
        </div>
    )
}

export default MemberList;
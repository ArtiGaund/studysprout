/**
 * @component WorkspaceMembersManager
 * @description A comprehensive administrative interface for managing workspace access.
 * * Key Functionalities:
 * - Role-Based Access Control (RBAC): Restricts "Add Member" and "Search" features to the workspace owner.
 * - Debounced Search: Integrated via `useWorkspaceMembersSearch` for high-performance user discovery.
 * - Membership Validation: Prevents redundant invitations by checking against current members and owners.
 * - Loading States: Granular loading indicators for individual row actions (Add/Remove) and global search.
 */
'use client';

import { useWorkspaceMembersSearch } from "@/hooks/workspace-members/useWorkspaceMembersSearch";
import {
     Command, 
     CommandEmpty, 
     CommandGroup, 
     CommandInput, 
     CommandItem, 
     CommandList 
} from "../ui/command";
import { UserSearch } from "@/types/user-search.type";
import { Button } from "../ui/button";
import { useState } from "react";
import { useWorkspaceMembers } from "@/hooks/workspace-members/useWorkspaceMembers";
import MemberList from "./member-list";
import { Separator } from "../ui/separator";
import { Check, Loader2 } from "lucide-react";

// --- Redux Integration ---
import { 
    selectWorkspaceMembers, 
    selectWorkspaceMembersLoading, 
    selectWorkspaceOwner 
} from "@/store/selectors/workspaceMembersSelector";
import { useAppSelector } from "@/store/hooks";
import { useSelector } from "react-redux";
import { selectUserId } from "@/store/selectors/userSelector";
import { useWorkspaceInvitations } from "@/hooks/workspace-members/useWorkspaceInvitations";
import { Badge } from "../ui/badge";


const WorkspaceMembersManager = ({ workspaceId }: { workspaceId: string}) => {
    // --- AUTHENTICATION & IDENTITY ---
    const currentUserId = useSelector(selectUserId);
    const [ removeUserId, setRemoveUserId ] = useState<string | null>(null);

    // --- CUSTOM HOOKS (Business Logic Layer) ---
    const {
        query,
        searchUsers,
        results,
        loading
    } = useWorkspaceMembersSearch();

    const {
        // addMember,
        removeMember
    } = useWorkspaceMembers(workspaceId)

    const {
        sendInvite,
        sendingInviteId,
        invitedUserIds,
    } = useWorkspaceInvitations(workspaceId);

    // --- MEMOIZED SELECTORS ---
   const owner = useAppSelector( state => 
        selectWorkspaceOwner(state, workspaceId)
   );
    const members = useAppSelector( state => 
    selectWorkspaceMembers(state, workspaceId)
   );
   const membersLoading = useAppSelector( state => 
    selectWorkspaceMembersLoading(state, workspaceId)
   );

   // --- PERMISSION CHECKS ---
   const isOwner = owner?._id === currentUserId;

   /**
     * @function isAlreadyMember
     * Prevents duplicate membership logic. Checks if a searched user is 
     * either the owner or already present in the members array.
     */
    const isAlreadyMember = (userId: string) => 
        userId === owner?._id || 
        members.some( member => member._id === userId);

    /* Prevent duplicate invites in the same session */
    const isAlreadyInvited = (userId: string) => invitedUserIds.has(userId);

    const handleInviteUser = async(user: UserSearch) => {
        try {
            await sendInvite(user._id);
        } catch (error) {
            console.error(
                "[WorkspaceMembersManager] handleInviteUser, Failed to send invite: ",
                error
            );
        }
    };

    const handleRemoveMember = async (userId: string) => {
        setRemoveUserId(userId);
        try {
            await removeMember(userId);
        } catch (error) {
            console.error("[workspace-members-manager] Failed to remove member: ",error);
        }finally{
            setRemoveUserId(null);
        }
    }
    
    return (
        <div className="px-6 pb-6 overflow-y-auto max-h-[65vh] scrollbar-thin 
        scrollbar-thumb-purple-900/30">
            <Separator className="my-4 bg-white/10"/>
            {/* 1. MEMBERSHIP VISUALIZATION SECTION */}
            <div className="space-y-4">
                {membersLoading ? (
                    <div className="flex items-center justify-center py-6 text-xs font-mono
                     text-zinc-500 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400"/>
                        Loading members...
                    </div>
                ) : (
                    <MemberList 
                    workspaceId={workspaceId}
                    owner={owner}
                    members={members}
                    isOwner={isOwner}
                    currentUserId={currentUserId}
                    onRemove={handleRemoveMember}
                    />
                )
            }
          </div>

          {/* 2. ADMINISTRATIVE ACTIONS SECTION (Owner Only) */}
         {isOwner && ( 
            <>
                <Separator className="my-5 bg-white/10"/>
                <div className="space-y-3">
                    <h4 className="text-xs font-mono font-semibold text-purple-300 uppercase 
                    tracking-wider">
                        Invite Members
                    </h4>  
                    <Command className="bg-[#110A10] border border-white/10 rounded-xl 
                    overflow-hidden">
                        <CommandInput 
                            placeholder="Search by username or email..."
                            onValueChange={searchUsers}
                            className="text-xs font-mono placeholder:text-zinc-500 border-none 
                            focus:ring-0"
                        />

                        <CommandList className="max-h-48 overflow-y-auto p-1.5 scrollbar-thin 
                        scrollbar-thumb-purple-900/30">
                            {loading &&
                                <div className="px-3 py-3 text-xs font-mono text-zinc-500 flex
                                 items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin 
                                    text-purple-400"/>
                                    Searching...
                                </div>
                            }
                            {!loading && results.length === 0 && query.trim().length >=2 && (
                                <CommandEmpty className="py-4 text-center text-xs font-mono
                                 text-zinc-500">
                                    No user found.
                                </CommandEmpty>
                            )}
                            {!loading && results.length > 0 && (
                                <CommandGroup>
                                    <div className="space-y-1">
                                        {results.map((user) => {
                                            const alreadyMember = isAlreadyMember(user._id);
                                            const alreadyInvited = isAlreadyInvited(user._id);
                                            const isSending = sendingInviteId === user._id;
                                            return(
                                                <CommandItem
                                                key={user._id}
                                                value={`${user.username} ${user.email}`}
                                                className="
                                                    w-full
                                                    bg-transparent
                                                    rounded-lg
                                                    p-2.5 flex 
                                                    items-center 
                                                    justify-between 
                                                    data-[selected=true]:bg-purple-950/40 
                                                    transition-colors
                                                "
                                                >
                                                    <div className="flex w-full items-center 
                                                    justify-between text-sm">
                                                        <div className="flex flex-col min-w-0 
                                                        pr-2">
                                                            <span className="text-xs font-medium
                                                             text-zinc-100 truncate">
                                                                {user.username}
                                                            </span>
                                                            <span className="text-[11px] 
                                                            font-mono text-zinc-500 truncate">
                                                                ({user.email})
                                                            </span>
                                                        </div>

                                                        {isSending ? (
                                                            <Loader2 className="w-6 h-6 
                                                            animate-spin text-purple-400"/>
                                                        ) : alreadyMember ?(
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] font-mono
                                                                 h-6 px-2 text-zinc-400
                                                                  border-white/10
                                                                   bg-white/[0.02]"
                                                            >
                                                                Member
                                                            </Badge>
                                                        ) : (
                                                            <Button 
                                                                className={`h-7 px-3 text-xs 
                                                                    font-mono transition-all ${
                                                                    alreadyInvited
                                                                        ? "bg-purple-950/40 text-purple-300 border border-purple-500/30 hover:bg-purple-950/60"
                                                                        : "bg-purple-600 text-white hover:bg-purple-500 shadow-sm"
                                                                }`}
                                                                onClick={() => handleInviteUser(user)}
                                                                disabled={alreadyInvited}
                                                            >
                                                                {alreadyInvited ? (
                                                                    <span className="
                                                                    flex items-center gap-1
                                                                    ">
                                                                        <Check className="
                                                                        w-3 h-3 text-purple-400
                                                                        "/>
                                                                        Pending
                                                                    </span>
                                                                ) : (
                                                                    "Invite"
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CommandItem>
                                            )})}
                                        </div>
                                    </CommandGroup>
                                )}
                        </CommandList>
                    </Command>
                </div>
            </>
        )}
        </div>
    )
}

export default WorkspaceMembersManager;
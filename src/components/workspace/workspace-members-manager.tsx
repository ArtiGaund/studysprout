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
import { Loader2 } from "lucide-react";

// --- Redux Integration ---
import { 
    selectWorkspaceMembers, 
    selectWorkspaceMembersLoading, 
    selectWorkspaceOwner 
} from "@/store/selectors/workspaceMembersSelector";
import { useAppSelector } from "@/store/hooks";
import { useSelector } from "react-redux";
import { selectUserId } from "@/store/selectors/userSelector";


const WorkspaceMembersManager = ({ workspaceId }: { workspaceId: string}) => {
    // --- AUTHENTICATION & IDENTITY ---
    const currentUserId = useSelector(selectUserId);

    // Track specific user IDs currently undergoing async operations to show granular spinners
    const [ addingUserId, setAddingUserId ] = useState<string | null>(null);
    const [ removeUserId, setRemoveUserId ] = useState<string | null>(null);

    // --- CUSTOM HOOKS (Business Logic Layer) ---
    const {
        query,
        searchUsers,
        results,
        loading
    } = useWorkspaceMembersSearch();

    const {
        addMember,
        removeMember
    } = useWorkspaceMembers(workspaceId)

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

        // --- HANDLERS ---
    const handleAddUser = async (user: UserSearch) => {
        setAddingUserId(user._id);
        try {
            const member = await addMember(user._id);
        } catch (error) {
            console.error("[WorkspaceMembersManagers] Failed to add member: ",error);
        }finally{
            setAddingUserId(null);
        }
    }

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
        <div>
            <Separator className="my-4"/>
            {/* 1. MEMBERSHIP VISUALIZATION SECTION */}
            <div className="space-y-4">
                {membersLoading ? (
                    <div className="text-sm text-muted-foreground">Loading members...</div>
                ) : (
                    <MemberList 
                    workspaceId={workspaceId}
                    owner={owner}
                    members={members}
                    isOwner={isOwner}
                    onRemove={handleRemoveMember}
                     />
                )
            }
          </div>

          {/* 2. ADMINISTRATIVE ACTIONS SECTION (Owner Only) */}
         {isOwner && ( 
            <>
            <Separator className="my-4"/>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Add Members</h4>  
          <Command>
            <CommandInput 
            placeholder="Search by username or email..."
            onValueChange={searchUsers}
            />

            <CommandList
            className="bg-transparent p-1"
            >
                {loading &&
                 <div className="px-3 py-2 text-sm text-muted-foreground">
                    Searching...
                </div>}
                {!loading && results.length === 0 && query.trim().length >=2 && (
                    <CommandEmpty>No user found.</CommandEmpty>
                )}
               { !loading && results.length > 0 && (
                <CommandGroup>
                    <div className="mt-2  rounded-md bg-gray-900">
                    {results.map((user) => (
                        <CommandItem
                        key={user._id}
                        value={`${user.username} ${user.email}`}
                        className="
                        w-full
                        bg-transparent
                        rounded-md
                        hover:bg-primary/10
                        data-[selected=true]:bg-primary/10
                        "
                        >
                            <div className="flex w-full items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {user.username}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-[5px]">
                                        ({user.email})
                                    </span>
                                </div>
                               {addingUserId === user._id ? (
                                <Loader2 className="w-6 h-6 animate-spin"/>
                               ) : (
                                 <Button 
                                className="w-[50px] h-[30px] text-sm"
                                onClick={() => handleAddUser(user)}
                                disabled={isAlreadyMember(user._id)}
                                >
                                    Add
                                </Button>
                               )}
                            </div>
                        </CommandItem>
                    ))}
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
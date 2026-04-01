/**
 * @component FilePresenceAvatar
 * @description A real-time presence indicator that displays a stacked list of active users 
 * collaborating on the current file.
 * * UX Design Patterns:
 * - Avatar Stacking: Uses negative horizontal spacing (`-space-x-2`) for a compact, modern UI.
 * - Overflow Management: Implements a "Facepile" pattern, displaying a maximum of 3 avatars 
 * before showing a numerical overflow counter.
 * - Graceful Fallbacks: Automatically generates initial-based avatars if user profile 
 * images fail to load or are missing.
 */
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface FilePresenceAvatarProps{
    /** * Array of active user objects from the presence/socket state. 
     * Expected structure: { userId: string, avatarUrl?: string, username: string }
     */
    activeUsers: any[];
}

export const FilePresenceAvatar = ({
    activeUsers,
}: FilePresenceAvatarProps) => {
    // Calculate how many users are hidden to maintain UI cleaniness in high-traffic files
    const remainingCount = activeUsers.length - 3;
    return(
         <div className="flex cursor-pointer -space-x-2">
            {/* Render only the first 3 active participants to prevent 
                UI breaking in large workspaces 
            */}
            {activeUsers.slice(0,3).map(user => (
                <Avatar 
                key={user.userId}
                className="w-6 h-6"
                >
                    <AvatarImage 
                    src={user.avatarUrl}
                    className="object-cover"
                    />
                    <AvatarFallback>
                        {user.username?.[0].toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            ))}
            {/* Overflow / Invite Trigger: 
                Shows the count of additional users or a '+' sign for 
                consistency in the facepile UI.
            */}
            <Avatar className="w-6 h-6">
                <AvatarFallback>
                    {remainingCount > 0 ? `+${remainingCount}` : "+"}
                </AvatarFallback>
            </Avatar>
        </div>
    )
}
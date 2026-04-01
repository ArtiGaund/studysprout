/**
 * @interface UserSearch
 * @description A specialized projection of the User entity optimized for 
 * real-time search results and collaborator invitation flows.
 * * * KEY DESIGN DECISIONS:
 * 1. Targeted Metadata: Includes only UI-critical fields (Username, Avatar) to 
 * minimize payload size during high-frequency "search-as-you-type" operations.
 * 2. Adaptive Avatar Support: Implements a union-type `avatarType` to allow the 
 * UI to toggle between rendering remote images or generated initials.
 * 3. Unique Identification: Uses a string-serialized `_id` to ensure compatibility 
 * with Redux/React keys and WebSocket event payloads.
 * 4. UX Optimization: Explicitly includes `avatarInitials` to prevent expensive 
 * client-side string parsing (e.g., extracting "JD" from "John Doe") in every list item.
 */

export interface UserSearch{
    _id: string;
    username: string;
    email: string;
    avatarType: "image" | "initial";
    avatarUrl?: string;
    avatarInitials: string;
}
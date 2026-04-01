/**
 * @type WorkspaceMember
 * @description Represents a granular user identity and its associated permissions 
 * within a specific workspace context.
 * * * KEY ARCHITECTURAL FEATURES:
 * 1. RBAC (Role-Based Access Control): Implements a strict 'role' union to 
 * drive conditional UI rendering (e.g., hiding delete buttons for 'viewers').
 * 2. Optimized Avatar Logic: Supports a dual-mode avatar system ('image' | 'initial') 
 * to ensure a professional UI fallback even when a user hasn't uploaded a photo.
 * 3. Identity Traceability: Uses `_id` and `email` as unique identifiers for 
 * collaborative event mapping (e.g., identifying who is currently typing).
 */

export type WorkspaceMember = {
    _id: string;
    username: string;
    email: string;
    avatarType: "image" | "initial";
    avatarUrl?: string;
    avatarInitials: string;
    role: "owner" | "editor" | "viewer";
}
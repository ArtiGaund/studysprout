/**
 * @module WorkspacePersistence
 * @description specialized utilities for managing client-side session persistence.
 * * UX STRATEGY:
 * 1. User-Bound Keys: Scopes the 'lastWorkspace' to a specific `userId` to prevent data collision on shared devices.
 * 2. SSR Safety: Implements `typeof window` checks to prevent execution errors during Next.js server-side rendering.
 * 3. Graceful Degradation: Uses try-catch blocks to handle environments where localStorage might be restricted (e.g., Private/Incognito mode).
 */

/**
 * @function setLastWorkspace
 * Persists the current workspace ID to the browser's local storage.
 * @param userId - The unique identifier of the authenticated user.
 * @param workspaceId - The ID of the workspace to be remembered.
 */

export const setLastWorkspace = (userId: string, workspaceId: string) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(`lastWorkspace_${userId}`, workspaceId);
    } catch (e) {
        console.warn("[setLastWorkspace] Storage access failed:", e);
    }
}

/**
 * @function getLastWorkspace
 * Retrieves the previously accessed workspace ID.
 * Used during the initial application load to redirect the user to their last active context.
 */
export const getLastWorkspace = (userId: string) => {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(`lastWorkspace_${userId}`);
    } catch (e) {
        console.warn("[getLastWorkspace] Storage access failed:", e);
        return null;
    }
}

/**
 * @function clearLastWorkspace
 * Explicitly removes the persisted workspace state.
 * Typically invoked during a logout sequence to ensure privacy.
 */
export const clearLastWorkspace = (userId: string) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(`lastWorkspace_${userId}`);
    } catch (e) {
        console.warn("[clearLastWorkspace] Storage access failed:", e);
    }
}
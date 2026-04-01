/**
 * @module UserInterfaceUtils
 * @description specialized utilities for managing user identity visuals.
 * * * KEY FUNCTIONALITIES:
 * 1. Fallback Logic: Implements a "Letter Avatar" pattern for users without profile images.
 * 2. Input Sanitization: Uses `.trim()` and null-checks to prevent UI crashes on malformed strings.
 * 3. Provider-Agnostic: Logic to determine the rendering strategy (Image vs. Initial) 
 * regardless of the authentication provider (Google, GitHub, Credentials).
 */

/**
 * @method getInitials
 * @description Generates a 1 or 2-letter uppercase string from a user's name.
 * - Handles single names (e.g., "John" -> "J")
 * - Handles full names (e.g., "John Doe" -> "JD")
 * - Provides a safe default ("U" for Unknown) for empty inputs.
 */
export const getInitials = (name:string): string => {
    // empty name field
    if(!name) return "U";

    const parts = name.trim().split(" ");

    // Logic for single-word names
    if(parts.length === 1) return parts[0][0].toUpperCase();

    // Logic for multi-word names (taking first and last initials)
    return (parts[0][0]+parts[1][0]).toUpperCase();
}

/**
 * @method getAvatarTypeFromProvider
 * @description Helper for conditional rendering logic.
 * Simple boolean-to-string mapping to drive the UI's <Avatar /> component state.
 */
export const getAvatarTypeFromProvider = (image?: string) => 
    image ? "image" : "initial";

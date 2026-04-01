/**
 * @module AuthTypes
 * @description specialized TypeScript Module Augmentation for NextAuth. 
 * Synchronizes the internal Session and JWT objects with our custom MongoDB User Schema.
 * * * KEY ARCHITECTURAL FEATURES:
 * 1. Module Augmentation: Extends the 'next-auth' and 'next-auth/jwt' namespaces 
 * to include proprietary fields (e.g., _id, avatar metadata).
 * 2. Type-Safe Sessions: Ensures that `session.user._id` is accessible without 
 * TypeScript "property does not exist" errors in components and hooks.
 * 3. Avatar Logic Support: Defines specific `avatarType` unions to drive the 
 * conditional rendering of user profile images vs. initials.
 * 4. JWT/Session Parity: Guarantees that the data persisted in the token is 
 * perfectly mapped to the session object available on the client side.
 */
import "next-auth"
import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt";

// making packages aware of the new datatype (it cannot be done directly using interface)
declare module 'next-auth' {
    /** * @interface User 
     * Mirrors the backend User model for consistent data flow from DB to Auth.
     */
    interface User{
        _id? : string;
        isVerified? : boolean;
        username?: string;

        avatarType?: "image" | "initial";
        avatarUrl?: string;
        avatarInitials?: string;
    }

    /** * @interface Session 
     * Extends the standard session object. Essential for the `useUser` provider 
     * and Redux auth selectors to access the unique database ID.
     */
    interface Session{
        accessToken?: string;
        user: {
            _id?: string;
            isVerified?: boolean;
            username?: string;

            avatarType?: "image" | "initial";
            avatarUrl?: string;
            avatarInitials?: string;

           
        } & DefaultSession['user']
    }
}

/**
 * @section JWT Augmentation
 * Extends the JSON Web Token interface. 
 * This is critical for the `callbacks` in `auth.ts` to pass data from 
 * the token into the session.
 */
declare module 'next-auth/jwt'{
    interface JWT{
        _id?: string;
        isVerified?: boolean;
        username?: string;

        avatarType?: "image" | "initial";
        avatarUrl?: string;
        avatarInitials?: string;
    }
}
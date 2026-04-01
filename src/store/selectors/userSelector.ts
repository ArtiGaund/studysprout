/**
 * @module UserSelectors
 * @description specialized selectors for the User and Authentication Redux slice. 
 * Provides an abstraction layer for session data, ensuring components remain 
 * decoupled from the raw state structure.
 * * * KEY ARCHITECTURAL FEATURES:
 * 1. Encapsulation: Prevents components from directly accessing `state.user`, 
 * allowing the underlying state shape to evolve without breaking the UI.
 * 2. Type-Safe Access: Utilizes `RootState` to provide full IntelliSense 
 * and compile-time safety across the application.
 * 3. Reactive Auth Logic: Drives conditional rendering (e.g., Protected Routes, 
 * User Profiles) by exposing the `status` and `userId`.
 */
import { RootState } from "../store";

/**
 * @method selectUserId
 * @description Extracts the unique identifier for the currently authenticated user. 
 * Used primarily for scoping API requests (e.g., fetching user-specific workspaces).
 */
export const selectUserId = (state: RootState) => state.user.userId;

/**
 * @method selectAuthStatus
 * @description Returns the current authentication state ('loading' | 'authenticated' | 'unauthenticated'). 
 * This is the "source of truth" for the App's Layout guards and login redirects.
 */
export const selectAuthStatus = (state: RootState) => state.user.status;

/**
 * @method selectAuthToken
 * @description Retrieves the JWT or session token. Essential for the Service Layer 
 * to attach Bearer tokens to outgoing Axios requests.
 */
export const selectAuthToken = (state: RootState) => state.user.token;
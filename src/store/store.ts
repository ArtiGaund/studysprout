/**
 * @module ReduxStore
 * @description The centralized state management engine for StudySprout. 
 * Orchestrates domain-specific slices into a unified global state tree.
 * * * ARCHITECTURAL DESIGN:
 * 1. Domain Separation: Segregates state into logical units (User, Workspace, Flashcards) 
 * to ensure high maintainability and prevent state "bloat."
 * 2. Real-time Integration: Includes specialized slices for `workspacePresence` and 
 * `workspaceMembers` to handle volatile Socket.io data separately from persistent entities.
 * 3. Type Safety: Exports `RootState` and `AppDispatch` to provide full TypeScript 
 * IntelliSense across all custom hooks and components.
 * 4. Extensibility: Configured via Redux Toolkit (RTK) for seamless addition of 
 * middleware (e.g., RTK Query or custom Socket middleware) in the future.
 */
import { configureStore } from "@reduxjs/toolkit"
import workspaceReducer from "./slices/workspaceSlice"
import folderReducer from "./slices/folderSlice"
import fileReducer from "./slices/fileSlice"
import uiReducer from "./slices/uiSlice"
import contextReducer from "./slices/contextSlice"
import flashcardReducer from "./slices/flashcardSlice"
import flashcardSetReducer from "./slices/flashcardSetSlice"
import workspaceMembersReducer from "./slices/workspaceMembersSlice"
import workspacePresenceReducer from "./slices/workspacePresenceSlice"
import userReducer from "./slices/userSlice";
import lastStudiedReducer from "./slices/lastStudiedSlice";
import activityReducer from "./slices/activitySlice";

/**
 * @section Store Configuration
 * Combines reducers to define the global state shape.
 */
const store = configureStore({
    reducer: {
        user: userReducer,             // Authentication & User Profile
        workspace: workspaceReducer,   // Workspace Metadata & Organization
        folder: folderReducer,         // Folder Hierarchy
        file: fileReducer,             // File Content & Block Data
        ui: uiReducer,                 // Modal states, Sidebars, Editing Indicators
        context: contextReducer,       // App-wide Contextual Flags
        flashcard: flashcardReducer,   // Individual Flashcard Entities (SRS Data)
        flashcardSet: flashcardSetReducer, // Metadata for Flashcard Groups
        workspaceMembers: workspaceMembersReducer, // Collaborative Access Lists
        workspacePresence: workspacePresenceReducer, // Real-time Cursor & User Status
        lastStudied: lastStudiedReducer,
        activity: activityReducer,
    }
})

//  --- Type Exports for Hooks ---
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export default store
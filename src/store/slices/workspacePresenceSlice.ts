/**
 * @slice workspacePresenceSlice
 * @description Manages real-time user presence within the workspace ecosystem.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Volatile State Management: Optimized for high-frequency updates from Socket.io 
 * 'heartbeat' or 'presence' events.
 * 2. Workspace-Bound Scoping: Maps user IDs to specific `workspaceId` keys, 
 * ensuring that presence indicators are contextually accurate.
 * 3. Minimalist Payload: Stores only essential IDs to keep the Redux state tree 
 * lean and prevent serialization overhead during rapid-fire updates.
 * 4. Reactive UI Trigger: Serves as the primary data source for "Who's Online" 
 * avatars and collaborative cursor components.
 */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** * @type PresenceState 
 * A dictionary where keys are Workspace IDs and values are arrays of active User IDs.
 */
type PresenceState = {
    [ workspaceId: string ]: string[]; //userIds online
}

const initialState: PresenceState = {};

const workspacePresenceSlice = createSlice({
    name: "workspacePresence",
    initialState,
    reducers: {
        /**
         * @reducer SET_PRESENCE
         * Synchronizes the local presence registry with the server's source of truth.
         * Typically dispatched in response to 'presence:sync' socket events.
         */
        SET_PRESENCE(
            state,
            action: PayloadAction<{ workspaceId: string; users: string[] }>
        ){
            // Atomic update of the entire user array for the workspace
            state[action.payload.workspaceId] = action.payload.users;
        },
    },
});

export const { SET_PRESENCE } = workspacePresenceSlice.actions;
export default workspacePresenceSlice.reducer;
/**
 * @slice uiSlice
 * @description Manages transient UI states, specifically focusing on collaborative 
 * inline editing and remote presence indicators.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Synchronous Editing State: Tracks the 'tempTitle' vs 'originalTitle' to allow 
 * for instant UI feedback and easy 'Escape-to-Cancel' functionality.
 * 2. Remote Presence Tracking: Implements a `RemoteEditingState` dictionary to 
 * monitor peer activity across the workspace tree.
 * 3. Atomic UI Updates: Decoupled from the primary data slices (File/Folder) to 
 * prevent expensive re-renders of the entire directory tree during typing.
 * 4. Socket Integration: Actions like `setRemoteEditing` are designed to be 
 * dispatched directly from WebSocket listeners to reflect peer changes in real-time.
 */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** * @interface EditingItemState 
 * Represents the local user's current editing context.
 */
interface EditingItemState {
        id: string | null;
        type: 'folder' | 'file' | 'workspace' | null;
        tempTitle: string | null;
        originalTitle: string | null;
}

    /** * @interface RemoteEditingState
 * A registry of other users currently editing items in the same workspace.
 */
    interface RemoteEditingState{
        [itemId: string]: {
            username: string;
            tempTitle: string;
            userId: string;
        }
    }

    interface UiState {
        editingItem: EditingItemState; // Null if no item is currently being edited
        remoteEditing: RemoteEditingState; //Track other user here
    }

    const initialState: UiState = {
        editingItem: {
            id: null,
            type: null,
            tempTitle: null,
            originalTitle: null
        },
        remoteEditing: {},
    }

    const uiSlice = createSlice({
        name: 'ui',
        initialState,
        reducers: {
        /**
         * @reducer setEditingItem
         * Initializes the local editing session. Captures the original title 
         * to facilitate 'Undo/Revert' logic if the user cancels.
         */
            setEditingItem: ( state, action: PayloadAction<{ 
                id: string,
                type: 'folder' | 'file' | 'workspace',
                title: string
            }>) => {
                state.editingItem = {
                    id: action.payload.id,
                    type: action.payload.type,
                    tempTitle: action.payload.title,
                    originalTitle: action.payload.title,
                };
            },

        /**
         * @reducer updateEditingItemTitle
         * Handles high-frequency typing updates. Keeps the UI reactive without 
         * hitting the database until 'Blur' or 'Enter' is triggered.
         */
            updateEditingItemTitle: ( state, action: PayloadAction<string>) => {
                if(state.editingItem){
                    state.editingItem.tempTitle = action.payload;
                }
            },

            /**
         * @reducer clearEditingItem
         * Resets the local editing context to its initial null state.
         * * TECHNICAL ROLE:
         * 1. UI Reset: Triggers the component to switch from an <input> back to a <span>.
         * 2. Cleanup: Wipes the 'tempTitle' to prevent the next item edited from 
         * inheriting stale text.
         * 3. Global Lock Release: Frees the 'editing' status in Redux so other 
         * components know no local editing is currently in progress.
         */
            clearEditingItem: ( state ) => {
                state.editingItem = initialState.editingItem;
            }, 

        /**
         * @reducer setRemoteEditing
         * Manages peer presence. Adds or deletes remote users from the registry 
         * based on incoming Socket.io 'start' and 'stop' events.
         */
            setRemoteEditing: (
                state,
                action: PayloadAction<{
                    itemId: string;
                    data: any | null
                }>
            ) => {
              const { itemId, data } = action.payload;
              if(data){
                // someone started editing
                state.remoteEditing[itemId] = {
                    userId: data.userId,
                    username: data.username,
                    tempTitle: data.tempTitle || "",
                };
              }else{
                // someone stopped editing
                delete state.remoteEditing[itemId];
              }
            },

        /**
         * @reducer updateRemoteTitle
         * Synchronizes the UI to show what other users are typing in real-time.
         */
            updateRemoteTitle: (
                state,
                action: PayloadAction<{
                    itemId: string;
                    tempTitle: string;
                }>
            ) => {
                const { itemId, tempTitle } = action.payload;
                if(state.remoteEditing[itemId]){
                    state.remoteEditing[itemId].tempTitle = tempTitle;
                }
            },
        },
    });

    export const { 
        setEditingItem,
        updateEditingItemTitle,
        clearEditingItem,
        setRemoteEditing,
        updateRemoteTitle,
    } = uiSlice.actions;



    export default uiSlice.reducer;
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface CurrentContext{
    id: string | null;
    title: string | null;
    type: 'Workspace' | 'Folder' | 'File' | null;
}

export interface ContextState{
    currentResource: CurrentContext
}

const initialState: ContextState = {
    currentResource: {
        id: null,
        title: null,
        type: null,
    },
};

const contextSlice = createSlice({
    name: "context",
    initialState,
    reducers: {
        SET_CURRENT_RESOURCE: (state, action: PayloadAction<CurrentContext>) => {
            state.currentResource = action.payload;
        },
        CLEAR_CURRENT_RESOURCE: (state) => {
            state.currentResource = initialState.currentResource;
        },
    },
});

export const {
    SET_CURRENT_RESOURCE,
    CLEAR_CURRENT_RESOURCE
} = contextSlice.actions;

export default contextSlice.reducer;
import { LastStudiedState } from "@/types/state.type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LastStudiedSliceState {
    data: LastStudiedState | null;
}

const initialState: LastStudiedSliceState = {
    data: null,
};

const lastStudiedSlice = createSlice({
    name: "lastStudied",
    initialState,
    reducers: {
        setLastStudied: (
            state,
            action: PayloadAction<LastStudiedState | null>
        ) => {
            state.data = action.payload;
        },
        updateLastStudiedCardIndex: (
            state,
            action: PayloadAction<number>
        ) => {
            if(state.data){
                state.data.cardIndex = action.payload;
            }
        },
        clearLastStudied: ( state ) => {
            state.data = null;
        },
    },
})

export const {
    setLastStudied,
    updateLastStudiedCardIndex,
    clearLastStudied,
} = lastStudiedSlice.actions;

export default lastStudiedSlice.reducer;
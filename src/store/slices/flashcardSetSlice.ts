/**
 * Flashcard Set Slice
 * 
 * This slice is used to store the flashcard sets in Redux store for global state management
 * 
 * Responsibility:
 * - Store the flashcard sets
 * - Set the active flashcard set
 * - Update the flashcard sets
 * 
 * Notes:
 * - This slice is used to store the flashcard sets in Redux store
 */

import { FlashcardSetState, ReduxFlashcardSet } from "@/types/state.type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: FlashcardSetState = {
    sets: [],
    loading: false,
};

const flashcardSetSlice = createSlice({
    name: "flashcardSet",
    initialState,
    reducers: {
        setFlashcardSets(
            state,
            action: PayloadAction<ReduxFlashcardSet[]>
        ){
           state.sets = action.payload;
        },

        addSet(
            state,
            action: PayloadAction<ReduxFlashcardSet>
        ){
            state.sets.push(action.payload);
        },
        updateSetDueCount(
            state,
            action: PayloadAction<{ setId: string; dueCount: number}>
        ){
            const { setId, dueCount } = action.payload;
            state.sets = state.sets.map((s) => 
            s._id === setId ? { ...s, dueCount } : s
            );
        },

        updateSetTotal(
            state,
            action: PayloadAction<{ setId: string; totalCards: number }>
        ){
            const { setId, totalCards } = action.payload;
            state.sets = state.sets.map((s) =>
            s._id === setId ? { ...s, totalCards } : s
            );
        },

        removeSet(
            state,
            action: PayloadAction<{ setId: string }>
        ){
            const { setId } = action.payload;
            state.sets = state.sets.filter((s) => s._id !== setId);
        },

        clearSet(state){
            state.sets = [];
        },
        updateSingleSet(
            state,
            action: PayloadAction<ReduxFlashcardSet>
        ){
            const updated = action.payload;
            state.sets = state.sets.map((s) =>
                 s._id === updated._id
             ?{ ...s, ...updated }
            : s
        );
        }
    },
});

export const {
    setFlashcardSets,
    addSet,
    updateSetDueCount,
    updateSetTotal,
    removeSet,
    clearSet,
    updateSingleSet,
} = flashcardSetSlice.actions;

export default flashcardSetSlice.reducer;
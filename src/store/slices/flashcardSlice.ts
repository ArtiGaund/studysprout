/**
 * Flashcard Slice
 * 
 * This slice is used to store the flashcards of a flashcard set in Redux store for global state management
 * 
 * Responsibility:
 * - Store the flashcards of a flashcard set
 * - Set the active flashcard set
 * - Update the flashcards of a flashcard set
 * 
 * Notes:
 * - This slice is used to store the flashcards of a flashcard set in Redux store
 * - Error responses use the unified API response helpers.
 * 
 */

import { FlashcardState, ReduxFlashcard } from "@/types/state.type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";



const initialState: FlashcardState ={
    cardsBySet: {},
    activeSetId: null,
}

const flashcardSlice = createSlice({
    name: "flashcards",
    initialState,
    reducers: {
        setActiveSet(
            state,
             action: PayloadAction<string>
        ){
            state.activeSetId = action.payload;
        },

        setFlashcardsForSet(
            state,
            action: PayloadAction<{ setId: string; cards: ReduxFlashcard[] }>
        ){
            state.cardsBySet[action.payload.setId] = action.payload.cards;
        },

        updateFlashcard(
            state,
            action: PayloadAction<{ setId: string; card: ReduxFlashcard }>
        ){
            const { setId, card } = action.payload;
            const cards = state.cardsBySet[setId];
            if(!cards) return;

            state.cardsBySet[setId] = cards.map((c) => c._id === card._id ? card : c );
        },
        resetSingleFlashcard(
            state,
            action: PayloadAction<{ setId: string, cardId: string }>
        ){
            const { setId, cardId } = action.payload;
            const cards = state.cardsBySet[setId];
            if(!cards) return;

            state.cardsBySet[setId] = cards.map((c) => c._id === cardId 
            ? {
                ...c,
                interval: 1,
                difficulty: 2.5,
                repetition: 0,
                dueDate: new Date().toISOString(),
            }
            : c
            );
        },

        resetEntireSet(
            state,
            action: PayloadAction<{ setId: string}>
        ){
            const { setId } = action.payload;
            const cards = state.cardsBySet[setId];
            if(!cards) return;

            state.cardsBySet[setId] = cards.map((c) => ({
                ...c,
                interval: 1,
                difficulty: 2.5,
                repetition: 0,
                dueDate: new Date().toISOString(),
            }));
        },
        clearFlashcards(state){
            state.cardsBySet = {};
            state.activeSetId = null;
        },
    },
});

export const {
    setActiveSet,
    setFlashcardsForSet,
    updateFlashcard,
    resetEntireSet,
    resetSingleFlashcard,
    clearFlashcards,
} = flashcardSlice.actions;

export default flashcardSlice.reducer;

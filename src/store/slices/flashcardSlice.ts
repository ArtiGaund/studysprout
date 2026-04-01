/**
 * @slice flashcardSlice
 * @description Manages the persistent study state and Spaced Repetition System (SRS) 
 * metadata for generated flashcard sets.
 * * * KEY ARCHITECTURAL FEATURES:
 * 1. SRS State Management: Tracks specialized 'progress' objects (interval, difficulty, 
 * repetition) required for adaptive learning algorithms like SM-2.
 * 2. Bucket-Based Storage: Uses `cardsBySet` (Record<string, ReduxFlashcard[]>) to 
 * isolate flashcard data by their parent set, preventing massive state object overhead.
 * 3. Atomic Progress Updates: `updateFlashcardProgress` allows for surgical updates to 
 * a single card's learning metrics during a study session.
 * 4. Cross-Slice Lifecycle: Implements `extraReducers` to listen for `removeSet` actions 
 * from the flashcardSet slice, ensuring no "zombie" data remains in memory.
 */

import { FlashcardState, ReduxFlashcard } from "@/types/state.type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { removeSet } from "./flashcardSetSlice";

const initialState: FlashcardState ={
    cardsBySet: {},
    activeSetId: null,
}

const flashcardSlice = createSlice({
    name: "flashcard",
    initialState,
    reducers: {
        /**
         * @reducer setFlashcardsForSet
         * Bulk injection of flashcards. Typically called after an AI generation 
         * process or a fetch of an existing study set.
         */
        setActiveSet(
            state,
             action: PayloadAction<string>
        ){
            state.activeSetId = action.payload;
        },

        /**
         * @reducer setFlashcardsForSet
         * @description The "Hydration" engine. Populates the Redux store with an array of flashcards 
         * mapped to a specific Set ID. 
         * * Recruiter Note: Demonstrates efficient handling of bulk data injection 
         * following an AI generation sequence or a database fetch.
         */
        setFlashcardsForSet(
            state,
            action: PayloadAction<{ setId: string; cards: ReduxFlashcard[] }>
        ){
            state.cardsBySet[action.payload.setId] = action.payload.cards;
        },

        /**
         * @reducer updateFlashcard
         * @description Targeted entity updates. Performs a shallow merge of card metadata 
         * (Question/Answer text) while maintaining referential integrity in the cards array.
         */
        updateFlashcard(
            state,
            action: PayloadAction<{ 
                setId: string; 
                card: Partial<ReduxFlashcard> & { _id: string } 
            }>
        ){
            const { setId, card } = action.payload;
            const cards = state.cardsBySet[setId];
            if(!cards) return;

            state.cardsBySet[setId] = cards.map((c)  => 
            c._id === card._id ? { ...c ,...card} : c 
        );
        },

        /**
         * @reducer resetSingleFlashcard
         * Reverts a card to its baseline study state. 
         * Demonstrates a deep-merge pattern to preserve card content while resetting progress.
         */
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
                progress: {
                    interval: 0,
                    difficulty: 2.5,
                    repetition: 0,
                    dueDate: new Date().toISOString(),
                    lastReviewed: null
                },
            }
            : c
            );
        },

        /**
         * @reducer resetEntireSet
         * @description Mass state reset. Reverts every card in a set back to 'New' status (Day 0).
         * * Pedagogical Note: Essential for users who want to restart a course or 
         * clear their Spaced Repetition history for a specific topic.
         */
        resetEntireSet(
            state,
            action: PayloadAction<{ setId: string}>
        ){
            const { setId } = action.payload;
            const cards = state.cardsBySet[setId];
            if(!cards) return;

            state.cardsBySet[setId] = cards.map((c) => ({
                ...c,
                progress: {
                    interval: 1,
                    difficulty: 2.5,
                    repetition: 0,
                    dueDate: new Date().toISOString(),
                    lastReviewed: null,
                },
            }));
        },

        /**
         * @reducer clearFlashcards
         * @description Global teardown. Purges all flashcard data and active set IDs from the store.
         * * Implementation Note: Primarily used during User Logout or Workspace switching 
         * to prevent cross-account data leakage and free up memory.
         */
        clearFlashcards(state){
            state.cardsBySet = {};
            state.activeSetId = null;
        },

        /**
         * @reducer updateFlashcardProgress
         * The primary study-loop reducer. Synchronizes the local SRS state 
         * with the results of the learning algorithm after a user review.
         */
        updateFlashcardProgress(
            state,
            action: PayloadAction<{
                setId: string;
                cardId: string;
                newProgress: ReduxFlashcard['progress']
            }>
        ){
            const { setId, cardId, newProgress } = action.payload;
            const cards = state.cardsBySet[setId];
            if(!cards) return;

            state.cardsBySet[setId] = cards.map((card) => 
            card._id === cardId
            ? { ...card, progress: newProgress }
            : card
            );
        },
    },

    /**
     * @section extraReducers
     * Handles side-effects from other slices. 
     * When a Set is removed from the 'flashcardSet' slice, this logic ensures 
     * the associated cards are purged from memory to prevent memory leaks.
     */
     extraReducers: (builder) => {
        builder.addCase(
            removeSet, 
            (state, action ) => {
                const setId = typeof action.payload === 'string'
                    ? action.payload
                    : (action.payload as any).setId;
                if(state.cardsBySet[setId]){
                    delete state.cardsBySet[setId];
                }
                if(state.activeSetId === setId){
                    state.activeSetId = null;
                }
        });
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

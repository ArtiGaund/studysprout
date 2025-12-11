/**
 * Redux Store
 * 
 * This file is used to configure the Redux store for global state management
 * 
 * Responsibility:
 * - Configure the Redux store
 * 
 * Notes:
 * - This file is used to configure the Redux store
 */
import { configureStore } from "@reduxjs/toolkit"
import workspaceReducer from "./slices/workspaceSlice"
import folderReducer from "./slices/folderSlice"
import fileReducer from "./slices/fileSlice"
import uiReducer from "./slices/uiSlice"
import contextReducer from "./slices/contextSlice"
import flashcardReducer from "./slices/flashcardSlice"
import flashcardSetReducer from "./slices/flashcardSetSlice"




const store = configureStore({
    reducer: {
        workspace: workspaceReducer,
        folder: folderReducer,
        file: fileReducer,
        ui: uiReducer,
        context: contextReducer,
        flashcard: flashcardReducer,
        flashcardSet: flashcardSetReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>
export default store
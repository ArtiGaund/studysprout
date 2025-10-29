import { configureStore } from "@reduxjs/toolkit"
import workspaceReducer from "./slices/workspaceSlice"
import folderReducer from "./slices/folderSlice"
import fileReducer from "./slices/fileSlice"
import uiReducer from "./slices/uiSlice"
import contextReducer from "./slices/contextSlice"




const store = configureStore({
    reducer: {
        workspace: workspaceReducer,
        folder: folderReducer,
        file: fileReducer,
        ui: uiReducer,
        context: contextReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>
export default store
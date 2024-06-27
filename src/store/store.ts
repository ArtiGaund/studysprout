import { configureStore } from "@reduxjs/toolkit"
import workspaceReducer from "./slices/workspaceSlice"
import folderReducer from "./slices/folderSlice"
import fileReducer from "./slices/fileSlice"


const store = configureStore({
    reducer: {
        workspace: workspaceReducer,
        folder: folderReducer,
        file: fileReducer
    }
})

export type RootState = ReturnType<typeof store.getState>
export default store

import { File } from "@/model/file.model"
import { Draft, PayloadAction, createSlice } from "@reduxjs/toolkit"



interface FileState{
    files: File[],
    currentFile: File | null,
}

const initialState: FileState = {
    files:[],
    currentFile: null,
}

const fileSlice = createSlice({
    name: "file",
    initialState,
    reducers: {
        ADD_FILE: ( state, action: PayloadAction<File> ) => {
            state.files.push(action.payload as Draft<File>)
        },
        DELETE_FILE: ( state, action: PayloadAction<string>) => {
            state.files = state.files.filter(
                (file) => file._id?.toString() !== action.payload
            )
        },
        UPDATE_FILE: ( state, action:PayloadAction<File>) => {
            const { _id, ...data } = action.payload
            const index = state.files.findIndex(
                (file) => file._id === action.payload._id
            )
            if(index !== -1){
                state.files[index] = { ...state.files[index], ...(data as Draft<File>) }
            }
        },
        SET_FILES: ( state, action: PayloadAction<File[]>) => {
            state.files = action.payload as Draft<File[]> 
        },
        SET_CURRENT_FILES: ( state, action: PayloadAction<File>) => {
            state.currentFile = action.payload as Draft<File>
        }
    }
})

export const {
    ADD_FILE,
    DELETE_FILE,
    UPDATE_FILE,
    SET_FILES,
    SET_CURRENT_FILES
} = fileSlice.actions

export default fileSlice.reducer;

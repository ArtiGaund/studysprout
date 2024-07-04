import { Folder } from "@/model/folder.model"
import { Draft, PayloadAction, createSlice } from "@reduxjs/toolkit"
import mongoose from "mongoose"



interface FolderState{
    folders: Folder[],
    currentFolder: Folder | null,
}

const initialState: FolderState = {
    folders:[],
    currentFolder: null,
}

const folderSlice = createSlice({
    name: "folder",
    initialState,
    reducers: {
        ADD_FOLDER: ( state, action: PayloadAction<Folder> ) => {
            state.folders.push(action.payload as Draft<Folder>)
        },
        DELETE_FOLDER: ( state, action: PayloadAction<string>) => {
            state.folders = state.folders.filter(
                (folder) => folder._id?.toString() !== action.payload
            )
        },
        UPDATE_FOLDER: ( state, action:PayloadAction<Partial<Folder>>) => {
           const updatedFolder = action.payload
            const index = state.folders.findIndex(
                (folder) => folder._id?.toString() === updatedFolder._id
            )
            if(index !== -1){
                state.folders[index] = {
                     ...state.folders[index], 
                     ...updatedFolder
                }
            }
        },
        SET_FOLDERS: ( state, action: PayloadAction<Folder[]>) => {
            state.folders = action.payload as Draft<Folder[]> 
        },
        SET_CURRENT_FOLDERS: ( state, action: PayloadAction<Folder>) => {
            state.currentFolder = action.payload as Draft<Folder>
        }
    }
})

export const {
    ADD_FOLDER,
    DELETE_FOLDER,
    UPDATE_FOLDER,
    SET_FOLDERS,
    SET_CURRENT_FOLDERS
} = folderSlice.actions

export default folderSlice.reducer;

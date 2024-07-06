import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { WorkSpace } from "@/model/workspace.model";
import { Draft } from 'immer';


interface WorkspaceState{
    workspaces: WorkSpace[],
    currentWorkspace: WorkSpace | null,
}

const initialState: WorkspaceState = {
    workspaces:[],
    currentWorkspace: null,
}

const workspaceSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        ADD_WORKSPACE: ( state, action: PayloadAction<WorkSpace>) => {
            state.workspaces.push(action.payload as Draft<WorkSpace>)
        },
        DELETE_WORKSPACE: ( state, action: PayloadAction<string>) => {
            state.workspaces = state.workspaces.filter(
                (workspace) => workspace._id?.toString() !== action.payload
            )
        },
        UPDATE_WORKSPACE: ( state, action:PayloadAction<Partial<WorkSpace>>) => {
            const updatedWorkspace = action.payload
            const index = state.workspaces.findIndex(
                (workspace) => workspace._id?.toString() === updatedWorkspace._id
            )
            if(index !== -1){
                state.workspaces[index] = {
                     ...state.workspaces[index], 
                     ...(updatedWorkspace as Draft<WorkSpace>)
                }
            }
        },
        SET_WORKSPACES: ( state, action: PayloadAction<WorkSpace[]>) => {
            state.workspaces = action.payload as Draft<WorkSpace[]> 
        },
        SET_CURRENT_WORKSPACES: ( state, action: PayloadAction<WorkSpace>) => {
            state.currentWorkspace = action.payload as Draft<WorkSpace>
        }
    }   
})

export const {
    ADD_WORKSPACE,
    DELETE_WORKSPACE,
    UPDATE_WORKSPACE,
    SET_WORKSPACES,
    SET_CURRENT_WORKSPACES
} = workspaceSlice.actions

export default workspaceSlice.reducer;


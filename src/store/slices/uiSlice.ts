    import { createSlice, PayloadAction } from "@reduxjs/toolkit";


    //Shape of the item being editing 
    interface EditingItemState {
        id: string | null;
        type: 'folder' | 'file' | 'workspace' | null;
        tempTitle: string | null;
        originalTitle: string | null;
    }

    interface UiState {
        editingItem: EditingItemState; // Null if no item is currently being edited
    }

    const initialState: UiState = {
        editingItem: {
            id: null,
            type: null,
            tempTitle: null,
            originalTitle: null
        }
    }

    const uiSlice = createSlice({
        name: 'ui',
        initialState,
        reducers: {
            setEditingItem: ( state, action: PayloadAction<{ 
                id: string,
                type: 'folder' | 'file' | 'workspace',
                title: string
            }>) => {
                state.editingItem = {
                    id: action.payload.id,
                    type: action.payload.type,
                    tempTitle: action.payload.title,
                    originalTitle: action.payload.title,
                };
            },
            updateEditingItemTitle: ( state, action: PayloadAction<string>) => {
                if(state.editingItem){
                    state.editingItem.tempTitle = action.payload;
                }
            },
            clearEditingItem: ( state ) => {
                state.editingItem = initialState.editingItem;
            }, 
        },
    });

    export const { 
        setEditingItem,
        updateEditingItemTitle,
        clearEditingItem
    } = uiSlice.actions;



    export default uiSlice.reducer;
'use client'

import { Folder } from "@/model/folder.model"
import { WorkSpace } from "@/model/workspace.model"
import axios from "axios"
import { usePathname } from "next/navigation"
import React, { Dispatch, createContext, useContext, useEffect, useMemo, useReducer } from "react"


interface AppState {
    workspaces: WorkSpace[] | [] 
}

type Action = 
| { type: 'ADD_WORKSPACE', payload: WorkSpace }
| { type: 'DELETE_WORKSPACE', payload: string }
| { 
    type: 'UPDATE_WORKSPACE', 
    payload: { workspace: Partial<WorkSpace>; workspaceId: string}
  }
| { 
    type: 'SET_WORKSPACES', 
    payload: { workspaces: WorkSpace[] } 
  }
| { 
    type: 'SET_FOLDERS',
    payload: { workspaceId: string, folders: Folder[] | [] }
  }
| {
    type: 'ADD_FOLDER',
    payload: { workspaceId: string, folder: Folder}
  }

const initialState: AppState = { workspaces: [] }

const appReducer = (
    state: AppState = initialState,
    action: Action
): AppState => {
    switch(action.type){
        case 'ADD_WORKSPACE':
            return {
                ...state,
                workspaces: [
                    ...state.workspaces,
                    action.payload
                ]
            }
        case 'DELETE_WORKSPACE':
            return {
                ...state,
                workspaces: state.workspaces.filter((workspace) => workspace._id !== action.payload )
            }
        case 'UPDATE_WORKSPACE':
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if(workspace._id === action.payload.workspaceId){
                        return {
                            ...workspace,
                            ...action.payload.workspace
                        } as WorkSpace
                    }
                    return workspace
                })
            }
        case 'SET_WORKSPACES':
            return {
                ...state,
                workspaces: action.payload.workspaces
            }
        case 'SET_FOLDERS':
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if(workspace._id === action.payload.workspaceId){
                        return {
                            ...workspace,
                            folders: action.payload.folders.sort(
                                (a, b) =>
                                    new Date(a.createdAt).getTime() -
                                    new Date(b.createdAt).getTime()
                            ) 
                        } as WorkSpace
                    }
                    return workspace
                })
            }
            case 'ADD_FOLDER':
                return {
                  ...state,
                  workspaces: state.workspaces.map((workspace) => {
                    return {
                      ...workspace,
                      folders: [
                        ...(workspace.folders as Folder[]), 
                        action.payload.folder
                    ].sort(
                        (a, b) =>
                          new Date(a.createdAt).getTime() -
                          new Date(b.createdAt).getTime()
                      ),
                    } as WorkSpace; 
                  }),
                };
        default: 
        return initialState
    }
}

const AppStateContext = createContext<
| {
    state: AppState,
    dispatch: Dispatch<Action>,
    workspaceId: string | undefined,
    folderId: string | undefined,
    fileId: string | undefined
}
| undefined
>(undefined)

interface AppStateProviderProps {
    children: React.ReactNode
}

const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
    const [ state, dispatch ] = useReducer(appReducer, initialState)
    const pathname = usePathname()
    
    const workspaceId = useMemo(() => {
        const urlSegments = pathname?.split('/').filter(Boolean)
        if(urlSegments){
            if(urlSegments.length > 1){
                return urlSegments[1]
            }
        }
    }, [pathname])

    const folderId = useMemo(() => {
        const urlSegments = pathname?.split('/').filter(Boolean)
        if(urlSegments){
            if(urlSegments.length > 1){
                return urlSegments[1]
            }
        }
    }, [pathname])

    const fileId = useMemo(() => {
        const urlSegments = pathname?.split('/').filter(Boolean)
        if(urlSegments){
            if(urlSegments.length > 1){
                return urlSegments[1]
            }
        }
    }, [pathname])

    useEffect(() => {
        if(!folderId || !workspaceId) return;
        const fetchFiles = async() => {
            try {
                const response = await axios.get(`/api/get-files?folderId=${folderId}`)
                console.log("Response in state provider ",response)
                // if(!response.data.success) return;
                // dispatch({
                //     type: 'SET_FILES',
                //     payload: { workspaceId, files: data, folderId} 
                // })
            } catch (error) {
                console.log("Error while fetching all files from the folder ", error)
                fetchFiles()
            }
        }
    }, [workspaceId, folderId ])
    return (
        <AppStateContext.Provider
        value={{ state, dispatch, workspaceId, folderId, fileId }}
        >
            {children}
        </AppStateContext.Provider>
    )
}

export default AppStateProvider;

export const useAppState = () => {
    const context = useContext(AppStateContext)
    if(!context){
        throw new Error('useAppState must be used within an AppStateProvider')
    }
    return context
}

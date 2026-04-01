/**
 * @component WorkspaceDropdown
 * @description A strategic navigation component that manages the application's 
 * top-level context (Workspace Selection). 
 * * * Key Functionality:
 * - Redux-Driven Selection: Synchronizes the UI with the global `currentWorkspace` state.
 * - Dynamic Listing: Maps over normalized Redux state (`byId` and `allIds`) for high-performance rendering.
 * - Creation Entry: Integrates with `CustomDialogTrigger` to launch the `DashboardSetup` flow.
 * - UI Polish: Utilizes backdrop-blur and absolute positioning for a modern, "Notion-style" overlay.
 */
"use client"

import React, { useState } from "react"
import SelectedWorkspaces from "./selected-workspaces";
import CustomDialogTrigger from "../global/custom-dialog";
import DashboardSetup from "../dashboard-setup/dashboard-setup";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ReduxWorkSpace } from "@/types/state.type";
import { SET_CURRENT_WORKSPACE } from "@/store/slices/workspaceSlice";

interface WorkspaceDropdownProps{
    workspaces: ReduxWorkSpace[] | [];
    defaultValue: ReduxWorkSpace | undefined
}


// this component will allow the user to select between the different workspaces
const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({ workspaces, defaultValue }) => {
    // --- STATE & DISPATCH ---
    const workspaceState = useSelector((state: RootState) => state.workspace);
    const [ isOpen, setIsOpen ] = useState(false)
    const dispatch = useDispatch();

    /**
     * @selector currentWorkspace
     * Derives the active workspace by looking up the ID in the normalized state object.
     * This ensures the dropdown always displays the most up-to-date workspace metadata.
     */
    const currentWorkspace = useSelector((state: RootState) =>
        state.workspace.currentWorkspace
        ? state.workspace.byId[state.workspace.currentWorkspace._id]
        : undefined
    );

    /**
     * @handler handleSelect
     * Updates the global Redux state and closes the dropdown.
     * Triggers a cascade of updates in child components (Folders/Files) via workspace ID.
     */
    const handleSelect = ( option: ReduxWorkSpace ) => {
        dispatch(SET_CURRENT_WORKSPACE(option));
        setIsOpen(false);
    }

    /**
     * @derived allWorkspaces
     * Transforms normalized state back into an array for rendering.
     * Uses a filter(Boolean) to ensure data integrity during mapping.
     */
    const allWorkspaces = workspaceState.allIds
    .map(id => workspaceState.byId[id])
    .filter(Boolean) as ReduxWorkSpace[];

    return(
    <div className="relative inline-block text-left w-full">
        {/* Active Workspace Trigger */}
        <div>
            <span onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                { currentWorkspace ?
                 <SelectedWorkspaces workspace={currentWorkspace} /> 
                 : 
                 ( 'Select  a workspace' )
                }
            </span>
        </div>

        {/* Dropdown Menu Overlay */}
        { isOpen && (
            <div className="origin-top-right absolute w-full rounded-md shadow-md z-50 bg-black/10
             backdrop-blur-lg group overflow-scroll border-[1px] border-muted p-2">
                <div className="rounded-md flex flex-col">
                    <div className="!p-2">
                        {allWorkspaces.length > 0 && (
                            
                            <>
                                <p className="text-muted-foreground text-sm mb-1">All Workspace</p>
                                <hr className="border-x-muted-foreground/20 mb-2"></hr>
                                {allWorkspaces.map((option,index) => (
                                    <SelectedWorkspaces 
                                    // key={option._id}
                                    key={index}
                                    workspace={option}
                                    onClick={() => handleSelect(option)}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    {/* Workspace Creation Action */}
                    <CustomDialogTrigger
                     content={<DashboardSetup />}
                      >
                        <div className="flex transition-all hover:bg-muted justify-center items-center
                         gap-2 p-2 w-full rounded-lg">
                            <article className="text-slate-500 rounded-full bg-slate-800 w-4 h-4 flex
                             items-center justify-center">
                                +
                            </article>
                            Create Workspace
                         </div>
                      </CustomDialogTrigger>
                </div>
            </div>
        )}
    </div>
)
}

export default WorkspaceDropdown
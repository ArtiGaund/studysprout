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

import React, { useEffect, useRef, useState } from "react"
import SelectedWorkspaces from "./selected-workspaces";
import CustomDialogTrigger from "../global/custom-dialog";
import DashboardSetup from "../dashboard-setup/dashboard-setup";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ReduxWorkSpace } from "@/types/state.type";
import { SET_CURRENT_WORKSPACE } from "@/store/slices/workspaceSlice";
import WorkspaceCreateForm from "./workspace-create-form";
import { ChevronDown, Plus } from "lucide-react";

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
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if(dropdownRef.current && !dropdownRef.current.contains(event.target as Node)){
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    },[]);

    return(
    // <div 
    //     ref={dropdownRef}
    //     className="relative inline-block text-left w-full select-none"
    // >
    //     {/* Active Workspace Trigger */}
    //     <div>
    //         <span onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
    //             { currentWorkspace ?
    //              <SelectedWorkspaces workspace={currentWorkspace} /> 
    //              : 
    //              ( 'Select  a workspace' )
    //             }
    //         </span>
    //     </div>

    //     {/* Dropdown Menu Overlay */}
    //     { isOpen && (
    //         <div className="origin-top-right absolute w-full rounded-md shadow-md z-50 bg-black/10
    //          backdrop-blur-lg group overflow-scroll border-[1px] border-muted p-2">
    //             <div className="rounded-md flex flex-col">
    //                 <div className="!p-2">
    //                     {allWorkspaces.length > 0 && (
                            
    //                         <>
    //                             <p className="text-muted-foreground text-sm mb-1">All Workspace</p>
    //                             <hr className="border-x-muted-foreground/20 mb-2"></hr>
    //                             {allWorkspaces.map((option,index) => (
    //                                 <SelectedWorkspaces 
    //                                 // key={option._id}
    //                                 key={index}
    //                                 workspace={option}
    //                                 onClick={() => handleSelect(option)}
    //                                 />
    //                             ))}
    //                         </>
    //                     )}
    //                 </div>

    //                 {/* Workspace Creation Action */}
    //                 <CustomDialogTrigger
    //                  content={ <WorkspaceCreateForm />}
    //                   >
    //                     <div className="flex transition-all hover:bg-muted justify-center items-center
    //                      gap-2 p-2 w-full rounded-lg">
    //                         <article className="text-slate-500 rounded-full bg-slate-800 w-4 h-4 flex
    //                          items-center justify-center">
    //                             +
    //                         </article>
    //                         Create Workspace
    //                      </div>
    //                   </CustomDialogTrigger>
    //             </div>
    //         </div>
    //     )}
    // </div>
        <div
            ref={dropdownRef}
            className="relative inline-block text-left w-full select-none"
        >
            {/* Dropdown Action Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full bg-[#141416]/40 border
                border-white/[0.04] hover:bg-white/[0.02] p-2 rounded-xl cursor-pointer
                transition-all duration-200"
            >
                <div className="min-w-0 flex-1">
                    {currentWorkspace ? 
                        <SelectedWorkspaces workspace={currentWorkspace}/>
                    : 
                        <span className="text-zinc-400 text-sm pl-1 font-medium">
                            Select a workspace
                        </span>
                    }
                </div>
                <ChevronDown 
                    size={14}
                    className={`text-zinc-500 shrink-0 mr-1 transition-transform duration-200
                        ${isOpen ? "rotate-180" : ""}`}
                />
            </div>

            {/* Dropdown Menu Overlay Panel */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-full rounded-xl bg-[#141416] border
                border-white/10 shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95 duration-150
                max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="flex flex-col w-full">
                        {allWorkspaces.length > 0 && (
                            <div className="px-1 py-1">
                                <p className="text-zinc-500 font-mono font-bold text-[10px]
                                tracking-wider uppercase px-2 py-1 select-none">
                                    All Workspaces
                                </p>
                                <div className="space-y-0.5 mt-1">
                                    {allWorkspaces.map((option, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleSelect(option)}
                                            className={`w-full rounded-lg transition-colors p-1
                                            cursor-pointer hover:bg-white/[0.04]
                                            ${currentWorkspace?._id === option._id
                                                ? "bg-white/[0.02] pointer-events-none" : ""
                                            }`}
                                        >
                                            <SelectedWorkspaces workspace={option}/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-white/[0.04] my-1 mx-1"/>

                        {/* Workspace Creation Action Module */}
                        <CustomDialogTrigger content={<WorkspaceCreateForm />}>
                            <div className="flex transition-colors hover:bg-purple-600/10
                            text-zinc-300 hover:text-purple-400 justify-start items-center
                            gap-x-2.5 px-3 py-2 w-full rounded-lg text-xs font-semibold
                            cursor-pointer mb-0.5">
                                <div className="w-4 h-4 rounded-md bg-zinc-800 border border-white/5
                                flex items-center justify-center text-zinc-400">
                                    <Plus size={10} strokeWidth={3}/>
                                </div>
                                <span>Create Workspace</span>
                            </div>
                        </CustomDialogTrigger>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WorkspaceDropdown
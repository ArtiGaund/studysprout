"use client"
import { WorkSpace } from "@/model/workspace.model";
import React, { useEffect, useState } from "react"
import SelectedWorkspaces from "./selected-workspaces";
import CustomDialogTrigger from "../global/custom-dialog";
import DashboardSetup from "../dashboard-setup/dashboard-setup";

interface WorkspaceDropdownProps{
    workspaces: WorkSpace[] | [];
    defaultValue: WorkSpace | undefined
}


// this component will allow the user to select between the different workspaces
const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({ workspaces, defaultValue }) => {
    // const { state, dispatch } = useAppState()

    const [ selectedOption, setSelectedOption ] = useState(defaultValue)
    const [ isOpen, setIsOpen ] = useState(false)

    // TODO: check whether our state has any workspaces or not (to set all the workspaces)
    useEffect(() => {
        // if(!state.workspaces.length){
        //     dispatch({
        //         type: 'SET_WORKSPACES',
        //         payload: {
        //             workspaces: [
        //                 ...workspaces
        //             ].map((workspace) => ({ ...workspace, folders: []})),
        //         }
        //     })
        // }
    }, [workspaces])

    // handle select
    const handleSelect = ( option: WorkSpace ) => {
        setSelectedOption(option)
        setIsOpen(false)
    }
    return(
    <div className="relative inline-block text-left">
        <div>
            <span onClick={() => setIsOpen(!isOpen)}>
                { selectedOption ?
                 <SelectedWorkspaces workspace={selectedOption} /> 
                 : 
                 ( 'Select  a workspace' )
                }
            </span>
        </div>
        { isOpen && (
            <div className="origin-top-right absolute w-full rounded-md shadow-md z-50 h-[190px] bg-black/10 backdrop-blur-lg group overflow-scroll border-[1px] border-muted">
                <div className="rounded-md flex flex-col">
                    <div className="!p-2">
                        {!!workspaces.length && (
                            
                            <>
                                <p className="text-muted-foreground">All Workspace</p>
                                <hr></hr>
                                {workspaces.map((option,index) => (
                                    <SelectedWorkspaces 
                                    // key={option._id}
                                    key={index}
                                    workspace={option}
                                    onClick={handleSelect}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                    <CustomDialogTrigger
                     content={<DashboardSetup />}
                      >
                        <div className="flex transition-all hover:bg-muted justify-center items-center
                         gap-2 p-2 w-full">
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
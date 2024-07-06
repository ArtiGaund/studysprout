"use client"
import { WorkSpace } from "@/model/workspace.model";
import React, { useEffect, useState } from "react"
import SelectedWorkspaces from "./selected-workspaces";
import CustomDialogTrigger from "../global/custom-dialog";
import DashboardSetup from "../dashboard-setup/dashboard-setup";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface WorkspaceDropdownProps{
    workspaces: WorkSpace[] | [];
    defaultValue: WorkSpace | undefined
}


// this component will allow the user to select between the different workspaces
const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({ workspaces, defaultValue }) => {
    // const { state, dispatch } = useAppState()
    const state = useSelector((state: RootState) => state.workspace);
    const [ selectedOption, setSelectedOption ] = useState(defaultValue)
    const [ isOpen, setIsOpen ] = useState(false)

    // if there is any changes done in workspace it will show changes in real time
    useEffect(() => {
       const findSelectedWorkspace = state.workspaces.find(
        (workspace) => workspace._id === defaultValue?._id
       )
       if(findSelectedWorkspace) setSelectedOption(findSelectedWorkspace)
    }, [state, defaultValue])

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
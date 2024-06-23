'use client'
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
    // TODO add dispatch later to set all workspaces once this component is invoked
    const [ selectedOption, setSelectedOption ] = useState(defaultValue)
    const [ isOpen, setIsOpen ] = useState(false)

    // TODO: check whether our state has any workspaces or not (to set all the workspaces)
    // useEffect(() => {

    // }, [workspaces])

    // handle select
    const handleSelect = ( option: WorkSpace ) => {
        setSelectedOption(option)
        setIsOpen(false)
    }
    // console.log("default values in workspace deropdown ",defaultValue)
    // console.log("Workspace in workspace dropdown ",workspaces)
    // console.log("Workspace id in workspace dropdown ",workspaces[0]._id)
    // console.log("Selected option ",selectedOption)
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
                                {workspaces.map((option) => (
                                    <SelectedWorkspaces 
                                    key={option.id}
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
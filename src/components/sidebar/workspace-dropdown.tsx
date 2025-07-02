"use client"
import { WorkSpace } from "@/model/workspace.model";
import React, { useEffect, useState } from "react"
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
    // const { state, dispatch } = useAppState()
    const workspaceState = useSelector((state: RootState) => state.workspace);
    const [ selectedOption, setSelectedOption ] = useState<ReduxWorkSpace | undefined>(defaultValue)
    const [ isOpen, setIsOpen ] = useState(false)
    const dispatch = useDispatch();

    // if there is any changes done in workspace it will show changes in real time
    // useEffect(() => {
    //    const findSelectedWorkspace = state.workspaces.find(
    //     (workspace) => workspace._id === defaultValue?._id
    //    )
    //    if(findSelectedWorkspace) setSelectedOption(findSelectedWorkspace)
    // }, [state, defaultValue])

    useEffect(() => {
        const currentWorkspace = workspaceState.currentWorkspace
        ? workspaceState.byId[workspaceState.currentWorkspace]
        : undefined;

        if(currentWorkspace && currentWorkspace._id !==selectedOption?._id){
            setSelectedOption(currentWorkspace);
        }else if(!currentWorkspace && selectedOption){
            setSelectedOption(undefined);
        }else if(!selectedOption && defaultValue){
            setSelectedOption(defaultValue);
        }
    },[ workspaceState.currentWorkspace, workspaceState.byId, selectedOption, defaultValue ])
    // handle select
    const handleSelect = ( option: ReduxWorkSpace ) => {
        setSelectedOption(option)
        dispatch(SET_CURRENT_WORKSPACE(option._id));
        setIsOpen(false);
    }

    const allWorkspaces = workspaceState.allIds.map(id => workspaceState.byId[id]);
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
                        {allWorkspaces.length > 0 && (
                            
                            <>
                                <p className="text-muted-foreground">All Workspace</p>
                                <hr></hr>
                                {workspaces.map((option,index) => (
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
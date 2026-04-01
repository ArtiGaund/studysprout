/**
 * @component WorkspaceAccessControl
 * @description A high-level wrapper that controls access to the Workspace Management dialog.
 * * Logic:
 * - State-Driven Interaction: Uses the `editable` prop to toggle between an interactive 
 * trigger and a read-only visual state.
 * - Modality: Abstracts the complex `WorkspaceMembersManager` logic inside a `CustomDialogTrigger` 
 * to keep the header UI clean and performant.
 */
'use client';

import CustomDialogTrigger from "../global/custom-dialog";
import WorkspaceMembersAvatarGroup from "./workspace-members-avatar-group";
import WorkspaceMembersManager from "./workspace-members-manager";

const WorkspaceAccessControl = ({ 
    editable,
    workspaceId
 }: { 
    editable?: boolean;
    workspaceId: string
}) => {
    return(
        <div className={`flex items-center gap-2 ${editable ? 'cursor-pointer' : 'cursor-not-allowed'} `}>
          { editable && (
            <CustomDialogTrigger
            header="Workspace Access"
            content={
                <WorkspaceMembersManager workspaceId={workspaceId}/>
            }
            >
                 <WorkspaceMembersAvatarGroup workspaceId={workspaceId}/>
            </CustomDialogTrigger>)}
        </div>
    )
}

export default WorkspaceAccessControl;
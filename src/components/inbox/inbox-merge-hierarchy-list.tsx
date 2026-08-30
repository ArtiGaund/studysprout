"use client";

import { useFile } from "@/hooks/useFile";
import { useFolder } from "@/hooks/useFolder";
import { useWorkspace } from "@/hooks/useWorkspace";
import { makeSelectFiles, selectFileLoading } from "@/store/selectors/fileSelector";
import { makeSelectFolders, selectFolderLoading } from "@/store/selectors/folderSelector";
import { selectWorkspaceLoading, selectWorkspaces } from "@/store/selectors/workspaceSelector";
import { RootState } from "@/store/store";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { Loader2, Plus, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import InboxMergePickerItem from "./inbox-merge-picker-item";
import { Button } from "../ui/button";
import CustomDialogTrigger from "../global/custom-dialog";
import WorkspaceCreateForm from "../sidebar/workspace-create-form";

interface InboxMergeHierarchyListProps{
    onConfirm: (fileId: string, fileTitle: string) => void;
}

const InboxMergeHierarchyList: React.FC<InboxMergeHierarchyListProps> = ({ onConfirm }) => {
    const workspaces = useSelector(selectWorkspaces);

    const foldersByWorkspace = useSelector((state: RootState) => state.folder.foldersByWorkspace);
    const filesByFolder = useSelector((state: RootState) => state.file.filesByFolder);

    const isLoadingWorkspace = useSelector(selectWorkspaceLoading);
    const isLoadingFolder = useSelector(selectFolderLoading);
    const isLoadingFile = useSelector(selectFileLoading);

    const allFolders = useMemo(() => {
        let combined: ReduxFolder[] = [];
        workspaces.forEach((ws) => {
            const workspaceFolders = foldersByWorkspace[ws._id];
            if(!workspaceFolders) return;
            combined = combined.concat(
                workspaceFolders.allIds.map((id) => workspaceFolders.byId[id])
            );
        });
        return combined;
    },[
        workspaces,
        foldersByWorkspace,
    ]);

    const allFiles = useMemo(() => {
        let combined: ReduxFile[] = [];
        allFolders.forEach((folder) => {
            const folderFiles = filesByFolder[folder._id];
            if(!folderFiles) return;
            combined = combined.concat(
                folderFiles.allIds.map((id) => folderFiles.byId[id])
            );
        });
        return combined;
    },[
        allFolders,
        filesByFolder,
    ]);

    const [ expandedIds, setExpandedIds ] = useState<Set<string>>(new Set());
    const [ selectedFileId, setSelectedFileId ] = useState<string | null>(null);
    const [ workspaceDialogOpen, setWorkspaceDialogOpen ] = useState(false);
    
    const { createFile } = useFile();
    const { createFolder } = useFolder();
    const { createWorkspace } = useWorkspace();

    const toggleExpansion = (id: string) => {
        setExpandedIds((prev) => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const selectedFileTitle = useMemo(() => {
        if(!selectedFileId) return "";
        return allFiles.find((f) => f._id === selectedFileId)?.title ?? "";
    },[ selectedFileId, allFiles ]);

    const handleSelectFile = (id: string) => {
        setSelectedFileId(id);
    }

    const handleCreateWorkspace = (workspace: ReduxWorkSpace) => {
        setExpandedIds((prev) => new Set(prev).add(workspace._id));
        setWorkspaceDialogOpen(false);
    };

    const handleCreateFolder = async (workspaceId: string) => {
        const result = await createFolder(workspaceId);
        if(result.success && result.data){
            setExpandedIds((prev) => new Set(prev).add(result.data!._id));
        }
    }

    const handleCreateFile = async (folderId: string) => {
        const parentFolder = allFolders.find((f) => f._id === folderId);
        if(!parentFolder){
            console.error("[InboxMergeHierarchyList] Cannot create file: parent folder not found for ",folderId);
            return;
        }
        const result = await createFile({folderId, workspaceId: parentFolder.workspaceId});
        if(result.success && result.data){
            setSelectedFileId(result.data._id);
        }
    };

    const isLoading = isLoadingWorkspace || isLoadingFolder || isLoadingFile;

    if(isLoading){
        return (
            <div className="flex justify-center items-center h-full min-h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500"/>
                <span className="ml-2 text-gray-500">Loading resources...</span>
            </div>
        )
    }

    return (
       <DialogContent>
            <DialogHeader>
                <DialogTitle>Choose where to save this</DialogTitle>
                <DialogDescription>
                    Pick an existing file, or create a new workspace/folder/file to hold this content.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-row gap-2 text-sm">
                <span className="text-gray-500">Selected file:</span>
                <span className="text-[#63FF9D]">{selectedFileTitle || "None yet"}</span>
            </div>

            {/* New Workspace affordance sits above the tree, since it's a root-level action */}
            <div className="flex items-center justify-between px-2">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Workspaces</span>
                <span 
                    onClick={() => setWorkspaceDialogOpen(true)}
                    className="text-xs text-[#63FF9D] hover:underline cursor-pointer"
                >
                    <PlusIcon size={12}/> New Workspace
                </span>
            </div>
    
            <CustomDialogTrigger
                open={workspaceDialogOpen}
                onOpenChange={setWorkspaceDialogOpen}
                content={<WorkspaceCreateForm onSuccess={handleCreateWorkspace}/>}
            >
                <></>
            </CustomDialogTrigger>
            <div className="h-auto max-h-[320px] overflow-y-auto">
                <div className="flex flex-col gap-1 p-2">
                    {workspaces.map((workspace) => (
                        <InboxMergePickerItem 
                            key={workspace._id}
                            resource={workspace as ReduxWorkSpace}
                            resourceType="Workspace"
                            level={0}
                            allFolders={allFolders}
                            allFiles={allFiles}
                            selectedFileId={selectedFileId}
                            onSelectFile={handleSelectFile}
                            onCreateFolder={handleCreateFolder}
                            onCreateFile={handleCreateFile}
                            isExpanding={expandedIds.has(workspace._id)}
                            onToggle={toggleExpansion}
                            expandedIds={expandedIds}
                        />
                    ))}
                </div>
            </div>

            <DialogFooter>
                <DialogClose asChild>
                    <Button
                        disabled={!selectedFileId}
                        className="w-[10rem] h-auto bg-purple-950 hover:bg-purple-800 disabled:opacity-40"
                        onClick={() => selectedFileId && onConfirm(selectedFileId, selectedFileTitle)}
                    >
                        Merge Here
                    </Button>
                </DialogClose>
            </DialogFooter>
       </DialogContent>
    )
}

export default InboxMergeHierarchyList;
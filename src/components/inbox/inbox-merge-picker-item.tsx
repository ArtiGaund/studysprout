"use client";

import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { IconChevronRight, IconPlus } from "@tabler/icons-react";
import { twMerge } from "tailwind-merge";

interface InboxMergePickerItemProps{
    resource: ReduxWorkSpace | ReduxFolder | ReduxFile;
    resourceType: "Workspace" | "Folder" | "File";
    level: number;
    allFolders: ReduxFolder[];
    allFiles: ReduxFile[];
    selectedFileId: string | null;
    onSelectFile: (id: string) => void;
    onCreateFolder: (workspaceId: string) => void;
    onCreateFile: (folderId: string) => void;
    isExpanding: boolean;
    onToggle: (id: string) => void;
    expandedIds: Set<string>;
}

const InboxMergePickerItem: React.FC<InboxMergePickerItemProps> = ({
    resource,
    resourceType,
    level,
    allFolders,
    allFiles,
    selectedFileId,
    onSelectFile,
    onCreateFolder,
    onCreateFile,
    isExpanding,
    onToggle,
    expandedIds,
}) => {
    const isExpandable = resourceType !== "File";
    const resourceId = resource._id;
    const resourceTitle = resource.title;

    const childFolders = resourceType === "Workspace"
        ? allFolders.filter((folder) => folder.workspaceId === resourceId && !folder.inTrash)
        : [];

    const childFiles = resourceType === "Folder"
        ? allFiles.filter((file) => file.folderId === resourceId && !file.inTrash)
        : [];

    const children = [ ...childFolders, ...childFiles ];
    const hasChildren = children.length > 0;

    const paddingLeft = level * 10 + 4;
    const Icon = resource.iconId;

    return (
        <div className="flex flex-col font-mono text-xs">
            <div
                className="flex items-center w-full py-1.5 rounded-md hover:bg-white/5 group
                transition-colors"
                style={{ paddingLeft: `${paddingLeft}px`}}
            >
                <span
                    className="flex items-center w-4 h-4 mr-2 cursor-pointer text-neutral-500
                     hover:text-white"
                    onClick={() => isExpandable && hasChildren && onToggle(resourceId)}
                >
                    {isExpandable && hasChildren && (
                        <IconChevronRight 
                            className={twMerge(
                                "w-4 h-4 transition-transform",
                                isExpanding && "rotate-90 text-purple-400"
                            )}
                        />
                    )}
                </span>

                <div 
                    className={twMerge(
                        "flex items-center flex-grow truncate px-1.5 py-1 rounded-md transition-colors",
                        resourceType === "File" && "cursor-pointer hover:bg-white/10",
                        resourceType === "File" && selectedFileId === resourceId && 
                        "bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold"
                    )}
                    onClick={() => resourceType === "File" && onSelectFile(resourceId)}
                >
                    <span className="w-5 h-5 mr-2 text-purple-400 shrink-0">{Icon}</span>
                    <span className="text-sm truncate">{resourceTitle}</span>
                </div>

                {/* Workspace rows: create folder*/}
                {resourceType === "Workspace" && (
                    <button
                        onClick={() => onCreateFolder(resourceId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 
                        text-neutral-400 hover:text-white hover:bg-white/10 mr-1
                        rounded"
                        title="New Folder"
                    >
                        <IconPlus size={14}/>
                    </button>
                )}
                 {resourceType === "Folder" && (
                    <button
                        onClick={() => onCreateFile(resourceId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1
                         text-neutral-400 hover:text-white hover:bg-white/10 mr-1
                        rounded"
                        title="New File"
                    >
                        <IconPlus size={14}/>
                    </button>
                )}
            </div>

            {isExpanding && hasChildren && (
                <div className="flex flex-col">
                    {children.map((child) => {
                        const childIsFile = (child as ReduxFile).folderId !== undefined;
                        const childType = childIsFile ? "File" : "Folder";
                        return (
                            <InboxMergePickerItem 
                                key={child._id}
                                resource={child}
                                resourceType={childType}
                                level={level+1}
                                allFolders={allFolders}
                                allFiles={allFiles}
                                selectedFileId={selectedFileId}
                                onSelectFile={onSelectFile}
                                onCreateFolder={onCreateFolder}
                                onCreateFile={onCreateFile}
                                isExpanding={isExpanding && expandedIds.has(child._id)}
                                onToggle={onToggle}
                                expandedIds={expandedIds}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InboxMergePickerItem;
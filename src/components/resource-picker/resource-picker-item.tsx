"use client";

import { RootState } from "@/store/store";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { IconChevronRight, IconFile, IconFolder, IconWorld } from "@tabler/icons-react";
import React from "react";
import { useSelector } from "react-redux";
import { twMerge } from "tailwind-merge";

interface ResourcePickerItemProps{
    resource: ReduxWorkSpace | ReduxFolder | ReduxFile;
    resourceType: "Workspace" | "Folder" | "File";
    level: number; //For indentation
    allFolders: ReduxFolder[];
    allFiles: ReduxFile[];
    onSelect: (id: string, title: string, type: 'Workspace' | 'Folder' | 'File') => void;

    // state to  manage local expansion
    isExpanding: boolean;
    onToggle: (id: string) => void;
    expandedIds: Set<string>;
}

const ResourcePickerItem: React.FC<ResourcePickerItemProps> = ({
    resource,
    resourceType,
    level,
    allFolders,
    allFiles,
    onSelect,
    isExpanding,
    onToggle,
    expandedIds
}) => {
    
    const currentContext = useSelector((state: RootState) => state.context.currentResource);
    const isFolderOrWorkspace = resourceType !== 'File';
    const resourceId = resource._id;
    const resourceTitle = resource.title;

    // 1. Filter Logic: Determine Children for this Resource

    // Find direct child folders and files that are NOT in trash
    const childFolders = isFolderOrWorkspace
     ? allFolders.filter(folder => 
        folder.workspaceId === resourceId && 
        !folder.inTrash
    ) : [];

    const childFiles = allFiles.filter(file => file.folderId === resourceId && !file.inTrash);

    // Combine folders and files for consistent rendering order
    const children = [...childFolders, ...childFiles];
    const hasChildren = children.length > 0;

    // 2. Render Utilities

    const Icon = resource.iconId;

    // calculating indentation
    const paddingLeft = level*10+4; //10px per level, starting offset of 4

    
   
    return(
        <div className="flex flex-col">
            <div
            className="flex items-center w-full py-1.5 rounded-md cursor-pointer hover:bg-gray-800 transition-colors"
            style={{ paddingLeft: `${paddingLeft}px`}}
            >
                {/* Expansion toggle button (only for folders and workspaces) */}
                <span 
                className="flex items-center w-4 h-4 mr-2"
                onClick={() => isFolderOrWorkspace && hasChildren && onToggle(resourceId)}
                >
                    {isFolderOrWorkspace && hasChildren && (
                        <IconChevronRight 
                        className={twMerge("w-4 h-4 transition-transform", isExpanding && "rotate-90")}
                        />
                    )}
                </span>

                {/* Icon and Title */}
                <div
                className={`flex items-center flex-grow truncate
                     ${currentContext.id === resourceId && 'bg-purple-950 p-2 rounded-md'}`}
                onClick={() => onSelect(resourceId, resourceTitle, resourceType)}
                >
                    <span className="w-5 h-5 mr-2 text-purple-400">{Icon}</span>
                    <span className="text-sm truncate">{resourceTitle}</span>
                </div>
            </div>

            {/* 4. Recursive rendering of children (only when expanded) */}
            {isExpanding && hasChildren && (
                <div className="flex flex-col">
                    {children.map((child) => {
                        const childIsFile = (child as ReduxFile).folderId !== undefined;
                        const childResourceType = childIsFile ? 'File' : 'Folder';
                        return (
                            <ResourcePickerItem 
                            key={child._id}
                            resource={child}
                            resourceType={childResourceType}
                            level={level+1}
                            allFolders={allFolders}
                            allFiles={allFiles}
                            isExpanding={isExpanding && expandedIds.has(child._id)}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            expandedIds={expandedIds}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default ResourcePickerItem;
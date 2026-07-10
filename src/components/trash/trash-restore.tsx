/**
 * @component TrashRestore
 * @description Provides a centralized interface for viewing and navigating deleted content.
 * * * Features:
 * - Dynamic Filtering: Filters the global 'Trash' state from Redux to show only items 
 * relevant to the active workspace.
 * - Polymorphic Linking: Correctly constructs navigation paths based on whether 
 * the item is a top-level Folder or a nested File.
 * - Empty State Management: Renders a centered feedback message when no items are found.
 */
"use client"

import { useWorkspace } from "@/hooks/useWorkspace";
import { selectTrashFiles } from "@/store/selectors/fileSelector";
import { selectTrashFolders } from "@/store/selectors/folderSelector";
import { RootState } from "@/store/store";
import { FileIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";


const TrashRestore = () => {
    const {
        currentWorkspace
    } = useWorkspace();
    
    const workspaceId = currentWorkspace?._id;

    // --- Filtering Logic ---
    // Ensures users only see trash from their currently active workspace
    const workspaceTrashFolder = useSelector((state: RootState) => 
    selectTrashFolders(state, workspaceId)
    );

    const workspaceTrashFile = useSelector((state: RootState) =>
    selectTrashFiles(state, workspaceId)
    );
    // Safety check: Don't render if the workspace context isn't loaded
    if(!workspaceId) return null;

    return(
        <section className="p-4 flex flex-col gap-4">
            {workspaceTrashFolder.length >0 && (
            <div className="flex flex-col gap-1">
                <h3 className="text-xs font-medium text-muted-foreground px-2">
                    Folders
                </h3>
                {/* Folder Recovery List */}
                {workspaceTrashFolder.map((folder) => (
                     <Link 
                     href={`/dashboard/${folder.workspaceId}/${folder._id}`} 
                     key={folder._id}
                     className="hover:bg-neutral-800/50 rounded-md p-2 flex items-center 
                     justify-between group transition-colors"
                     >
                        <article>
                            <aside className="flex items-center gap-2">
                                <FolderIcon />
                                {folder.title}
                            </aside>
                        </article>
                    </Link>
                ))}
            </div>
        )}

        {/* File Recovery List */}
        {workspaceTrashFile.length>0 && (
            <div className="flex flex-col gap-1">
                <h3 className="text-xs font-medium text-muted-foreground px-2">Files</h3>
                {workspaceTrashFile.map((file) => (
                    <Link 
                    href={`/dashboard/${file.workspaceId}/${file.folderId}/${file._id}`} 
                    key={file._id}
                   className="hover:bg-neutral-800/50 rounded-md p-2 flex items-center 
                   justify-between group transition-colors"
                    >
                       <article>
                           <aside className="flex items-center gap-2">
                               <FileIcon />
                               {file.title}
                           </aside>
                       </article>
                   </Link>
                ))}
            </div>
        )}

        {/* Empty State UI */}
        {!workspaceTrashFile.length && !workspaceTrashFolder.length && (
            <div className="text-muted-foreground absolute top-[50%] left-[50%] transform
             -translate-x-1/2 -translate-y-1/2">
                No Items in Trash
            </div>
        )}
        </section>
    )
}

export default TrashRestore
"use client"
import { RootState } from "@/store/store";
import { Folder } from "@/types/folder";
import { File } from "@/types/file";
import { FileIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const TrashRestore = () => {
    // const state = useSelector((state: RootState) => state.workspace)
    // const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace?._id)
    // const folderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    // const dispatch = useDispatch()
    const allFolders = useSelector((state: RootState) => state.folder.folders)
    const allFiles = useSelector((state: RootState) => state.file.files)
    const [ folders, setFolders ] = useState<Folder[] | []>([])
    const [ files, setFiles ] = useState<File[] | []>([])

    // useEffect(() => {
    //     const stateWorkspace = state.workspaces.find((workspace) => workspace._id === workspaceId)
    //     const stateFolder = stateWorkspace?.folders?.filter((folder) => folder.inTrash) || []
    //     setFolders(stateFolder)

    //     let stateFiles: File[] = []
    //     const folderForFiles = stateWorkspace
    //     ?.folders?.forEach(folder => 
    //         folder.files?.forEach(file => {
    //             if(file.inTrash){
    //                 stateFiles.push(file)
    //             }
    //         }))
        
    //     setFiles(stateFiles)
    // }, [state, workspaceId ])
    useEffect(() => {
        setFolders(allFolders.filter(folder => folder.inTrash));
        setFiles(allFiles.filter(file => file.inTrash));
    }, [allFolders, allFiles])

    
    return(
        <section>{folders.length && (
            <>
                <h3>Folders</h3>
                {folders.map((folder) => (
                     <Link 
                     href={`/dashboard/${folder.workspaceId}/${folder._id}`} 
                     key={folder._id}
                     className="hover:bg-muted rounded-md p-2 flex items-center justify-between"
                     >
                        <article>
                            <aside className="flex items-center gap-2">
                                <FolderIcon />
                                {folder.title}
                            </aside>
                        </article>
                    </Link>
                ))}
            </>
        )}
        {files.length && (
            <>
                <h3>Files</h3>
                {files.map((file) => (
                    <Link 
                    href={`/dashboard/${file.workspaceId}/${file.folderId}/${file._id}`} 
                    key={file._id}
                    className="hover:bg-muted rounded-md p-2 flex items-center justify-between"
                    >
                       <article>
                           <aside className="flex items-center gap-2">
                               <FileIcon />
                               {file.title}
                           </aside>
                       </article>
                   </Link>
                ))}
            </>
        )}
        {!files.length && !folders.length && (
            <div className="text-muted-foreground absolute top-[50%] left-[50%] transform
             -translate-x-1/2 -translate-y-1/2">
                No Items in Trash
            </div>
        )}
        </section>
    )
}

export default TrashRestore
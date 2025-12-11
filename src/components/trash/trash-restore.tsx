"use client"
import { useFile } from "@/hooks/useFile";
import { useFolder } from "@/hooks/useFolder";
import { ReduxFolder, ReduxFile } from "@/types/state.type";
import { FileIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";


const TrashRestore = () => {
   
    const [ folders, setFolders ] = useState<ReduxFolder[] | []>([])
    const [ files, setFiles ] = useState<ReduxFile[] | []>([])

    const {
        folders: allFolders,
    } = useFolder();
    const {
        files: allFiles,
    } = useFile();
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
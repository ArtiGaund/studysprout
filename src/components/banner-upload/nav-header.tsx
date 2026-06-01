'use client';

import { selectCurrentFolder, selectFolderById } from "@/store/selectors/folderSelector";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { RootState } from "@/store/store";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useToast } from "../ui/use-toast";
import { usePathname } from "next/navigation";
import { useTitleEditing } from "@/hooks/useTitleEditing";
import { useDir } from "@/hooks/useDir";
import { Button } from "../ui/button";
import Feedback from "../feedback/feedback";
import { Badge } from "../ui/badge";
import WorkspaceAccessControl from "../workspace/workspace-access-control";
import { Separator } from "../ui/separator";
import { BellIcon } from "lucide-react";
import { devNull } from "node:os";

interface NavHeaderProps{
    dirDetails: ReduxWorkSpace | ReduxFolder | ReduxFile;
    fileId: string;
    dirType: "workspace" | "folder" | "file"; 
}

export const NavHeader: React.FC<NavHeaderProps> = ({
    dirDetails,
    dirType,
    fileId,
}) => {

    // --- REDUX SELECTORS ---
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const currentFolder = useSelector(selectCurrentFolder);
       
    // Determines parent folder context specifically for 'file' types to build breadcrumbs accurately
    const parentFolderId = dirType === 'file'
        ? (dirDetails as ReduxFile).folderId
        : undefined;
    
    // Using existing selector to find the specific folder in the nested Redux State
    const parentFolder = useSelector((state: RootState) =>
        currentWorkspace?._id && parentFolderId
            ? selectFolderById(state, currentWorkspace._id, parentFolderId)
            : null
    );
    
    const pathname = usePathname()
       
    const isEditable = !dirDetails.inTrash;
    
    // --- CUSTOM HOOKS ---
    // Logic for handling title input, debouncing, and server-side syncing
    const {
        isCurrentlyEditingThisItem,
        displayedTitle,
    } = useTitleEditing({
            id: fileId,
            dirType,
            originalTitle: dirDetails?.title
    })
    
    // Directory-level operations (Restore, Delete, Icon/Banner updates)
    const {
        details,
        isLoading,
        isSaving,
        handleDelete,
        handleRestore,
    } = useDir({
            dirType,
            dirId: fileId,
            currentWorkspaceId: currentWorkspace?._id,
            currentFolderId: (dirDetails as ReduxFile).folderId ||currentFolder?._id,
            currentFileId: dirType === 'file' ? fileId : undefined
        })
     
    // Fallback logic ensuring the UI stays reactive during optimistic updates
    const effectiveDetails = details || dirDetails;
        
    /**
     * @memoized breadcrumbs
     * High-performance calculation of the navigation path.
     * Combines Workspace > Folder > File titles and icons
     */
    const breadCrumbsData = useMemo(() => {
           
        if(!pathname ||  !currentWorkspace) return null;

        // 1. Resolve Workspace
        const workspaceTitle = currentWorkspace.title || '';
        const workspaceIcon = currentWorkspace.iconId || '';
    
        // const workspaceBreadCrumb = `${currentWorkspace.iconId || ''} ${currentWorkspace.title || ''}`;
    
        // 2. Resolve Folder breadcramp
        let folderObj: ReduxFolder | null = null;
        if(dirType === 'file'){
            folderObj = parentFolder;
        }else if(dirType === 'folder'){
            folderObj = effectiveDetails as ReduxFolder;
        }
    
        let folderTitle = folderObj?.title ?? '';
        let folderIcon = folderObj?.iconId ?? '';
    
        // Reflects real-time title changes if the folder is currently being edited
        if(dirType === 'folder' && isCurrentlyEditingThisItem){
            folderTitle = displayedTitle ?? '';
        }
    
        // const folderBreadCrumb = folderTitle 
        //     ? `/ ${folderIconId} ${folderTitle}`
        //     : '';
    
        // 3. Resolve File breadcramp
        // let fileBreadCrumb = "";
        let fileTitle = "";
        let fileIcon = "";
        if(dirType === 'file'){
            fileTitle = effectiveDetails.title ?? '';
            fileIcon = effectiveDetails.iconId ?? '';
            if(isCurrentlyEditingThisItem){
                fileTitle = displayedTitle ?? '';
            }
            // fileBreadCrumb = `/ ${fileIconId} ${fileTitle}`;
        }
    
        // return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
        return {
            workspace: { title: workspaceTitle, icon: workspaceIcon },
            folder: folderTitle ? { title: folderTitle, icon: folderIcon } : null,
            file: fileTitle ? { title: fileTitle, icon: fileIcon } : null,
        };
    }, [
        pathname,
        currentWorkspace,
        dirType,
        isCurrentlyEditingThisItem,
        displayedTitle,
        effectiveDetails,
        parentFolder,
    ]);
    
    // --- RENDER LOGIC ---
    if (isLoading || !effectiveDetails) {
        return (
            <div className="flex justify-center items-center h-full">
                Loading {dirType} details...
            </div>
        );
    }
    const data = effectiveDetails as (ReduxWorkSpace & ReduxFolder & ReduxFile);

    return (
        <div className="w-full border-b border-white/5 bg-[#0b0b0c] select-none">
            {data?.inTrash && (
                <article className="w-full py-2 px-3 bg-[#EB5757] flex flex-col sm:flex-row  
                justify-center items-center gap-2 sm:gap-4 text-center">
                    <span className="text-white text-xs sm:text-sm font-medium">
                        This {dirType} is in Trash.
                    </span>
                    <div className="flex items-center gap-2">
                    <Button 
                        size={"sm"} 
                        variant={"outline"}
                        className="bg-transparent border-white text-white h-7 px-2.5
                        hover:bg-white hover:text-[#EB5757] text-xs font-medium"
                        onClick={handleRestore}
                        disabled={isLoading || !data}
                    >
                        Restore
                    </Button>
                    <Button
                        size={"sm"} 
                        variant={"outline"}
                        className="bg-transparent border-white text-white h-7 px-2.5
                        hover:bg-white hover:text-[#EB5757] text-xs font-medium"
                        onClick={() => {
                            handleDelete();
                        }}
                        disabled={isLoading || !data}
                    >
                        Delete
                    </Button>
                </div>
                <span className="text-sm text-white">
                    {data.inTrash}
                </span>
            </article>
        )}

        {/* Sub-Header: Path & Sync Status */}
        <div className="w-full h-14 pl-14 sm:pl-14 pr-3 sm:pr-4 flex items-center justify-between
         gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 flex items-center gap-x-1.5 text-xs sm:text-sm 
            font-medium text-[#e2e2f0] pr-1">
                {breadCrumbsData  && (
                    <>
                        {/* Workspace Node */}
                        <div className="flex items-center gap-x-1 min-w-0 shrink-0 max-w-[80px]
                        sm:max-w-[120px]">
                            <span>{breadCrumbsData.workspace.icon}</span>
                            <span className="truncate">
                                {breadCrumbsData.workspace.title}
                            </span>
                        </div>

                        {/* Folder Node */}
                        {breadCrumbsData.folder && (
                            <>
                                <span className="text-gray-600 shrink-0">/</span>
                                <div className="flex items-center gap-x-1 min-w-0 max-w-[70px]
                                sm:max-w-[120px]">
                                    <span>{breadCrumbsData.folder.icon}</span>
                                    <span className="truncate text-gray-400">
                                        {breadCrumbsData.folder.title}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* File Node */}
                        {breadCrumbsData.file && (
                            <>
                                <span className="text-gray-600 shrink-0">/</span>
                                <div className="flex items-center gap-x-1 min-w-0 max-w-[90px]
                                sm:max-w-[160px]">
                                    <span>{breadCrumbsData.file.icon}</span>
                                    <span className="truncate text-white font-semibold">
                                        {breadCrumbsData.file.title}
                                    </span>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Feedback editable={isEditable}/> 
                <Badge
                    variant="secondary"
                    className={`hidden xs:inline-flex h-5 px-1.5 text-[10px] font-medium 
                    border-none text-white transition-colors shrink-0
                    ${isSaving ? "bg-orange-600" : "bg-emerald-600"}`}
                >
                    {isSaving ? "Saving..." : "Saved"}
                </Badge>
                            
                {/* Divider */}
                <span className="w-px h-6 bg-gray-600 shrink-0" aria-hidden="true" />
                <button className="p-1 rounded-md text-gray-400 hover:text-white shrink-0
                hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer">
                    <BellIcon size={18}/>
                </button>
                <div className="shrink-0 flex items-center">
                    <WorkspaceAccessControl
                        workspaceId={currentWorkspace?._id!}
                        editable={isEditable}
                    />
                </div>
            </div>
        </div>  
    </div>
    )
}
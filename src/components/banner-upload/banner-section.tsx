/**
 * @component BannerSection
 * @description A dynamic header component for a Studysprout app.
 * It manages titles, emojis, banners, and breadcrumbs for three distinct directory level:
 * 1. Workspace
 * 2. Folder
 * 3. File
 * * Key Features:
 * - Context-Aware Breadcrumbs: Dynamically calculates path based on current directory type.
 * - Inline Editing: Managed via custom hooks for title and icon updates.
 * - Recovery UI: Integrated "Trash" state management with Restore/Delete actions.
 * - Real-time Status: Visual feedback for 'Saving' vs 'Saved' states using Redux selectors.
 */
"use client"

import React, { useCallback, useMemo } from "react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { usePathname } from "next/navigation";
import { Badge } from "../ui/badge";
import Image from "next/image";
import EmojiPicker from "../global/emoji-picker";
import BannerUpload from "./banner-upload";
import { XCircleIcon } from "lucide-react";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { useDir } from "@/hooks/useDir";
import { useTitleEditing } from "@/hooks/useTitleEditing";
import clsx from "clsx";

import Feedback from "../feedback/feedback";
import WorkspaceAccessControl from "../workspace/workspace-access-control";
import { useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { selectCurrentFolder, selectFolderById } from "@/store/selectors/folderSelector";
import { selectCurrentFile } from "@/store/selectors/fileSelector";
import { RootState } from "@/store/store";

interface BannerSectionProps{
    dirDetails: ReduxWorkSpace | ReduxFolder | ReduxFile;
    fileId: string;
    dirType: "workspace" | "folder" | "file";
}

const BannerSection: React.FC<BannerSectionProps> = ({
    dirDetails,
    fileId,
    dirType,
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

    const { toast } = useToast()
    const pathname = usePathname()

   
    const isEditable = !dirDetails.inTrash;

     // --- CUSTOM HOOKS ---
    // Logic for handling title input, debouncing, and server-side syncing
    const {
        isCurrentlyEditingThisItem,
        displayedTitle,
        handleKeyDown,
        handleSaveTitle,
        handleStartEditing,
        handleTitleChange,
        inputRef
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
        isRemovingBanner,
        bannerImageUrl,
        handleBannerUpload,
        handleDelete,
        handleRestore,
        handleDeleteBanner,
        handleIconChange,
        
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
    const breadCrumbs = useMemo(() => {
       
        if(!pathname ||  !currentWorkspace) return "";

        const workspaceBreadCrumb = `${currentWorkspace.iconId || ''} ${currentWorkspace.title || ''}`;

        // 1. Resolve Folder breadcramp
        let folderObj: ReduxFolder | null = null;
        if(dirType === 'file'){
            folderObj = parentFolder;
        }else if(dirType === 'folder'){
            folderObj = effectiveDetails as ReduxFolder;
        }

        let folderTitle = folderObj?.title ?? '';
        let folderIconId = folderObj?.iconId ?? '';

        // Reflects real-time title changes if the folder is currently being edited
        if(dirType === 'folder' && isCurrentlyEditingThisItem){
            folderTitle = displayedTitle ?? '';
        }

        const folderBreadCrumb = folderTitle 
        ? `/ ${folderIconId} ${folderTitle}`
        : '';

        // 2. Resolve File breadcramp
        let fileBreadCrumb = "";
        if(dirType === 'file'){
            let fileTitle = effectiveDetails.title ?? '';
            let fileIconId = effectiveDetails.iconId ?? '';
            if(isCurrentlyEditingThisItem){
                fileTitle = displayedTitle ?? '';
            }
            fileBreadCrumb = `/ ${fileIconId} ${fileTitle}`;
        }

        return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
      }, [
        pathname,
        currentWorkspace,
        dirType,
        isCurrentlyEditingThisItem,
        displayedTitle,
        effectiveDetails,
        parentFolder,
    ]);

    const handleDoubleClick = useCallback(() => {
        if(details?.inTrash){
            toast({
                title: "Cannot edit",
                description: `This ${dirType} is in trash and cannot be edited. Restore it first`,
                variant: "destructive"
            })
            return;
        }
       handleStartEditing();
    }, [
        details?.inTrash,
         dirType, 
         handleStartEditing, 
         toast
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

    return(
        <>
            {/* Trash Recovery Banner */}
            <div className="relative">
                {data?.inTrash && (
                    <article className="py-2 bg-[#EB5757] flex md:flex-row flex-col justify-center
                     items-center gap-4 flex-wrap">
                        <div className="flex flex-col md:flex-row gap-2 justify-center items-center">
                            <span className="text-white">
                                This {dirType} is in Trash.
                            </span>
                            <Button 
                            size={"sm"} 
                            variant={"outline"}
                            className="bg-transparent border-white text-white
                             hover:bg-white hover:text-[#EB5757]"
                             onClick={handleRestore}
                             disabled={isLoading || !data}
                             >Restore</Button>
                             <Button
                             size={"sm"} 
                             variant={"outline"}
                             className="bg-transparent border-white text-white
                              hover:bg-white hover:text-[#EB5757]"
                              onClick={() => {
                                    console.log("Delete button clicked!"); // <--- ADD THIS
                                    handleDelete();
                                }}
                              disabled={isLoading || !data}
                             >Delete</Button>
                        </div>
                        <span className="text-sm text-white">
                            {data.inTrash}
                        </span>
                     </article>
                )}

                {/* Sub-Header: Path & Sync Status */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between
                 justify-center sm:items-center sm:p-2 p-8">
                    <div>{breadCrumbs}</div>
                    <div className="flex items-center gap-3">
                        {isEditable ? 
                        <Feedback editable={true}/> 
                        : 
                        <Feedback editable={false}/>
                        }
                        { isSaving ? (
                            <Badge
                            variant="secondary"
                            className="bg-orange-600 top-4 text-white right-4 z-50"
                            >
                                Saving...
                            </Badge>
                        ) : (
                            <Badge
                            variant="secondary"
                            className="bg-emerald-600 top-4 text-white right-4 z-50"
                            >
                                Saved
                            </Badge>
                        )}
                        {isEditable ? 
                        <WorkspaceAccessControl
                        workspaceId={currentWorkspace?._id!}
                         editable={true}
                         />
                        : <WorkspaceAccessControl
                        workspaceId={currentWorkspace?._id!}
                        editable={false}
                        />
                        }
                    </div>
                </div>  
            </div>

            {/* Visual Assets Section */}
            {bannerImageUrl && (
                 <div className="relative w-full h-[200px]">
                 <Image 
                 src={bannerImageUrl}
                 fill
                 className="w-full md:h-48 h-20 object-cover"
                 alt="Banner Image"
                 priority={true}
                 />
             </div>
            )}
           
            <div className="flex justify-center items-center flex-col mt-2 relative">
                <div
                className="w-full self-center max-w-[800px] flex flex-col px-7 lg:my-8"
                >
                    {/* Collaborative Icon/Emoji Picker */}
                    <div
                     className="text-[80px]"
                     >
                        <EmojiPicker getValue={handleIconChange} editable={isEditable}>
                            <div className={`w-[100px] ${isEditable ? "cursor-pointer" : "cursor-not-allowed"} 
                            transition-colors h-[100px] flex
                             items-center justify-center hover:bg-muted rounded-xl`}>
                                {data.iconId}
                            </div>
                        </EmojiPicker>
                     </div>
                     {/* Banner Control UI*/}
                     <div className="flex">
                        {isEditable && (<BannerUpload
                        details={data}
                        id={fileId}
                        dirType={dirType}
                        className="mt-2 text-sm text-muted-foreground p-2 hover:text-card-foreground
                         transition-all rounded-md"
                        >
                            {data.bannerUrl ? "Update Banner" : "Add Banner"}
                        </BannerUpload>)}
                        {data.bannerUrl && isEditable &&
                        <Button
                        variant="ghost"
                        className="gap-2 hover:bg-background flex items-center justify-center mt-2
                         text-sm text-muted-foreground w-36 p-2 rounded-md"
                         onClick={handleDeleteBanner}
                        >   
                            <XCircleIcon size={16}/>
                            <span className="whitespace-nowrap font-normal">Remove Banner</span>
                        </Button>
                        }
                     </div>
                    {/* Adaptive Title Input: Switched between <span> and <input>*/}
                    { isCurrentlyEditingThisItem ? (
                        <input 
                        ref={inputRef}
                        type="text"
                        value={displayedTitle ?? ''}
                        className={clsx(
                                'outline-none text-3xl font-bold text-muted-foreground bg-muted',
                                'w-full h-9 overflow-hidden'
                            )}
                        onBlur={handleSaveTitle}
                        onChange={handleTitleChange}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        />
                    ): (
                        <span className="text-3xl font-bold text-muted-foreground h-9"
                         onDoubleClick={handleDoubleClick}
                        >
                        {displayedTitle} <span className="text-sm ml-2">({dirType.toUpperCase()})</span>
                    </span>
                    )}
                     
                </div>
                
            </div>
        </>
    )
}

export default BannerSection
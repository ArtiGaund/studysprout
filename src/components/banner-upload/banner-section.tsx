"use client"

import { RootState } from "@/store/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import { DELETE_FILE, UPDATE_FILE } from "@/store/slices/fileSlice";
import { DELETE_FOLDER, UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { DELETE_WORKSPACE, UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import Image from "next/image";
import EmojiPicker from "../global/emoji-picker";
import BannerUpload from "./banner-upload";
import { XCircleIcon } from "lucide-react";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
import { useDir } from "@/hooks/useDir";
import { setEditingItem, updateEditingItemTitle } from "@/store/slices/uiSlice";
import { useTitleEditing } from "@/hooks/useTitleEditing";
import clsx from "clsx";



interface BannerSectionProps{
    dirDetails: ReduxWorkSpace | ReduxFolder | ReduxFile;
    fileId: string;
    dirType: "workspace" | "folder" | "file";

}

var TOOLBAR_OPTIONS = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ header: 1 }, { header: 2 }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],
    ['clean'],
  ];
  
const BannerSection: React.FC<BannerSectionProps> = ({
    dirDetails,
    fileId,
    dirType
}) => {
    //  console.log("BannerSection mounted, fileId prop:", fileId, "dirType:", dirType);
    const workspaceState = useSelector((state: RootState) => state.workspace)
    const folderState = useSelector((state:RootState) => state.folder)
    const fileState = useSelector((state:RootState) => state.file)
    const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace)
    const currentFolderId = useSelector((state: RootState) => state.folder.currentFolder)
    const currentFileId = useSelector((state: RootState) => state.file.currentFile)

    const { workspaces } = useWorkspace();
    
    const dispatch = useDispatch()
    const { toast } = useToast()
    const pathname = usePathname()
    
    const router = useRouter()
    

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
        currentWorkspaceId: currentWorkspaceId?.toString(),
        currentFolderId: currentFolderId?.toString(),
        currentFileId: currentFileId?.toString()
    })
 

    

    
    const breadCrumbs = useMemo(() => {
       
        if(!pathname || !workspaceState.allIds || !currentWorkspaceId) return;
        const segments = pathname.split('/').filter((val) => val !== 'dashboard' && val);

        // access byId for more efficiency lookup
        const workspaceDetails = workspaceState.byId[currentWorkspaceId];
        const workspaceBreadCrumb = workspaceDetails 
        ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
        : '';
        if(segments.length === 1){
            return workspaceBreadCrumb;
        }
        const folderSegment = segments[1];
        const folderDetails = folderState.byId[currentFolderId!];
        const folderBreadCrumb = folderDetails
        ? `/ ${folderDetails.iconId} ${folderDetails.title}`
        : '';

        if(segments.length === 2){
            return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
        }

        const fileSegment = segments[2];
        const fileDetails = fileState.byId[fileId];
        const fileBreadCrumb = fileDetails 
        ? `/ ${fileDetails.iconId} ${fileDetails.title}`
        : '';

        return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
      }, [
         pathname,
          currentWorkspaceId,
          workspaceState.byId,
          currentFolderId,
          folderState.byId,
          fileId,
          fileState.byId,
          workspaceState.allIds
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

    // const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     dispatch(updateEditingItemTitle(e.target.value));
    // }

    // const handleBlur = async () => {
    //     if(!isCurrentlyEditingThisItem) return;

    //     const originalTitle = editingItem.originalTitle;
    //     const newTitle = editingItem.tempTitle.trim();
    // }

  if (isLoading || !details) {
        return (
            <div className="flex justify-center items-center h-full">
                Loading {dirType} details...
            </div>
        );
    }

    return(
        <>
            <div className="relative">
                {details?.inTrash && (
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
                             disabled={isLoading || !details}
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
                              disabled={isLoading || !details}
                             >Delete</Button>
                        </div>
                        <span className="text-sm text-white">
                            {details.inTrash}
                        </span>
                     </article>
                )}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between
                 justify-center sm:items-center sm:p-2 p-8">
                    <div>{breadCrumbs}</div>
                    <div className="flex items-center gap-4">
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
                    </div>
                </div>  
            </div>
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
                    {/* Icon image */}
                    <div
                     className="text-[80px]"
                     >
                        <EmojiPicker getValue={handleIconChange}>
                            <div className="w-[100px] cursor-pointer transition-colors h-[100px] flex
                             items-center justify-center hover:bg-muted rounded-xl">
                                {details.iconId}
                            </div>
                        </EmojiPicker>
                     </div>
                     {/* for banner */}
                     <div className="flex">
                        <BannerUpload
                        details={details}
                        id={fileId}
                        dirType={dirType}
                        className="mt-2 text-sm text-muted-foreground p-2 hover:text-card-foreground
                         transition-all rounded-md"
                        >
                            {details.bannerUrl ? "Update Banner" : "Add Banner"}
                        </BannerUpload>
                        {details.bannerUrl && 
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
                    {/* Title Editing / Display */}
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
                        {details.title} <span className="text-sm ml-2">({dirType.toUpperCase()})</span>
                    </span>
                    )}
                     
                </div>
                
            </div>
        </>
    )
}

export default BannerSection
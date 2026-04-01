/**
 * @component Dropdown
 * @description A recursive, context-aware navigation component that renders either a Folder 
 * (Accordion) or a File. It handles complex interactions like single vs double-click differentiation, 
 * real-time collaborative locking, and recursive nesting.
 * * * Advanced Features:
 * - Collaborative Awareness: Detects and visually locks items being edited by other users.
 * - Event Debouncing: Distinguishes between single-click (Navigation) and double-click (Editing).
 * - Recursive Architecture: Automatically renders child files if the listType is 'folder'.
 * - Synchronous UI: Optimistically updates icons and titles while syncing with the backend.
 */
"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import clsx from "clsx";
import EmojiPicker from "../global/emoji-picker";
import { useToast } from "../ui/use-toast";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon, Trash } from "lucide-react";
import { File as MongooseFile} from "@/model/file.model";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
import { useTitleEditing } from "@/hooks/useTitleEditing";
import { useUser } from "@/lib/providers/user-provider";
import { useSelector } from "react-redux";

// --- State Management ---
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { selectCurrentFolder } from "@/store/selectors/folderSelector";
import { makeSelectFiles } from "@/store/selectors/fileSelector";
import { ReduxFile } from "@/types/state.type";
import { RootState } from "@/store/store";
import { selectUserId } from "@/store/selectors/userSelector";

interface DropdownProps {
    title: string;
    id: string; // The ID of the current folder or file
    listType: 'folder' | 'file';
    iconId: string;
    children?: React.ReactNode;
    disabled?: boolean;
    parentFolderId?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
    title,
    id, // This `id` is the specific ID of the item this Dropdown represents
    listType,
    iconId,
    children,
    disabled,
    parentFolderId,
    ...props
}) => {
    
    const router = useRouter();
    const { toast } = useToast();
    const [ currentIcon, setCurrentIcon ] = useState(iconId)
    const { user } = useUser();

    // --- Redux Selectors ---
    const currentWorkspace = useSelector(selectCurrentWorkspace);
   
    const { updateFolder } = useFolder(); 

    // Select files if this dropdown is a folder (Recursive Data Fetching)
    const selectFiles = useMemo(makeSelectFiles, []);
    const EMPTY_FILE: ReduxFile[] = [];

    const files = useSelector((state: RootState) => 
        listType === 'folder' ? selectFiles(state, id) : EMPTY_FILE
    );

    const {  
        createFile, 
        updateFile 
    } = useFile();

    // Collaborative state: check if another user is currently editing this specific ID
    const remoteEditing = useSelector((state: RootState) => state.ui.remoteEditing[id]);

    // --- Editing Logic ---
    const [isEditingLocally, setIsEditingLocally] = useState(false);

    // Callback for useTitleEditing to signal when editing should stop
    const handleEditingStop = useCallback(() => {
         setIsEditingLocally(false);
    }, [listType, title]);

    const {
        isCurrentlyEditingThisItem: isCurrentlyEditingFromHook, // Renamed to avoid conflict
        displayedTitle,
        handleStartEditing: handleStartEditingFromHook, // Renamed to avoid conflict
        handleKeyDown,
        handleTitleChange,
        inputRef,
        handleInputBlur,
        handleInputFocus 
    } = useTitleEditing({
        id,
        dirType: listType,
        originalTitle: title,
        isEditingLocally: isEditingLocally,
        onEditingStop: handleEditingStop // Pass the new callback
    });

    // Adjust handleStartEditing for Dropdown component
    const handleStartEditing = useCallback(() => {
        setIsEditingLocally(true); // Set local state to true immediately
        // Always dispatch to Redux for global awareness (e.g., to disable other editing)
        handleStartEditingFromHook(); 
    }, [handleStartEditingFromHook]);


    // --- Click Management (Single vs Double) ---
    const clickTimer = useRef<NodeJS.Timeout | null>(null);
    const clickCount = useRef(0);

    const currentUserId = useSelector(selectUserId);
    // To Determine if the item is "Locked" by someone else
    const isLockedByRemote = !!(
        remoteEditing && 
        typeof remoteEditing ==='object' &&
        remoteEditing.userId !== currentUserId
    )

    useEffect(() => {
        setCurrentIcon(iconId )
    }, [iconId])

    
    /**
     * @method navigatePage
     * Handles routing based on hierarchy (Workspace > Folder > File)
     */
    const navigatePage = useCallback((accordionId: string, type: string) => {
        // prevent navigation while editing 
        if(isCurrentlyEditingFromHook) { // Use the effective state from the hook
            return;
        }
        if(!currentWorkspace?._id){
            toast({
                title: "Workspace not found",
                description: "Cannot navigate without a current workspace",
                variant: "destructive",
            });
            return;
        }
        if (type === 'folder') {
            router.push(`/dashboard/${currentWorkspace?._id}/${accordionId}`);
        }
        if (type === 'file') {
            // const parentFile = files.find(file => file._id === accordionId);
            if(parentFolderId){
                router.push(`/dashboard/${currentWorkspace._id}/${parentFolderId}/${accordionId}`);
            }else{
                toast({
                    title: 'File path incomplete',
                    description: "Cannot determine parent folder for navigation",
                    variant: "destructive"
                })
            }
        }
    },[
        currentWorkspace?._id,
        files,
        isCurrentlyEditingFromHook, // Use effective state from hook
        router,
        toast,
    ]);

    const handleCombinedClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        clickCount.current+=1;
        if(clickCount.current === 1){
            // This is the first click in a potential double-click sequence
            clickTimer.current = setTimeout(() => {
                if(clickCount.current === 1){
                    // if after the timeout, clickCount is still 1, it was a single click
                    navigatePage(id, listType);
                }
                clickCount.current = 0;
                clickTimer.current = null;
            }, 300); // Small delay to differentiate single from double click
        }
    }, [
        id,
        listType,
        navigatePage,
    ])


    const handleCombinedDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        // clear the single click timer if it's running
        if(clickTimer.current){
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
        }

        clickCount.current = 0; // Reset click count for double click
        
        // // Add a small delay for folders before starting edit to allow DOM to settle
        // if (listType === 'folder') {
        //     // setTimeout(() => {
        //         if (!isCurrentlyEditingFromHook) { // Re-check effective state from hook after delay
        //             handleStartEditing(); // Call the local handleStartEditing
        //         }
        //     // }, 300); // Increased delay for folders to 300ms
        // } else {
        //     // For files, start editing immediately as before, but ensure local state is set
        //     if (!isCurrentlyEditingFromHook) { // Use effective state from hook
        //         handleStartEditing(); // Call the local handleStartEditing
        //     } 
        // }

        if(!isCurrentlyEditingFromHook){
            handleStartEditing();
        }
    }, [
        handleStartEditing, // Use local handleStartEditing
        isCurrentlyEditingFromHook, // Use effective state from hook
    ])

    /**
     * @method onChangeEmoji
     * Optimistically updates the UI icon before persisting to the DB
     */
    const onChangeEmoji = async (selectedEmoji: string) => {
        setCurrentIcon(selectedEmoji); // Update local state immediately for visual feedback

        let success = false;
        let messageType = '';

        try {
            if (listType === 'folder') {
                const updatedFolder: Partial<MongooseFolder> = {
                    iconId: selectedEmoji,
                };
                // Use the 'id' prop of the current Dropdown component
                const result = await updateFolder(id, updatedFolder); 
                success = !!result?.success;
                messageType = 'Folder';
            } else if (listType === 'file') {
                const updatedFile: Partial<MongooseFile> = {
                    iconId: selectedEmoji,
                };
                // Use the 'id' prop of the current Dropdown component
                const result = await updateFile(id, updatedFile); 
                success = !!result?.success;
                messageType = 'File';
            }

            if (success) {
                toast({
                    title: "Success",
                    description: `Emoji for ${messageType.toLowerCase()} updated successfully`,
                });
            } else {
                toast({
                    title: `Failed to update emoji for ${messageType.toLowerCase()}`,
                    description: "Please try again later",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.log(`Error to update the ${listType} emoji `, error);
            toast({
                title: `Failed to update emoji for ${listType}`,
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        }
    };
    
    const isFolder = listType === 'folder';

    // --- Styles ---
    const listStyles = useMemo(
        () =>
          clsx('relative', {
            'border-none text-md': isFolder,
            'border-none ml-6 text-[16px] py-1': !isFolder,
          }),
        [isFolder]
      );

    const groupIdentifies = clsx(
        'dark:text-white whitespace-nowrap flex justify-between items-center w-[11rem] relative',
        {
          'group/folder': isFolder,
          'group/file': !isFolder,
        }
      );

    const hoverStyles = useMemo(
        () =>
          clsx(
            'h-full hidden rounded-sm absolute right-0 items-center justify-center flex space-x-1',
            {
              'group-hover/file:flex': listType === 'file',
              'group-hover/folder:flex': listType === 'folder',
            }
          ),
        [listType]
      );
    
    

    // add new file
    const addNewFile = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentWorkspace?._id) return;

        const payload = {
            folderId: id,
            workspaceId: currentWorkspace._id.toString(),
        }

        try {
            const result = await createFile(payload);
            if(!result.success){
                toast({
                    title: "Failed to create file",
                    description: "Please try again later",
                    variant: "destructive"
                })
            }else{
                toast({
                title: "Successfully created new file",
                description: "Start working on it",
            })
            }
            
            
                
        } catch (error) {
            console.log("Error while creating file in folder ",error)
            toast({
                title: "Failed to create file",
                description: "Error while creating file in folder",
                variant: "destructive"
            })
        }
    };
   
    // move to trash

    const moveToTrash = async(e: React.MouseEvent) => {
        e.stopPropagation();
        const username = user?.username
         if(!id) {
                    console.error(`[Move to trash] ${listType} Id is required`);
                    return;
                }
        // For folders, `id` is the folder ID.
        // For files, `id` is the file ID.
        // The `id.split('folder')` logic might be problematic if your IDs can contain 'folder' string or are not structured like that.
        // Assuming 'id' directly represents the entity's ID to be trashed.
        
        if(listType === 'folder'){
            const trashValue = `Deleted by ${username}`
            const updatedFolder: Partial<MongooseFolder> ={
                inTrash: trashValue
            }
            try {
               
                const result = await updateFolder(id, updatedFolder); // Use `id` directly
                console.log("[Dropdown] moveToTrash result of folder: ",result);
                if(!result.success){ // Check result.success for hook's return
                    toast({
                        title: "Failed to move folder to trash ",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                } else {
                   

                    toast({
                        title: "Folder moved to trash successfully",
                        description: "Keep it safe",
                    })
                }
            } catch (error) {
                console.log("Error while moving folder to the trash", error)
                toast({
                    title: "Error while moving folder to the trash ",
                    description: "Please try again later",
                    variant: "destructive"
                })
            }
        }
        if(listType === 'file'){
            const trashValue = `Deleted by ${username}`
            const updatedFile: Partial<MongooseFile> ={
                inTrash: trashValue
            }
            try {
                const result = await updateFile(id, updatedFile); // Use `id` directly
                if(!result.success){ // Check result.success for hook's return
                    toast({
                        title: "Failed to move file to trash ",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                } else {
                                 
                    toast({
                        title: "File moved to trash successfully",
                        description: "Keep it safe",
                    })
                }
            } catch (error) {
                console.log("Error while moving file to the trash", error)
                toast({
                    title: "Error while moving file to the trash ",
                    description: "Please try again later",
                    variant: "destructive"
                })
            }
        }
    }

    const filesInCurrentFolder = useMemo(() => {
        return files.filter((file) => !file.inTrash);
    },[
        files,
    ])

    // console.log("[Dropdown] filesInCurrentFolder: ",filesInCurrentFolder);
   
        return (
        <AccordionItem 
            value={id} 
            className={listStyles} 
             data-editable-container
        >
            <AccordionTrigger
                id={listType}
               className="hover:no-underline p-2 text-muted-foreground text-sm"
                disabled={listType === 'file'} 
                onMouseDownCapture={(e) => {
                    if (e.detail === 2) {   
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        console.log(`[${title}] AccordionTrigger: Preventing default onMouseDownCapture due to double-click.`);
                    }
                }}
                onClick={(e) => {
                    console.log(`[${title}] AccordionTrigger: Default onClick allowed.`);
                }}
            >       
                {/* This div now contains both the icon/input and the action buttons */}
                {/* Ensure this container has a defined max-width or flex-basis to prevent overflow */}
                <div  className={groupIdentifies}> {/* Added overflow-hidden */}
                    <div className="flex gap-4 items-center justify-start w-full min-w-0 overflow-hidden">
                    <div className="relative flex-shrink-0"> 
                        <EmojiPicker getValue={onChangeEmoji}>
                            {currentIcon}
                        </EmojiPicker>
                    </div>
                    <div className="flex items-center flex-grow min-w-0 overflow-hidden w-full">
                    {isCurrentlyEditingFromHook ? ( 
                        <input
                            ref={inputRef}
                            type="text"
                            value={typeof displayedTitle === 'string' ? displayedTitle : ''}
                            className={clsx(
                                'outline-none bg-muted cursor-text flex-grow text-Neutrals/neutrals-7', // Use flex-grow
                                'z-20 p-1 rounded-sm min-w-0', // Added min-w-0 to allow shrinking
                                'w-full' // Ensure it takes full available width within its flex context
                            )}
                            readOnly={false}
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()} 
                            onBlur={handleInputBlur}
                            onFocus={handleInputFocus} 
                            onChange={handleTitleChange}
                            onKeyDown={handleKeyDown}
                            // autoFocus={isCurrentlyEditingFromHook} 
                        />
                    ) : (
                        <TooltipComponent
                        className= {`${isLockedByRemote
                            ? "bg-cyan-400 text-cyan-950 font-bold border-none shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                            : ""
                        } `}
                        // only show tooltip if someone else is editing
                        message={
                            isLockedByRemote
                            ? `${remoteEditing.username} is editing...`
                            : ""
                        }
                        
                        >
                            <div className={clsx(
                                "flex items-center flex-nowrap flex-grow w-full gap-2 px-1 rounded-md transition-all duration-300 min-w-0",
                                isLockedByRemote && "bg-emerald-950/40 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            )}>
                                <span
                                className={clsx(
                                    "block truncate flex-grow transition-colors min-w-0",
                                    // Use remoteEditing object just to trigger a class
                                    isLockedByRemote 
                                    ? "text-emerald-400 font-semibold italic opacity-90 cursor-not-allowed select-none" 
                                    : "hover:text-white cursor-pointer"
                                )}
                                // DISABLE clicks if locked
                                onClick={(e) => !isLockedByRemote && handleCombinedClick(e)} 
                                onDoubleClick={(e) => !isLockedByRemote && handleCombinedDoubleClick(e)} 
                            >
                                {String(displayedTitle)}
                                
                                
                            </span>
                            {/* Visual Indicator: A small pulse dot instead of text to save space */}
                                {isLockedByRemote && (
                                    <div className="ml-2 flex-shrink-0 items-center pr-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"/>
                                        </span>
                                    </div>
                                )}
                        </div>
                        </TooltipComponent>
                    )}
                    </div>
                </div>
                {/* Action buttons remain, now correctly part of the flex container */}
               
                {!isLockedByRemote && (<div className={hoverStyles}> 

                  <TooltipComponent
                //   className="bg-amber-50"
                     message={`Delete ${listType === 'folder' ? 'Folder' : 'File'}`}
                >
                        <Trash 
                            onClick={(e) => { e.stopPropagation(); moveToTrash(e); }} 
                            size={15}
                            className="hover:text-white text-Neutrals/neutrals-7 transition-colors"
                        />
                    </TooltipComponent>
                    {/* Show add button only for folder title  */}
                   { listType === 'folder' && ( <TooltipComponent message="Add File">
                        <PlusIcon 
                            onClick={(e) => { e.stopPropagation(); addNewFile(e); }} 
                            size={15}
                            className="hover:text-white transition-colors"
                        />
                    </TooltipComponent>)}
                </div>)}
                </div>
            </AccordionTrigger>
            
            {/* It will show files for the folders */}
            {listType === 'folder' && (<AccordionContent>
                    {filesInCurrentFolder.map((file) => {
                        return (
                            <Dropdown 
                                key={file._id}
                                title={file.title}
                                listType="file"
                                id={file._id}
                                iconId={file?.iconId || ''}
                                parentFolderId={id}
                            />
                        );
                    })}
            </AccordionContent>)}
        </AccordionItem>
        );
   
};

export default Dropdown;

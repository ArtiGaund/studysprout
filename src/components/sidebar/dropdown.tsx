"use client";

import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import clsx from "clsx";
import EmojiPicker from "../global/emoji-picker";
import { useToast } from "../ui/use-toast";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon, Trash } from "lucide-react";
import { File as MongooseFile} from "@/model/file.model";
import { useSession } from "next-auth/react";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
import { useWorkspace } from "@/hooks/useWorkspace";
import { clearEditingItem, setEditingItem, updateEditingItemTitle } from "@/store/slices/uiSlice";
import { useTitleEditing } from "@/hooks/useTitleEditing";

interface DropdownProps {
    title: string;
    id: string; // The ID of the current folder or file
    listType: 'folder' | 'file';
    iconId: string;
    children?: React.ReactNode;
    disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
    title,
    id, // This `id` is the specific ID of the item this Dropdown represents
    listType,
    iconId,
    children,
    disabled,
    ...props
}) => {
    
    const router = useRouter();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const [ currentIcon, setCurrentIcon ] = useState(iconId)
    const { data: session} = useSession()

    const { currentWorkspace } = useWorkspace();
    const { updateFolder } = useFolder(); 
    const { files, createFile, updateFile } = useFile();

    //  Local state for folder editing
    const [isEditingLocally, setIsEditingLocally] = useState(false);
    // Local state for file editing
    // const [isEditingFileLocally, setIsEditingFileLocally] = useState(false);

    // Callback for useTitleEditing to signal when editing should stop
    const handleEditingStop = useCallback(() => {
         setIsEditingLocally(false);
        console.log(`[${title}] handleEditingStop: Local editing stopped for ${listType}.`);
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
        console.log(`[${title}] handleStartEditing: Local editing started for ${listType}.`);
        // Always dispatch to Redux for global awareness (e.g., to disable other editing)
        handleStartEditingFromHook(); 
    }, [listType, handleStartEditingFromHook, title]);


    // states and Refs for click handling
    const clickTimer = useRef<NodeJS.Timeout | null>(null);
    const clickCount = useRef(0);

    useEffect(() => {
        setCurrentIcon(iconId )
    }, [iconId])

    
    //Navigate the user to a different page
    const navigatePage = useCallback((accordionId: string, type: string) => {
        // prevent navigation while editing 
        if(isCurrentlyEditingFromHook) { // Use the effective state from the hook
            console.log(`[${title}] Attempted to navigate while editing. Preventing.`);
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
        console.log(`[${title}] Navigating to ${type} with ID: ${accordionId}`);
        if (type === 'folder') {
            router.push(`/dashboard/${currentWorkspace?._id}/${accordionId}`);
        }
        if (type === 'file') {
            const parentFile = files.find(file => file._id === accordionId);
            if(parentFile?.folderId){
                router.push(`/dashboard/${currentWorkspace._id}/${parentFile.folderId}/${accordionId}`);
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
        title
    ]);

    const handleCombinedClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        // if currently editing, prevent any click actions
        // if(isCurrentlyEditingFromHook) { // Use effective state from hook
        //     console.log(`[${title}] handleCombinedClick: Preventing click action while editing.`);
        //     return;
        // }

        clickCount.current+=1;
        if(clickCount.current === 1){
            // This is the first click in a potential double-click sequence
            clickTimer.current = setTimeout(() => {
                if(clickCount.current === 1){
                    // if after the timeout, clickCount is still 1, it was a single click
                    console.log(`[${title}] handleCombinedClick: Single Click Action. Navigating....`);
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
        isCurrentlyEditingFromHook, // Use effective state from hook
        title
    ])


    const handleCombinedDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        // clear the single click timer if it's running
        if(clickTimer.current){
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
        }

        clickCount.current = 0; // Reset click count for double click
        console.log(`[${title}] handleCombinedDoubleClick: Double Click Action. Start editing...`);
        
        // Add a small delay for folders before starting edit to allow DOM to settle
        if (listType === 'folder') {
            console.log(`[${title}] handleCombinedDoubleClick: Folder detected. Delaying handleStartEditing.`);
            setTimeout(() => {
                if (!isCurrentlyEditingFromHook) { // Re-check effective state from hook after delay
                    handleStartEditing(); // Call the local handleStartEditing
                } else {
                    console.log(`[${title}] handleCombinedDoubleClick: Already editing after delay, ignoring.`);
                }
            }, 300); // Increased delay for folders to 300ms
        } else {
            // For files, start editing immediately as before, but ensure local state is set
            console.log(`[${title}] handleCombinedDoubleClick: File detected. Starting editing immediately.`); // NEW log
            if (!isCurrentlyEditingFromHook) { // Use effective state from hook
                handleStartEditing(); // Call the local handleStartEditing
            } else {
                console.log(`[${title}] handleCombinedDoubleClick: Already editing, ignoring double click.`);
            }
        }
    }, [
        handleStartEditing, // Use local handleStartEditing
        isCurrentlyEditingFromHook, // Use effective state from hook
        title,
        listType // Add listType to dependencies
    ])

    // onchanges for emoji
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
                console.log(`[${title}] onChangeEmoji: Updating folder emoji for ID: ${id}`);
                const result = await updateFolder(id, updatedFolder); 
                success = !!result?.success;
                messageType = 'Folder';
            } else if (listType === 'file') {
                const updatedFile: Partial<MongooseFile> = {
                    iconId: selectedEmoji,
                };
                // Use the 'id' prop of the current Dropdown component
                console.log(`[${title}] onChangeEmoji: Updating file emoji for ID: ${id}`);
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
        const newFile: MongooseFile = {
            folderId: id, // Use the folder ID from props
            data: undefined,
            inTrash: undefined,
            title: 'Untitled',
            iconId: '📄',
            workspaceId: currentWorkspace._id.toString(), 
            bannerUrl: '',
            createdAt: new Date(),
            lastUpdated: new Date(),
        };

        try {
            const result = await createFile(newFile);
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
        const user = session?.user.username
        // For folders, `id` is the folder ID.
        // For files, `id` is the file ID.
        // The `id.split('folder')` logic might be problematic if your IDs can contain 'folder' string or are not structured like that.
        // Assuming 'id' directly represents the entity's ID to be trashed.
        
        if(listType === 'folder'){
            const trashValue = `Deleted by ${user}`
            const updatedFolder: Partial<MongooseFolder> ={
                inTrash: trashValue
            }
            try {
                const result = await updateFolder(id, updatedFolder); // Use `id` directly
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
            const trashValue = `Deleted by ${user}`
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
        return files.filter((file) => {
            return (
                file.folderId?.toString() === id &&
                file.inTrash === undefined
            )
        })
    },[
        files,
        id
    ])
   
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
                    <div className="flex gap-4 items-center justify-center overflow-hidden">
                    <div className="relative"> 
                        <EmojiPicker getValue={onChangeEmoji}>
                            {currentIcon}
                        </EmojiPicker>
                    </div>
                    {isCurrentlyEditingFromHook ? ( 
                        <input
                            ref={inputRef}
                            type="text"
                            value={displayedTitle ?? ''}
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
                        <span
                            className="cursor-pointer overflow-hidden whitespace-nowrap text-ellipsis flex-grow" // Use flex-grow
                            onClick={handleCombinedClick} 
                            onDoubleClick={handleCombinedDoubleClick} 
                        >
                            {displayedTitle}
                        </span>
                    )}
                </div>
                {/* Action buttons remain, now correctly part of the flex container */}
               
                <div className={hoverStyles}> 

                  <TooltipComponent message={`Delete ${listType === 'folder' ? 'Folder' : 'File'}`}>
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
                </div>
                </div>
            </AccordionTrigger>
            
            {/* It will show files for the folders */}
            <AccordionContent>
                    {filesInCurrentFolder.map((file) => {
                        return (
                            <Dropdown 
                                key={file._id}
                                title={file.title}
                                listType="file"
                                id={file._id}
                                iconId={file?.iconId || ''}
                            />
                        );
                    })}
            </AccordionContent>
        </AccordionItem>
        );
   
};

export default Dropdown;

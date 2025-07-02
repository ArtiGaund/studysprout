"use client";

import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import clsx from "clsx";
import EmojiPicker from "../global/emoji-picker";
import { SET_FOLDERS, UPDATE_FOLDER } from "@/store/slices/folderSlice";
import mongoose from 'mongoose'; 
// import { Folder } from "@/model/folder.model";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon, Trash } from "lucide-react";
import { File as MongooseFile} from "@/model/file.model";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { ADD_FILE, SET_CURRENT_FILES, SET_FILES, UPDATE_FILE } from "@/store/slices/fileSlice";
import { useSession } from "next-auth/react";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { useFolder } from "@/hooks/useFolder";
import { useFile } from "@/hooks/useFile";
import { useWorkspace } from "@/hooks/useWorkspace";
import path from "path";

interface DropdownProps {
    title: string;
    id: string;
    listType: 'folder' | 'file';
    iconId: string;
    children?: React.ReactNode;
    disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
    title,
    id,
    listType,
    iconId,
    children,
    disabled,
    ...props
 }) => {
    // const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace?._id);
    // const folder = useSelector((state: RootState) => state.folder.folders.find((folder) => folder._id === id))
    //     // .find((folder) => folder._id && folder._id.toString() === id));
    // const folderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    // const state = useSelector((state: RootState) => state.workspace);
    // const allFiles = useSelector((state: RootState) => state.file.files);
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const [tempTitle, setTempTitle] = useState(title);
    const [ currentIcon, setCurrentIcon ] = useState(iconId)
    const { data: session} = useSession()

    const { currentWorkspace } = useWorkspace();
    const { folders,currentFolder, getFolders, updateFolder } = useFolder();
    const { files, createFile, updateFile } = useFile();
    // useEffect(() => {
    //     const fetchFolders = async() => {
    //         try {
    //             const response = await axios.get(`/api/get-all-workspace-folders?workspaceId=${workspaceId}`)
    //             if(!response.data.success){
    //                 console.log("Failed to fetch all the folders for the workspace")
    //             }else{
    //                 // console.log("Folders in dropdown ",response.data.data)
    //                 dispatch(SET_FOLDERS(response.data.data))
    //             }
    //         } catch (error) {
    //             console.log("Error while fetching all the folders for the workspace ",error)
    //         }
    //     }
    //     fetchFolders()
    // }, [ workspaceId, dispatch ])

    useEffect(() => {
        if(currentFolder){
            setCurrentIcon(currentFolder.iconId || iconId )
        }
    }, [currentFolder, iconId])


    //Navigate the user to a different page
    const navigatePage = (accordionId: string, type: string) => {
        if (type === 'folder') {
            router.push(`/dashboard/${currentWorkspace?._id}/${accordionId}`);
        }
        if (type === 'file') {
            router.push(`/dashboard/${currentWorkspace?._id}/${currentFolder?._id}/${accordionId.split('folder')[1]}`);
        }
    };


     //double click handler
    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    //blur (value will be saved when input field will be out of focus)
    const handleBlur = async () => {
        if (!isEditing) return;

        setIsEditing(false);
        const fId = id.split('folder');
        if (fId.length === 1) {
            if (!tempTitle) return;

            try {
                const updatedFolder: Partial<MongooseFolder> = {
                    title: tempTitle,
                };
                const folderId = fId[0]
                const folder = await updateFolder(folderId, updatedFolder);

                if(!folder){
                    toast({
                        title: "Failed to update folder",
                        description: "Please try again later",
                        variant: "destructive",
                    });
                    return;
                }
                toast({
                        title: "Success",
                        description: "Folder updated successfully",
                    });


                // const response = await axios.post(`/api/update-folder`, updatedFolder);
                // console.log("Response for update folder ", response.data);

                // if (response.data.success) {  
                //     dispatch(UPDATE_FOLDER(updatedFolder));
                //     const workspace = response.data.data.workspace
                //     dispatch(UPDATE_WORKSPACE(workspace))
                //     toast({
                //         title: "Success",
                //         description: "Folder updated successfully",
                //     });
                // } else {
                //     toast({
                //         title: "Failed to update folder",
                //         description: response.data.message,
                //         variant: "destructive",
                //     });
                // }
            } catch (error) {
                console.log("Error to update the folder ", error);
                toast({
                    title: "Failed to update folder",
                    description: "Please try again later",
                    variant: "destructive",
                });
            }
        }
        if (fId.length === 2 && fId[1]) {
            if (!tempTitle) return;
            // update title of the file
            try {
                const updatedFile: Partial<MongooseFile> = {
                    title: tempTitle
                }
                const fileId = fId[1];
                const file = await updateFile(fileId, updatedFile);

                if(!file){
                    toast({
                        title: "Failed to update file",
                        description: "Please try again later",
                        variant: "destructive",
                    });
                    return;
                }

                toast({
                    title: "Success",
                    description: "File updated successfully",
                });
                // const response = await axios.post(`/api/update-file`,updatedFile)
                // if (response.data.success) {  
                //     const file = response.data.data.file
                //     const folder = response.data.data.folder
                //     const workspace = response.data.data.workspace
                //     dispatch(UPDATE_FILE(file));
                //     dispatch(UPDATE_FOLDER(folder))
                //     // const workspace = response.data.data.workspace
                //     dispatch(UPDATE_WORKSPACE(workspace))
                //     toast({
                //         title: "Success",
                //         description: "File updated successfully",
                //     });
                // } else {
                //     toast({
                //         title: "Failed to update File",
                //         description: response.data.message,
                //         variant: "destructive",
                //     });
                // }

            } catch (error) {
                console.log("Error to update the file ", error);
                toast({
                    title: "Error to update the file ",
                    description: "Please try again later",
                    variant: "destructive",
                });
            }
        }
    };

     //onchanges
    const onChangeEmoji = async (selectedEmoji: string) => {
        if (listType === 'folder') {
            if (currentFolder) {
                setCurrentIcon(selectedEmoji)
                const updatedFolder: Partial<MongooseFolder> = {
                    iconId: selectedEmoji,
                };
                const folderId = currentFolder?._id
                try {
                    const folder = await updateFolder(folderId,updatedFolder);
                    if(!folder){
                        toast({
                            title: "Failed to update emoji for folder",
                            description: "Please try again later",
                            variant: "destructive",
                        });
                        return;
                    }
                    toast({
                        title: "Success",
                        description: "Emoji for folder updated successfully",
                    });
                    // const response = await axios.post(`/api/update-folder`, updatedFolder);
                    // console.log("Response for update folder ", response);
                    // if (response.data.success) {  
                    //     dispatch(UPDATE_FOLDER(updatedFolder));
                    // }
                    // toast({
                    //     title: "Success",
                    //     description: "Emoji for folder updated successfully",
                    // });
                } catch (error) {
                    console.log("Error to update the folder ", error);
                    toast({
                        title: "Failed to update emoji for folder",
                        description: "Please try again later",
                        variant: "destructive",
                    });
                }
            }
        }
    };

    const folderTitleChange = (e: any) => {
        setTempTitle(e.target.value);
    };

    const fileTitleChange = (e: any) => {
        setTempTitle(e.target.value);
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
        'dark:text-white whitespace-nowrap flex justify-between items-center w-full relative',
        {
          'group/folder': isFolder,
          'group/file': !isFolder,
        }
      );

    const hoverStyles = useMemo(
        () =>
          clsx(
            'h-full hidden rounded-sm absolute right-0 items-center justify-center',
            {
              'group-hover/file:block': listType === 'file',
              'group-hover/folder:block': listType === 'folder',
            }
          ),
        [listType]
      );
    


    // add new file
    const addNewFile = async () => {
        if (!currentWorkspace?._id) return;
        // const fId = new mongoose.Types.ObjectId(id);
        const newFile: MongooseFile = {
            folderId: id,
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
            const file = await createFile(newFile);
            if(!file.success){
                toast({
                    title: "Failed to create file",
                    description: "Please try again later",
                    variant: "destructive"
                })
            }
            toast({
                title: "Successfully created new file",
                description: "Start working on it",
            })
            // create new file on the server
            // const createFile = await axios.post(`/api/create-file`,newFile)
            // console.log("Created file ",createFile)
            // if(!createFile.data.success){
            //     toast({
            //         title: "Failed to create file",
            //         description: "Please try again later",
            //         variant: "destructive"
            //     })
            // }else{
            //     const fileData = createFile.data.data.file
            //     const updatedFolder = createFile.data.data.updatedFolder
            //     const updatedWorkspace = createFile.data.data.updatedWorkspace
            //     dispatch(ADD_FILE(fileData))
            //     dispatch(SET_FILES(fileData))
            //     dispatch(SET_CURRENT_FILES(fileData))
            //     dispatch(UPDATE_FOLDER(updatedFolder))
            //     dispatch(UPDATE_WORKSPACE(updatedWorkspace))
            //     toast({
            //         title: "Successfully created new file",
            //         description: "Start working on it",
            //     })
            // }
             
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

    const moveToTrash = async() => {
        const user = session?.user.username
        const pathId = id.split('folder')
        if(listType === 'folder'){
            const trashValue = `Deleted by ${user}`
            const updatedFolder: Partial<MongooseFolder> ={
                inTrash: trashValue
            }
            const folderId = pathId[0];
            // deleting it locally first, to show update to user quickly
            // dispatch(UPDATE_FOLDER(updatedFolder))
            // deleting it on server
            try {
                // const response = await axios.post(`/api/update-folder`,updatedFolder)
                // if(!response.data.success){
                //     toast({
                //         title: "Failed to move folder to trash ",
                //         description: "Please try again later",
                //         variant: "destructive"
                //     })
                // }else{
                //     toast({
                //         title: "Folder moved to trash successfully",
                //         description: "Keep it safe",
                //     })
                // }
                const folder = await updateFolder(folderId,updatedFolder);
                if(!folder){
                    toast({
                        title: "Failed to move folder to trash ",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                }
                toast({
                    title: "Folder moved to trash successfully",
                    description: "Keep it safe",
                })
            } catch (error) {
                console.log("Error while moving folder to the trash")
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
            const fileId = pathId[1];
            // deleting it locally first, to show update to user quickly
            // dispatch(UPDATE_FILE(updatedFile))
            // deleting it on server
            try {
                // const response = await axios.post(`/api/update-file`,updatedFile)
                // if(!response.data.success){
                //     toast({
                //         title: "Failed to move file to trash ",
                //         description: "Please try again later",
                //         variant: "destructive"
                //     })
                // }else{
                //     const file = response.data.data.file
                //     dispatch(UPDATE_FILE(file))
                //     const folder = response.data.data.folder
                //     dispatch(UPDATE_FOLDER(folder))
                //     const workspace = response.data.data.workspace
                //     dispatch(UPDATE_WORKSPACE(workspace))
                //     toast({
                //         title: "File moved to trash successfully",
                //         description: "Keep it safe",
                //     })
                // }
                const file = await updateFile(fileId,updatedFile);
                if(!file.success){
                    toast({
                        title: "Failed to move file to trash ",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                }
                toast({
                    title: "File moved to trash successfully",
                    description: "Keep it safe",
                })
            } catch (error) {
                console.log("Error while moving file to the trash")
                toast({
                    title: "Error while moving file to the trash ",
                    description: "Please try again later",
                    variant: "destructive"
                })
            }
        }
    }

    const filesInCurrentFolder = files.filter((file) => {
        return (
            file.folderId?.toString() === currentFolder?._id &&
            file.inTrash === undefined
        )
    })
    return (
        <AccordionItem 
            value={id} 
            className={listStyles!}
            onClick={(e) => {
                e.stopPropagation();
                navigatePage(id, listType);
            }}
        >
            <AccordionTrigger
                id={listType}
                className="hover:no-underline p-2 text-muted-foreground text-sm"
                disabled={listType === 'file'}
            >
                <div className={groupIdentifies}>
                    <div className="flex gap-4 items-center justify-center overflow-hidden">
                        <div className="relative">
                            <EmojiPicker getValue={onChangeEmoji}>
                                {currentIcon}
                            </EmojiPicker>
                        </div>
                        <input
                            type="text"
                            value={tempTitle}
                            className={clsx(
                                'outline-none overflow-hidden w-[140px] text-Neutrals/neutrals-7',
                                {
                                    'bg-muted cursor-text': isEditing,
                                    'bg-transparent cursor-pointer': !isEditing,
                                }
                            )}
                            readOnly={!isEditing}
                            onDoubleClick={handleDoubleClick}
                            onBlur={handleBlur}
                            onChange={
                                listType === 'folder' ? folderTitleChange : fileTitleChange
                              }
                        />
                    </div>
                    <div className={hoverStyles}>
                        {(listType ==="folder" &&<TooltipComponent message="Delete Folder">
                            <Trash 
                                onClick={moveToTrash}
                                size={15}
                                className="hover:text-white text-Neutrals/neutrals-7 transition-colors"
                            />
                        </TooltipComponent>)}
                        {(listType ==="file" &&<TooltipComponent message="Delete File">
                            <Trash 
                                onClick={moveToTrash}
                                size={15}
                                className="hover:text-white text-Neutrals/neutrals-7 transition-colors"
                            />
                        </TooltipComponent>)}
                        {listType === "folder" && !isEditing && (
                            <TooltipComponent message="Add File">
                                <PlusIcon 
                                    onClick={addNewFile}
                                    size={15}
                                    className="hover:text-white  transition-colors"
                                />
                            </TooltipComponent>
                        )}
                    </div>
                </div>
            </AccordionTrigger>
            {/* It will show files for the folders */}
            <AccordionContent>
                {/* {state.file.files
                    .find((workspace) => workspace._id === workspaceId)
                    ?.folders?.find((folder) => folder._id.toString() === id)
                    ?.files?.filter((file) => file.inTrash === undefined)
                    .map((file) => {
                        const customFileId = `${id}folder${file._id}`;
                        return (
                            <Dropdown 
                                key={file._id}
                                title={file.title}
                                listType="file"
                                id={customFileId}
                                iconId={file?.iconId || ''}
                            />
                        );
                    })} */}
                    {filesInCurrentFolder.map((file) => {
                        const customFileId = `${id}folder${file._id}`;
                        return (
                            <Dropdown 
                                key={file._id}
                                title={file.title}
                                listType="file"
                                id={customFileId}
                                iconId={file?.iconId || ''}
                            />
                        );
                    })}
            </AccordionContent>
        </AccordionItem>
    );
};

export default Dropdown;

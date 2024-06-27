"use client"

import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Accordion, AccordionItem, AccordionTrigger } from "../ui/accordion";
import clsx from "clsx";
import EmojiPicker from "../global/emoji-picker";
import { UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { ObjectId } from 'mongodb';
import { Folder } from "@/model/folder.model";
import axios from "axios";


interface DropdownProps{
    title: string;
    id: string;
    listType: 'folder' | 'file';
    iconId: string;
    children?: React.ReactNode;
    disabled?: boolean;
}
// it will show it like a folder or a file
const Dropdown: React.FC<DropdownProps> = ({
    title,
    id,
    listType,
    iconId,
    children,
    disabled,
    ...props
 }) => {
    // bring current workspace id
    const workspace = useSelector((state: RootState) => state.workspace.currentWorkspace)
    const folder = useSelector((state: RootState) => state.folder.folders
    .find((folder) => folder._id && folder._id.toString() === id))
    const [ isEditing, setIsEditing ] = useState(false)
    const router = useRouter()
    const dispatch = useDispatch()

    // folder title that is synced with server data and local data
    
    // file title
    // navigate the user to different page
    const navigatePage = (accordionId: string, type: string) => {
        if(type === 'folder'){
            router.push(`/dashboard/${workspace?._id}/${accordionId}`)
        }
        if(type === 'file'){
            router.push(`/dashboard/${workspace?._id}/${folder?._id}/${accordionId}`)
        }
    }
    // add a file
    // double click handler 
    // blur => when user is outside the page, save the data
    // onChanges 
    const onChangeEmoji = async (selectedEmoji: string) => {
        if(listType === 'folder'){
            if(folder){
                const updatedFolder: Partial<Folder> = {
                    _id: folder?._id,
                    iconId: selectedEmoji
                }
                const response = await axios.post(`/api/update-folder`,updatedFolder)
                console.log("Response for update folder ",response)
                dispatch(UPDATE_FOLDER(updatedFolder))
            }
            
        }
    }
    // move to trash
    
    const isFolder = listType === 'folder'
    const listStyles = useMemo(() => {
        clsx('relative', {
            'border-none text-md': isFolder,
            'border-none ml-6 text-[16px] py-1': !isFolder,
        })
    }, [isFolder])

    const groupIdentifies = clsx(
        'dark:text-white whitespace-nowrap flex justify-between items-center w-full relative',
        {
          'group/folder': isFolder,
          'group/file': !isFolder,
        }
      );
    return(
        <AccordionItem 
        value={id} 
        className={listStyles!}
        onClick={(e) => {
            e.stopPropagation();
            navigatePage( id, listType )
        }}
        >
            <AccordionTrigger
            id={listType}
            className="hover:no-underline p-2 dark:text-muted-foreground text-sm"
            disabled={listType === 'file'}
            >
                <div className={groupIdentifies}>
                    <div className="flex gap-4 items-center justify-center overflow-hidden">
                        <div className="relative">
                            <EmojiPicker getValue={onChangeEmoji}>
                                {iconId}
                            </EmojiPicker>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
        </AccordionItem>
    )
}

export default Dropdown
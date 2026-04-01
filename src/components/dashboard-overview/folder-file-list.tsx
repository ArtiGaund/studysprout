/**
 * @component FolderFileList
 * @description Presentational component responsible for rendering a list of files within a folder.
 * Utilizes React.memo to prevent unnecessary re-renders when the sidebar or parent dashboard updates.
 * * Key Features:
 * - Accordion Integration: Syncs the open state with the currently active file via Redux.
 * - String Safety: Robust handling of MongoDB ObjectIDs for React keys and props.
 * - Performance: Decoupled from fetching logic, acting as a "Dumb" component for better testability.
 */
"use client";

import { RootState } from "@/store/store";
import React from "react";
import { useSelector} from "react-redux";
import Dropdown from "../sidebar/dropdown";
import { Accordion } from "../ui/accordion";
import { ReduxFile } from "@/types/state.type";
import { selectCurrentFile } from "@/store/selectors/fileSelector";

interface FolderFileListProps {
    folderFiles: ReduxFile[] | [];
    folderId: string;
    onFileAdded: () => void;
    globalEditingItems?: RootState['ui']['editingItem'];
}

const FolderFileListInner: React.FC<FolderFileListProps> = ({
    folderFiles,
    folderId,
    onFileAdded,
    globalEditingItems
}) => {
    // Accessing current active file to set the default open state of the accordion
    const currentFile = useSelector(selectCurrentFile);
    return(
        <>
            {/* Header Section */}
             <div className="flex sticky z-20 top-0 bg-background w-full h-10 group/title justify-between
             items-center pr-4 text-Neutrals/neutrals-8 pl-4">
                <span className="font-bold text-Neutrals-8 text-lg">
                        FILES
                </span>
             </div>

             {/* File List Section */}
             <div className="flex pl-5">
                <Accordion
                    type="multiple"
                    // Ensures the currently selected file is expanded by default
                    defaultValue={[ currentFile?._id?.toString() || '']}
                    className="pb-20 w-full"
                >
                    {
                        folderFiles.length > 0 && folderFiles
                        .map((file) => (
                        <Dropdown 
                        key={file?._id?.toString()} // Ensure key is a string
                        title={file.title}
                        listType="file"
                        id={file?._id?.toString() || ''} // Ensure id is a string and provide a fallback
                        iconId={file?.iconId || ''} // Ensure iconId is a string and provide a fallback
                        />
                        ))
                    }
               </Accordion>
                 
             </div>
        </>
    )
}
/**
 * Memoized to prevent re-renders unless the file list or editing state explicitly changes.
 * Essential for performance in complex dashboard layouts.
 */
const FolderFileList = React.memo(FolderFileListInner);
export default FolderFileList;
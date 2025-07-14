"use client";

import { File as MongooseFile} from "@/model/file.model";
import { RootState } from "@/store/store";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../ui/use-toast";
import Dropdown from "../sidebar/dropdown";
import { Accordion } from "../ui/accordion";
import axios from "axios";
import { SET_CURRENT_FILES, SET_FILES } from "@/store/slices/fileSlice";
import { useFile } from "@/hooks/useFile";
import { ReduxFile } from "@/types/state.type";
import { transformFile } from "@/utils/data-transformers";

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


    // const files = useSelector((state:RootState) => state.file.files);
    // const currentFileId = useSelector((state:RootState) => state.file.currentFile?._id);
    const { files, currentFile, getFiles } = useFile();
    const { toast } = useToast();
    const dispatch = useDispatch();
    console.log("Files in folder file list ",files);

    useEffect(() => {
        fetchFiles(folderId);
    }, [folderId])

    // useEffect(() => {
    //     if(onFileAdded){
    //         fetchFiles(folderId);
    //     }
    // }, [onFileAdded])

     const fetchFiles = async ( folderId : string) => {
                    try {
                        // const response = await axios.get(`/api/get-all-folder-files?folderId=${folderId}`);
                        // console.log("Response of folder file list ",response.data.data);
                        // if(!response.data.success){
                        //     toast({
                        //         title: "Failed to fetch files",
                        //         description: "Please try again later",
                        //         variant: "destructive"
                        //     })
                        // }
                        // const list = response.data.data  as File[];;
                        // dispatch(SET_FILES(list));
                        // if(list.length > 0 && !currentFileId){
                        //     dispatch(SET_CURRENT_FILES(list[0]));
                        // }
                        const allFiles = await getFiles(folderId);
                        if(!allFiles.success){
                            toast({
                                title: "Failed to fetch files",
                                description: allFiles.error,
                                variant: "destructive"
                            })
                        }
                        const fetchedFiles = allFiles.data;

                        const transformedFiles = (Array.isArray(fetchedFiles)
                        ? fetchedFiles
                        : [fetchedFiles]
                        ).filter(Boolean).map((file) => transformFile(file as MongooseFile));

                       if(transformedFiles.length > 0){
                        dispatch(SET_FILES(transformedFiles));
                        if(!currentFile || !transformedFiles.some((file) => file._id === currentFile._id)){
                            const firstFile = transformedFiles[0];
                            if(firstFile && firstFile._id){
                                dispatch(SET_CURRENT_FILES(firstFile._id));
                            }
                        }
                       }else{
                        dispatch(SET_FILES([]));
                        dispatch(SET_CURRENT_FILES(null));
                       }
                        toast({
                            title: "Successfully fetched files",
                            description: "You can now add files to this folder",
                        })
                    } catch (error) {
                        console.error("Error loading files ",error);
                        toast({
                            title: "Failed to fetch files",
                            description: "Please try again later",
                            variant: "destructive"
                        })
                        // setError(error);
                    }
                }
    return(
        <>
             <div className="flex sticky z-20 top-0 bg-background w-full h-10 group/title justify-between
             items-center pr-4 text-Neutrals/neutrals-8 pl-4">
                <span className="font-bold text-Neutrals-8 text-lg">
                        FILES
                </span>
             </div>
             <div className="flex pl-5">
                <Accordion
                                type="multiple"
                                defaultValue={[ currentFile?._id?.toString() || '']}
                                className="pb-20"
                                >
                                    {
                                   files.filter((file:ReduxFile) => !file.inTrash)
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

const FolderFileList = React.memo(FolderFileListInner);
export default FolderFileList;
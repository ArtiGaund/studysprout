"use client"
import { File } from "@/model/file.model";
import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import { RootState } from "@/store/store";
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import 'quill/dist/quill.snow.css';
import { Button } from "../ui/button";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import { DELETE_FILE, UPDATE_FILE } from "@/store/slices/fileSlice";
import { DELETE_FOLDER, UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { DELETE_WORKSPACE, UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";


interface TextEditorProps{
    dirDetails: WorkSpace | Folder | File;
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
  
const TextEditor: React.FC<TextEditorProps> = ({
    dirDetails,
    fileId,
    dirType
}) => {
    const state = useSelector((state: RootState) => state.workspace)
    const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace?._id)
    const folderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    const dispatch = useDispatch()
    const [ quill, setQuill ] = useState<any>()
    const { toast } = useToast()

    // to collect data from server side and client side
    const details = useMemo(() => {
        let selectedDir
        if(dirType === "file"){
            const selectedWorkspace = state.workspaces.find((workspace) => workspace._id === workspaceId)
            const selectedFolder = selectedWorkspace?.folders?.find((folder) => folder._id === folderId)
            const selectedFile = selectedFolder?.files?.find((file) => file._id === fileId)
            selectedDir = selectedFile
        }
        if(dirType === "folder"){
            const selectedWorkspace = state.workspaces.find((workspace) => workspace._id === workspaceId)
            const selectedFolder = selectedWorkspace?.folders?.find((folder) => folder._id === fileId)
            selectedDir = selectedFolder
        }
        if(dirType === "workspace"){
            selectedDir = state.workspaces.find((workspace) => workspace._id?.toString() === fileId)
        }

        if(selectedDir){
            return selectedDir
        }
        // else return new object
        return {
            // title: dirDetails.title,
            iconId: dirDetails.iconId,
            data: dirDetails.data,
            inTrash: dirDetails.inTrash,
            bannerUrl: dirDetails.bannerUrl
            // createdAt: dirDetails.createdAt
        } as WorkSpace | Folder | File
    }, [state, workspaceId, folderId, fileId, dirDetails])

    // quill need window object
    const wrapperRef = useCallback((wrapper: HTMLDivElement | null) => {
        if (typeof window !== "undefined") {
            if (wrapper === null) return
            wrapper.innerHTML = '';
            const editor = document.createElement('div')
            wrapper.append(editor)
            import('quill').then(QuillModule => {
                const Quill = QuillModule.default
                const q = new Quill(editor, {
                    theme: 'snow',
                    modules: {
                        toolbar: TOOLBAR_OPTIONS,
                    },
                })
                setQuill(q)
            })
        }
    }, [])


    const restoreFileHandler = async() => {
        const updateFile: Partial<File> = {
            _id: fileId,
            inTrash: '',
        }
        if(dirType === "file"){
            if(!folderId) return
           dispatch(UPDATE_FILE(updateFile))
            try {
                const response = await axios.post(`/api/update-file`, updateFile)
                if(!response.data.success){
                    toast({
                        title: "Failed to restore file",
                        description: response.data.message,
                        variant: "destructive"
                    })
                }else{
                    const file= response.data.data.file
                    const folder = response.data.data.folder
                    const workspace = response.data.data.workspace
                    dispatch(UPDATE_FILE(file))
                    dispatch(UPDATE_FOLDER(folder))
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "File restored successfully",
                        description: "File is removed from trash",
                    })
                }
            } catch (error) {
                console.log("Error while restoring file ",error)
                toast({
                    title: "Failed to restore file",
                    description: "Something went wrong",
                    variant: "destructive"
                })
            }
        }
        if(dirType === "folder"){
            dispatch(UPDATE_FOLDER(updateFile))
            try {
                const response = await axios.post(`/api/update-folder`, updateFile)
                if(!response.data.success){
                    toast({
                        title: "Failed to restore folder",
                        description: response.data.message,
                        variant: "destructive"
                    })
                }else{
                    const folder = response.data.data.folder
                    const workspace = response.data.data.workspace
                    dispatch(UPDATE_FOLDER(folder))
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "Folder restored successfully",
                        description: "Folder is removed from trash",
                    })
                }
            } catch (error) {
                console.log("Error while restoring folder ",error)
                toast({
                    title: "Failed to restore folder",
                    description: "Something went wrong",
                    variant: "destructive"
                })
            }
        }
        // if(dirType === "workspace"){
        //     try {
        //         const response = await axios.post(`/api/update-workspace`, updateFile)
        //         if(!response.data.success){
        //             toast({
        //                 title: "Failed to restore workspace",
        //                 description: response.data.message,
        //                 variant: "destructive"
        //             })
        //         }else{
        //             const workspace = response.data.data
        //             dispatch(UPDATE_WORKSPACE(workspace))
        //             toast({
        //                 title: "Workspace restored successfully",
        //                 description: "Workspace is removed from trash",
        //             })
        //         }
        //     } catch (error) {
        //         console.log("Error while restoring workspace ",error)
        //         toast({
        //             title: "Failed to restore workspace",
        //             description: "Something went wrong",
        //             variant: "destructive"
        //         })
        //     }
        // }
    }

    const deleteFile = async() => {
        if(dirType === "file"){
            try {
                const response = await axios.delete(`/api/delete-file?fileId=${fileId}`)
                if(!response.data.success){
                    toast({
                        title: "Failed to delete file",
                        description: response.data.message,
                        variant: "destructive"
                    })
                }else{
                    const folder = response.data.data.folderUpdate
                    const workspace = response.data.data.workspaceUpdate
                    dispatch(DELETE_FILE(fileId))
                    dispatch(UPDATE_FOLDER(folder))
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "File deleted successfully",
                        description: "File is premanantly deleted",
                    })
                }
            } catch (error) {
                console.log("Error while deleting file ",error)
                toast({
                    title: "Failed to delete file",
                    description: "Something went wrong",
                    variant: "destructive"
                })
            }
        }
        if(dirType === "folder"){
            try {
                const response = await axios.delete(`/api/delete-folder?folderId=${fileId}`)
                if(!response.data.success){
                    toast({
                        title: "Failed to delete folder",
                        description: response.data.message,
                        variant: "destructive"
                    })
                }else{
                    const workspace = response.data.data
                    dispatch(DELETE_FOLDER(fileId))
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "Folder deleted successfully",
                        description: "Folder is premanantly deleted",
                    })
                }
            } catch (error) {
                console.log("Error while deleting folder ",error)
                toast({
                    title: "Failed to delete folder",
                    description: "Something went wrong",
                    variant: "destructive"
                })
            }
        } 
        // if(dirType === "workspace"){
        //     try {
        //         const response = await axios.delete(`/api/delete-workspace?workspaceId=${fileId}`)
        //         if(!response.data.success){
        //             toast({
        //                 title: "Failed to delete workspace",
        //                 description: response.data.message,
        //                 variant: "destructive"
        //             })
        //         }else{
        //             dispatch(DELETE_WORKSPACE(fileId))
        //             toast({
        //                 title: "Workspace deleted successfully",
        //                 description: "Workspace is premanantly deleted",
        //             })
        //         }
        //     } catch (error) {
        //         console.log("Error while deleting workspace ",error)
        //         toast({
        //             title: "Failed to delete workspace",
        //             description: "Something went wrong",
        //             variant: "destructive"
        //         })
        //     }
        // }
    }
    return(
        <>
            <div className="relative">
                {details.inTrash && (
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
                             onClick={restoreFileHandler}
                             >Restore</Button>
                             <Button
                             size={"sm"} 
                             variant={"outline"}
                             className="bg-transparent border-white text-white
                              hover:bg-white hover:text-[#EB5757]"
                              onClick={deleteFile}
                             >Delete</Button>
                        </div>
                        <span className="text-sm text-white">
                            {details.inTrash}
                        </span>
                     </article>
                )}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between
                 justify-center">

                </div>
            </div>
            <div className="flex justify-center items-center flex-col mt-2 relative">
                <div 
                id="container" 
                ref={wrapperRef}
                className="max-w-[800px]"
                >
                </div>
            </div>
        </>
    )
}

export default TextEditor
"use client"
import { File } from "@/model/file.model";
import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import { RootState } from "@/store/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import 'quill/dist/quill.snow.css';
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



interface BannerSectionProps{
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
  
const BannerSection: React.FC<BannerSectionProps> = ({
    dirDetails,
    fileId,
    dirType
}) => {
    const state = useSelector((state: RootState) => state.workspace)
    const workspace = useSelector((state: RootState) => state.workspace.currentWorkspace)
    const folder = useSelector((state:RootState) => state.folder.currentFolder)
    const file = useSelector((state:RootState) => state.file.currentFile)
    const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace?._id)
    const folderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    const dispatch = useDispatch()
    const [ quill, setQuill ] = useState<any>()
    const { toast } = useToast()
    const pathname = usePathname()
    const [ saving, setSaving ] = useState(false)
    const [ imageUrl, setImageUrl ] = useState('')
    const [ removingBanner, setRemovingBanner ] = useState(false)
    const router = useRouter()

    
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
    }, [state, workspaceId, folderId, fileId, dirDetails, workspace, folder, file])


    const fetchBanner = async () => {
        if(!details.bannerUrl) return
        try {
            const response = await axios.get(`/api/get-image?imageId=${details.bannerUrl}`)
            if(!response.data.success){
                console.log("Error while fetching banner", response.data.message)
            }else{
                const imageUrl = response.data.data
                setImageUrl(imageUrl)
            }
        } catch (error) {
            console.log("Error while fetching banner", error)
        }
    }

    useEffect(() => {
        fetchBanner()
    }, [details.bannerUrl])

    // Update details when dirDetails changes
    useEffect(() => {
        if (dirDetails.bannerUrl) {
           fetchBanner()
        }
    }, [dirDetails.bannerUrl]);

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
        
        if(dirType === "file"){
            if(!folderId) return
            const updateFile: Partial<File> = {
                _id: fileId,
                inTrash: '',
            }
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
            const updateFolder: Partial<Folder> = {
                _id: fileId,
                inTrash: '',
            }
            dispatch(UPDATE_FOLDER(updateFolder))
            try {
                const response = await axios.post(`/api/update-folder`, updateFolder)
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
                    router.replace(`/dashboard/${workspaceId}/${folderId}`)
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
                    router.replace(`/dashboard/${workspaceId}`)
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
      
    }
    const breadCrumbs = useMemo(() => {
        if (!pathname || !state.workspaces || !workspaceId) return;
        const segments = pathname
          .split('/')
          .filter((val) => val !== 'dashboard' && val);
        const workspaceDetails = state.workspaces.find(
          (workspace) => workspace._id === workspaceId
        );
        const workspaceBreadCrumb = workspaceDetails
          ? `${workspaceDetails.iconId} ${workspaceDetails.workspaceName}`
          : '';
        if (segments.length === 1) {
          return workspaceBreadCrumb;
        }
    
        const folderSegment = segments[1];
        const folderDetails = workspaceDetails?.folders?.find(
          (folder) => folder._id === folderSegment
        );
        const folderBreadCrumb = folderDetails
          ? `/ ${folderDetails.iconId} ${folderDetails.title}`
          : '';
    
        if (segments.length === 2) {
          return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
        }
    
        const fileSegment = segments[2];
        const fileDetails = folderDetails?.files?.find(
          (file) => file._id === fileSegment
        );
        const fileBreadCrumb = fileDetails
          ? `/ ${fileDetails.iconId} ${fileDetails.title}`
          : '';
    
        return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
      }, [state, pathname, workspaceId]);

      const iconOnChange = async(icon: string) => {
        if(!fileId) return
        if(dirType === "workspace"){
            const updateWorkspace: Partial<WorkSpace> = {
                _id: fileId,
                iconId: icon
            }
            try {
                const response = await axios.post(`/api/update-workspace`,updateWorkspace)
                if(!response.data.success){
                    toast({
                        title: "Failed to change the icon",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                }else{
                    const workspace = response.data.data
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "Success",
                        description: "Successfully changed the icon for the workspace"
                    })
                }
            } catch (error) {
                console.log("Error while changing the icon of workspace ",error)
                toast({
                    title: "Failed to change the icon of workspace.",
                    description: "Error while changing the icon of workspace",
                    variant: "destructive"
                })
            }
        }
        if(dirType === "folder"){
            const updateFolder: Partial<Folder> = {
                _id: fileId,
                iconId: icon
            }
            try {
                const response = await axios.post(`/api/update-folder`,updateFolder)
                if(!response.data.success){
                    toast({
                        title: "Failed to change the icon",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                }else{
                    const folder = response.data.data.folder
                    const workspace = response.data.data.workspace
                    dispatch(UPDATE_FOLDER(folder))
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "Success",
                        description: "Successfully changed the icon for the folder"
                    })
                }
            } catch (error) {
                console.log("Error while changing the icon of folder ",error)
                toast({
                    title: "Failed to change the icon of folder.",
                    description: "Error while changing the icon of folder",
                    variant: "destructive"
                })
            }
        }
        if(dirType === "file"){
            const updateFile: Partial<File> = {
                _id: fileId,
                iconId: icon
            }
            try {
                const response = await axios.post(`/api/update-file`,updateFile)
                if(!response.data.success){
                    toast({
                        title: "Failed to change the icon",
                        description: "Please try again later",
                        variant: "destructive"
                    })
                }else{
                    const file = response.data.data.file
                    const folder = response.data.data.folder
                    const workspace = response.data.data.workspace
                    dispatch(UPDATE_FILE(file))
                    dispatch(UPDATE_FOLDER(folder))
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "Success",
                        description: "Successfully changed the icon for the file"
                    })
                }
            } catch (error) {
                console.log("Error while changing the icon of file ",error)
                toast({
                    title: "Failed to change the icon of file.",
                    description: "Error while changing the icon of file",
                    variant: "destructive"
                })
            }
        }
      }
      const deleteBanner = async() => {
        if(!fileId) return
        if(dirType === "file"){
            setRemovingBanner(true)
            try {
                const response = await axios.delete(`/api/delete-file-banner?fileId=${fileId}`)
                if(!response.data.success){
                    toast({
                        title: "Failed",
                        description: "Failed to remove banner for the file. Please try again later. ",
                        variant: "destructive"
                    })
                }else{
                    const file=response.data.data.file
                    const folder=response.data.data.folder
                    const workspace=response.data.data.workspace
                    dispatch(UPDATE_FILE(file))
                    dispatch(UPDATE_FOLDER(folder))
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "Success",
                        description: "Successfully removed banner for the file."
                    })
                }
            } catch (error) {
                console.log("Error while removing banner ",error)
                toast({
                    title: "Failed",
                    description: "Error while removing banner. Please try again later. ",
                    variant: "destructive"
                })
            }finally{
                setRemovingBanner(false)
            }
        }
        if(dirType === "folder"){
            setRemovingBanner(true)
            try {
                const response = await axios.delete(`/api/delete-folder-banner?folderId=${fileId}`)
                if(!response.data.success){
                    toast({
                        title: "Failed",
                        description: "Failed to remove banner for the folder. Please try again later. ",
                        variant: "destructive"
                    })
                }else{
                    const folder=response.data.data.folder
                    const workspace=response.data.data.workspace
                    dispatch(UPDATE_FOLDER(folder))
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "Success",
                        description: "Successfully removed banner for the folder."
                    })
                }
            } catch (error) {
                console.log("Error while removing banner ",error)
                toast({
                    title: "Failed",
                    description: "Error while removing banner. Please try again later. ",
                    variant: "destructive"
                })
            }finally{
                setRemovingBanner(false)
            }
        }
        if(dirType === "workspace"){
            setRemovingBanner(true)
            try {
                const response = await axios.delete(`/api/delete-workspace-banner?workspaceId=${fileId}`)
                if(!response.data.success){
                    toast({
                        title: "Failed",
                        description: "Failed to remove banner for the workspace. Please try again later. ",
                        variant: "destructive"
                    })
                }else{
                    const workspace=response.data.data.workspace
                    dispatch(UPDATE_WORKSPACE(workspace))
                    toast({
                        title: "Success",
                        description: "Successfully removed banner for the workspace."
                    })
                }
            } catch (error) {
                console.log("Error while removing banner ",error)
                toast({
                    title: "Failed",
                    description: "Error while removing banner. Please try again later. ",
                    variant: "destructive"
                })
            }finally{
                setRemovingBanner(false)
            }
        }
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
                 justify-center sm:items-center sm:p-2 p-8">
                    <div>{breadCrumbs}</div>
                    <div className="flex items-center gap-4">
                        { saving ? (
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
            {details.bannerUrl && (
                 <div className="relative w-full h-[200px]">
                 <Image 
                 src={imageUrl}
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
                        <EmojiPicker getValue={iconOnChange}>
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
                         onClick={deleteBanner}
                        >   
                            <XCircleIcon size={16}/>
                            <span className="whitespace-nowrap font-normal">Remove Banner</span>
                        </Button>
                        }
                     </div>
                     <span className="text-muted-foreground text-3xl font-bold h-9">
                        {/* {details.title} */}
                     </span>
                     <span className="text-sm text-muted-foreground">
                        {dirType.toUpperCase()}
                     </span>
                </div>
                {/* <div 
                id="container" 
                ref={wrapperRef}
                className="max-w-[800px]"
                >
                </div> */}
            </div>
        </>
    )
}

export default BannerSection
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
    
    const workspaceState = useSelector((state: RootState) => state.workspace)
    const folderState = useSelector((state:RootState) => state.folder)
    const fileState = useSelector((state:RootState) => state.file)
    const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace)
    const folderId = useSelector((state: RootState) => state.folder.currentFolder)

    const { currentWorkspace, workspaces } = useWorkspace();
    const { currentFolder } = useFolder();
    const { currentFile } = useFile();
    const dispatch = useDispatch()
    const { toast } = useToast()
    const pathname = usePathname()
    // const [ saving, setSaving ] = useState(false)
    // const [ imageUrl, setImageUrl ] = useState('')
    // const [ removingBanner, setRemovingBanner ] = useState(false)
    // const router = useRouter()
    

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
        currentFolderId: currentFolder?._id,
        currentFileId: currentFile?._id
    })
    // to collect data from server side and client side
//    const details = useMemo(() => {
//     let selectedDir: ReduxWorkSpace | ReduxFolder | ReduxFile | undefined;
//     if(dirType === "file"){
//         selectedDir = fileState.files.find((file) => file._id?.toString() === fileId)
//     }
//     if(dirType === "folder"){
//         selectedDir = folderState.folders.find((folder) => folder._id?.toString() === fileId)
//     }
//     if(dirType === "workspace"){
//         selectedDir = workspaceState.workspaces
//             .filter((workspace): workspace is ReduxWorkSpace => typeof workspace._id === "string")
//             .find((workspace) => workspace._id === fileId);
//     }

//     if(selectedDir){
//         return selectedDir
//     }
//     // else return new object
//     return {
//         title: dirDetails.title,
//         iconId: dirDetails.iconId,
//         data: dirDetails.data,
//         inTrash: dirDetails.inTrash,
//         bannerUrl: dirDetails.bannerUrl
//         // createdAt: dirDetails.createdAt
//     } as ReduxWorkSpace | ReduxFolder | ReduxFile
// }, [fileState.files, folderState.folders, workspaceState.workspaces, fileId, dirDetails, dirType]) // Corrected dependencies


    // const fetchBanner = async () => {
    //     if(!details.bannerUrl) return
    //     try {
    //         const response = await axios.get(`/api/get-image?imageId=${details.bannerUrl}`)
    //         if(!response.data.success){
    //             console.log("Error while fetching banner", response.data.message)
    //         }else{
    //             const imageUrl = response.data.data
    //             setImageUrl(imageUrl)
    //         }
    //     } catch (error) {
    //         console.log("Error while fetching banner", error)
    //     }
    // }

    // useEffect(() => {
    //     fetchBanner()
    // }, [details.bannerUrl])

    // Update details when dirDetails changes
    // useEffect(() => {
    //     if (dirDetails.bannerUrl) {
    //        fetchBanner()
    //     }
    // }, [dirDetails.bannerUrl]);



    // const restoreFileHandler = async() => {
        
    //     if(dirType === "file"){
    //         if(!folderId) return
    //         const updateFile: Partial<ReduxFile> = {
    //             _id: fileId,
    //             inTrash: '',
    //         }
    //        dispatch(UPDATE_FILE(updateFile))
    //         try {
    //             const response = await axios.post(`/api/update-file`, updateFile)
    //             if(!response.data.success){
    //                 toast({
    //                     title: "Failed to restore file",
    //                     description: response.data.message,
    //                     variant: "destructive"
    //                 })
    //             }else{
    //                 const file= response.data.data.file as ReduxFile;
    //                 const folder = response.data.data.folder as ReduxFolder;
    //                 const workspace = response.data.data.workspace as ReduxWorkSpace;
    //                 dispatch(UPDATE_FILE(file))
    //                 dispatch(UPDATE_FOLDER(folder))
    //                 dispatch(UPDATE_WORKSPACE(workspace))
    //                 toast({
    //                     title: "File restored successfully",
    //                     description: "File is removed from trash",
    //                 })
    //             }
    //         } catch (error) {
    //             console.log("Error while restoring file ",error)
    //             toast({
    //                 title: "Failed to restore file",
    //                 description: "Something went wrong",
    //                 variant: "destructive"
    //             })
    //         }
    //     }
    //     if(dirType === "folder"){
    //         const updateFolder: Partial<ReduxFolder> = {
    //             _id: fileId,
    //             inTrash: '',
    //         }
    //         dispatch(UPDATE_FOLDER(updateFolder))
    //         try {
    //             const response = await axios.post(`/api/update-folder`, updateFolder)
    //             if(!response.data.success){
    //                 toast({
    //                     title: "Failed to restore folder",
    //                     description: response.data.message,
    //                     variant: "destructive"
    //                 })
    //             }else{
    //                 const folder = response.data.data.folder as ReduxFolder;
    //                 const workspace = response.data.data.workspace as ReduxWorkSpace;
    //                 dispatch(UPDATE_FOLDER(folder))
    //                 dispatch(UPDATE_WORKSPACE(workspace))
    //                 toast({
    //                     title: "Folder restored successfully",
    //                     description: "Folder is removed from trash",
    //                 })
    //             }
    //         } catch (error) {
    //             console.log("Error while restoring folder ",error)
    //             toast({
    //                 title: "Failed to restore folder",
    //                 description: "Something went wrong",
    //                 variant: "destructive"
    //             })
    //         }
    //     }
       
    // }

    // const deleteFile = async() => {
        
        // if(dirType === "file"){
        //     try {
        //         const response = await axios.delete(`/api/delete-file?fileId=${fileId}`)
        //         if(!response.data.success){
        //             toast({
        //                 title: "Failed to delete file",
        //                 description: response.data.message,
        //                 variant: "destructive"
        //             })
        //         }else{
        //             const folder = response.data.data.folderUpdate as ReduxFolder;
        //             const workspace = response.data.data.workspaceUpdate as ReduxWorkSpace; 
        //             dispatch(DELETE_FILE(fileId))
        //             dispatch(UPDATE_FOLDER(folder))
        //             dispatch(UPDATE_WORKSPACE(workspace))
        //             toast({
        //                 title: "File deleted successfully",
        //                 description: "File is premanantly deleted",
        //             })
        //             router.replace(`/dashboard/${workspaceId}/${folderId}`)
        //         }
        //     } catch (error) {
        //         console.log("Error while deleting file ",error)
        //         toast({
        //             title: "Failed to delete file",
        //             description: "Something went wrong",
        //             variant: "destructive"
        //         })
        //     }
        // }
        // if(dirType === "folder"){
        //     try {
        //         const response = await axios.delete(`/api/delete-folder?folderId=${fileId}`)
        //         if(!response.data.success){
        //             toast({
        //                 title: "Failed to delete folder",
        //                 description: response.data.message,
        //                 variant: "destructive"
        //             })
        //         }else{
        //             const workspace = response.data.data as ReduxWorkSpace;
        //             dispatch(DELETE_FOLDER(fileId))
        //             dispatch(UPDATE_WORKSPACE(workspace))
        //             toast({
        //                 title: "Folder deleted successfully",
        //                 description: "Folder is premanantly deleted",
        //             })
        //             router.replace(`/dashboard/${workspaceId}`)
        //         }
        //     } catch (error) {
        //         console.log("Error while deleting folder ",error)
        //         toast({
        //             title: "Failed to delete folder",
        //             description: "Something went wrong",
        //             variant: "destructive"
        //         })
        //     }
        // } 
      
    // }
    const breadCrumbs = useMemo(() => {
        // if (!pathname || !workspaceState.workspaces || !workspaceId) return;
        // const segments = pathname
        //   .split('/')
        //   .filter((val) => val !== 'dashboard' && val);
        // const workspaceDetails = workspaceState.workspaces.find( workspace => workspace._id === workspaceId);
        // const workspaceBreadCrumb = workspaceDetails
        //   ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
        //   : '';
        // if (segments.length === 1) {
        //   return workspaceBreadCrumb;
        // }
    
        // const folderSegment = segments[1];
        // const folderDetails = folderState.folders?.find(
        //   (folder) => folder._id === folderSegment
        // )
        // const folderBreadCrumb = folderDetails
        //   ? `/ ${folderDetails.iconId} ${folderDetails.title}`
        //   : '';
    
        // if (segments.length === 2) {
        //   return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
        // }
    
        // const fileSegment = segments[2];
        // const fileDetails = fileState.files?.find((file) => file._id === fileSegment)
        // const fileBreadCrumb = fileDetails
        //   ? `/ ${fileDetails.iconId} ${fileDetails.title}`
        //   : '';
    
        // return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
        if(!pathname || !workspaceState.allIds || !workspaceId) return;
        const segments = pathname.split('/').filter((val) => val !== 'dashboard' && val);

        // access byId for more efficiency lookup
        const workspaceDetails = workspaceState.byId[workspaceId];
        const workspaceBreadCrumb = workspaceDetails 
        ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
        : '';
        if(segments.length === 1){
            return workspaceBreadCrumb;
        }
        const folderSegment = segments[1];
        const folderDetails = folderState.byId[folderId!];
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
          workspaceId,
          workspaceState.byId,
          folderState.byId,
          fileState.byId,
    ]);

//       const iconOnChange = async (icon: string) => {
//             if (!fileId) return; // fileId is the ID of the current entity

//             setSaving(true); // Indicate saving state
//             let updatePayload: Partial<ReduxWorkSpace | ReduxFolder | ReduxFile>;
//             let apiUrl: string;
//             let successMessage: string;

//             if (dirType === "workspace") {
//             updatePayload = { _id: fileId, iconId: icon };
//             apiUrl = `/api/update-workspace`;
//             successMessage = "Successfully changed the icon for the workspace";
//             } else if (dirType === "folder") {
//             updatePayload = { _id: fileId, iconId: icon };
//             apiUrl = `/api/update-folder`;
//             successMessage = "Successfully changed the icon for the folder";
//             } else if (dirType === "file") {
//             updatePayload = { _id: fileId, iconId: icon };
//             apiUrl = `/api/update-file`;
//             successMessage = "Successfully changed the icon for the file";
//             } else {
//             setSaving(false);
//             return; // Should not happen with valid dirType
//             }

//             try {
//             const response = await axios.post(apiUrl, updatePayload);
//             if (!response.data.success) {
//                 toast({
//                 title: "Failed to change the icon",
//                 description: response.data.message || "Please try again later",
//                 variant: "destructive",
//                 });
//             } else {
//                 // Assuming API returns updated full objects, cast them
//                 if (dirType === "file") {
//                 dispatch(UPDATE_FILE(response.data.data.file as ReduxFile));
//                 dispatch(UPDATE_FOLDER(response.data.data.folder as ReduxFolder));
//                 dispatch(UPDATE_WORKSPACE(response.data.data.workspace as ReduxWorkSpace));
//                 } else if (dirType === "folder") {
//                 dispatch(UPDATE_FOLDER(response.data.data.folder as ReduxFolder));
//                 dispatch(UPDATE_WORKSPACE(response.data.data.workspace as ReduxWorkSpace));
//                 } else if (dirType === "workspace") {
//                 dispatch(UPDATE_WORKSPACE(response.data.data as ReduxWorkSpace)); // Assuming direct workspace object
//                 }
//                 toast({
//                 title: "Success",
//                 description: successMessage,
//                 });
//             }
//             } catch (error) {
//             console.log(`Error while changing the icon of ${dirType} `, error);
//             toast({
//                 title: `Failed to change the icon of ${dirType}.`,
//                 description: "Something went wrong",
//                 variant: "destructive",
//             });
//             } finally {
//             setSaving(false);
//             }
//     };

//        const deleteBanner = async () => {
//     if (!fileId) return;

//     setRemovingBanner(true);
//     let apiUrl: string;
//     let successMessage: string;
//     let errorMessage: string;

//     if (dirType === "file") {
//       apiUrl = `/api/delete-file-banner?fileId=${fileId}`;
//       successMessage = "Successfully removed banner for the file.";
//       errorMessage = "Failed to remove banner for the file.";
//     } else if (dirType === "folder") {
//       apiUrl = `/api/delete-folder-banner?folderId=${fileId}`;
//       successMessage = "Successfully removed banner for the folder.";
//       errorMessage = "Failed to remove banner for the folder.";
//     } else if (dirType === "workspace") {
//       apiUrl = `/api/delete-workspace-banner?workspaceId=${fileId}`;
//       successMessage = "Successfully removed banner for the workspace.";
//       errorMessage = "Failed to remove banner for the workspace.";
//     } else {
//       setRemovingBanner(false);
//       return;
//     }

//     try {
//       const response = await axios.delete(apiUrl);
//       if (!response.data.success) {
//         toast({
//           title: "Failed",
//           description: response.data.message || `${errorMessage} Please try again later.`,
//           variant: "destructive",
//         });
//       } else {
//         // Dispatch updates based on what the API returns.
//         // Assuming it returns the updated entity (e.g., file with bannerUrl removed)
//         if (dirType === "file") {
//           dispatch(UPDATE_FILE(response.data.data.file as ReduxFile));
//           dispatch(UPDATE_FOLDER(response.data.data.folder as ReduxFolder));
//           dispatch(UPDATE_WORKSPACE(response.data.data.workspace as ReduxWorkSpace));
//         } else if (dirType === "folder") {
//           dispatch(UPDATE_FOLDER(response.data.data.folder as ReduxFolder));
//           dispatch(UPDATE_WORKSPACE(response.data.data.workspace as ReduxWorkSpace));
//         } else if (dirType === "workspace") {
//           dispatch(UPDATE_WORKSPACE(response.data.data.workspace as ReduxWorkSpace));
//         }
//         toast({
//           title: "Success",
//           description: successMessage,
//         });
//       }
//     } catch (error) {
//       console.log(`Error while removing banner for ${dirType} `, error);
//       toast({
//         title: "Failed",
//         description: `${errorMessage} Something went wrong.`,
//         variant: "destructive",
//       });
//     } finally {
//       setRemovingBanner(false);
//     }
//   };

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
                             >Restore</Button>
                             <Button
                             size={"sm"} 
                             variant={"outline"}
                             className="bg-transparent border-white text-white
                              hover:bg-white hover:text-[#EB5757]"
                              onClick={handleDelete}
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
                     <span className="text-3xl font-bold text-muted-foreground h-9">
                        {details.title} <span className="text-sm ml-2">({dirType.toUpperCase()})</span>
                    </span>
                </div>
                
            </div>
        </>
    )
}

export default BannerSection
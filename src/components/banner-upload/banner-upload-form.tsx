"use client"
import { File as MongooseFile } from "@/model/file.model";
import { Folder } from "@/model/folder.model";
import { WorkSpace } from "@/model/workspace.model";
import { RootState } from "@/store/store";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { uploadBannerFormSchema } from "@/schemas/uploadBannerFormSchema"
import { z } from "zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader } from "lucide-react";
import { toast, useToast } from "../ui/use-toast";
import axios from "axios";
import { UPDATE_FILE } from "@/store/slices/fileSlice";
import { UPDATE_FOLDER } from "@/store/slices/folderSlice";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { ReduxFile, ReduxFolder, ReduxWorkSpace } from "@/types/state.type";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useFolder } from "@/hooks/useFolder";

interface BannerUploadFormProps {
    onUpload: (file: File) => Promise<void>;
    isUploading: boolean;
}

const BannerUploadForm: React.FC<BannerUploadFormProps> = ({
   onUpload,
   isUploading
}) => {
    // const state = useSelector((state: RootState) => state.workspace)
    // const workspaceId = useSelector((state: RootState) => state.workspace.currentWorkspace?._id)
    // const folderId = useSelector((state: RootState) => state.folder.currentFolder?._id)
    // const { currentWorkspace } = useWorkspace();
    // const { currentFolder } = useFolder();
    // const [ banner, setBanner ] = useState('')
    const [ selectedFile, setSelectedFile ] = useState<File | null>(null);
    const dispatch = useDispatch()
    // const { toast } = useToast()
    const { 
        register, 
        handleSubmit, 
        reset, 
        formState: { errors }
    } = useForm<z.infer< typeof uploadBannerFormSchema>>({
         mode: 'onChange',
        defaultValues: {
            banner: undefined,
        }
        })

    // have to upload the image

   const onChangeBannerHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };
    const onSubmitHandler:SubmitHandler<z.infer<typeof uploadBannerFormSchema>> = async () => {
        if(!selectedFile){
            toast({
                 title: "No file selected",
                description: "Please select an image to upload as banner.",
                variant: "destructive"
            })
            return;
        }
        try {
            await onUpload(selectedFile);
            reset();
            setSelectedFile(null);
        } catch (error) {
            console.error("Error during banner upload form submission:", error);
        }
        // const formData = new FormData()
        // formData.append("id",id)
        // formData.append("banner",banner)
        // if(dirType === "file"){
        //     try {
        //         const response = await axios.post(`/api/file-upload-banner`,formData)
        //         if(!response.data.success){
        //             toast({
        //                 title: "Failed to upload banner for the file",
        //                 description: "Please try again later",
        //                 variant: "destructive"
        //             })
        //         }else{
        //             const file=response.data.data.file
        //             const folder=response.data.data.folder
        //             const workspace=response.data.data.workspace
        //             dispatch(UPDATE_FILE(file))
        //             dispatch(UPDATE_FOLDER(folder))
        //             dispatch(UPDATE_WORKSPACE(workspace))
        //             toast({
        //                 title: "Success",
        //                 description: "Successfully uploaded banner for the file"
        //             })
        //         }

        //     } catch (error) {
        //         console.log("Error while uploading banner for the file ",error)
        //         toast({
        //             title: "Failed to upload banner for the file",
        //             description: "Please try again later",
        //             variant: "destructive"
        //         })
        //     }
        // }
        // if(dirType === "folder"){
        //     try {
        //         const response = await axios.post(`/api/folder-upload-banner`,formData)
        //         if(!response.data.success){
        //             toast({
        //                 title: "Failed to upload banner for the folder",
        //                 description: "Please try again later",
        //                 variant: "destructive"
        //             })
        //         }else{
        //             const folder=response.data.data.folder
        //             const workspace=response.data.data.workspace
        //             dispatch(UPDATE_FOLDER(folder))
        //             dispatch(UPDATE_WORKSPACE(workspace))
        //             toast({
        //                 title: "Success",
        //                 description: "Successfully uploaded banner for the folder"
        //             })
        //         }

        //     } catch (error) {
        //         console.log("Error while uploading banner for the folder ",error)
        //         toast({
        //             title: "Failed to upload banner for the folder",
        //             description: "Please try again later",
        //             variant: "destructive"
        //         })
        //     }
        // }
        // if(dirType === "workspace"){
        //     try {
        //         const response = await axios.post(`/api/workspace-upload-banner`,formData)
        //         if(!response.data.success){
        //             toast({
        //                 title: "Failed to upload banner for the workspace",
        //                 description: "Please try again later",
        //                 variant: "destructive"
        //             })
        //         }else{
        //             const workspace=response.data.data.workspace
        //             dispatch(UPDATE_WORKSPACE(workspace))
        //             toast({
        //                 title: "Success",
        //                 description: "Successfully uploaded banner for the workspace"
        //             })
        //         }

        //     } catch (error) {
        //         console.log("Error while uploading banner for the file ",error)
        //         toast({
        //             title: "Failed to upload banner for the file",
        //             description: "Please try again later",
        //             variant: "destructive"
        //         })
        //     }
        // }
    }
    return(
        <form
         onSubmit={handleSubmit(onSubmitHandler)}
         className="flex flex-col gap-2"
         >
            <Label 
            className="text-sm text-muted-foreground"
            htmlFor="bannerImage"
            >Banner Image</Label>
            <Input
            id="bannerImage"
            type="file"
            accept="image/*"
            disabled={isUploading}
            {...register('banner', {required: 'Banner image is required'})}
            onChange={onChangeBannerHandler}
            />
            <small className="text-red-600">
                {errors.banner?.message?.toString()}
            </small>
            <Button disabled={isUploading || !selectedFile} type="submit">
                {!isUploading ? "Upload Banner" : <Loader className="animate-spin" size={16}/>}
            </Button>
        </form>
    )
}

export default BannerUploadForm
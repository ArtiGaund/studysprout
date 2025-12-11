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
import { toast } from "../ui/use-toast";

interface BannerUploadFormProps {
    onUpload: (file: File) => Promise<void>;
    isUploading: boolean;
}

const BannerUploadForm: React.FC<BannerUploadFormProps> = ({
   onUpload,
   isUploading
}) => {
   
    const [ selectedFile, setSelectedFile ] = useState<File | null>(null);
   
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
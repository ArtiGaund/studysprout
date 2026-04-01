/**
 * @component BannerUploadForm
 * @description A specialized form component for handling image uploads.
 * It leverages Zod for schema validation and React Hook Form for state management,
 * providing a robust UX with real-time validation and loading states.
 * * Key Engineering Patterns:
 * - Schema-Driven Validation: Uses Zod to enforce file requirements.
 * - Manual File State Integration: Bridges the gap between browser FileList and Form state.
 * - Clean Cleanup: Resets internal state and form fields upon successful parent callback.
 */
"use client"
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { uploadBannerFormSchema } from "@/schemas/uploadBannerFormSchema"
import { z } from "zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader } from "lucide-react";
import { toast } from "../ui/use-toast";

interface BannerUploadFormProps {
    /**Callback to handle the actual file upload logic (API calls, etc) */
    onUpload: (file: File) => Promise<void>;
    /**Global or parent loading state to disable UI during transit */
    isUploading: boolean;
}

const BannerUploadForm: React.FC<BannerUploadFormProps> = ({
   onUpload,
   isUploading
}) => {
    // Track the actual File object for the upload callback
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

    /**
     * @handler onChangeBannerHandler
     * Syncs the HTML input file list with the local component state.
     */
   const onChangeBannerHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    /**
     * @handler onSubmitHandler
     * Final validation check before invoking the parent's onUpload logic.
     * Implements a clean-up phase on success.
     */
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
            /* Note: We merge react-hook-form's registration with our custom 
                   change handler to maintain validation and file access. 
                */
            {...register('banner', {required: 'Banner image is required'})}
            onChange={onChangeBannerHandler}
            />
            {/* Accessible error feedback */}
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
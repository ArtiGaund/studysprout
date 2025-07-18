"use client"

import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import EmojiPicker from "../global/emoji-picker"
import { useState } from "react"
import { Button } from "../ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "../ui/use-toast"
import axios from "axios"
import { ApiResponse } from "@/types/api.interface"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Label } from "../ui/label"
import { v4 as uuid4 } from "uuid";
import { useDispatch } from "react-redux"
import { ADD_WORKSPACE } from "@/store/slices/workspaceSlice"
import { useWorkspace } from "@/hooks/useWorkspace"

const DashboardSetup = () => {
    const { data: session, status } = useSession()
    // const [ isLoading, setIsLoading ] = useState(false)
    const [ isSubmitting, setIsSubmitting ] = useState(false)
    const [selectedEmoji, setSelectedEmoji] = useState('💼');
    const [ selectedImage, setSelectedImage ] = useState(null)
    const [workspaceTitle, setWorkspaceTitle ] = useState('')

    const { isLoadingWorkspaces, workspaceError, createWorkspace} = useWorkspace();

    // const dispatch = useDispatch()
    
    const { register  } = useForm()

    const { toast } = useToast()

    const router = useRouter()

    const onChangeImageHandler = (e:any) => {
        setSelectedImage(e.target.files[0]);
      };
      const onChangeWorkspaceNameHandler = (e:any) => {
        setWorkspaceTitle(e.target.value);
      }
    const handleSubmit = async(data:any) => {
       
        data.preventDefault()
        if (!workspaceTitle.trim()) {
            toast({
                title: "Validation Error",
                description: "Workspace name cannot be empty.",
                variant: "destructive"
            });
            return;
        }
         if (status !== "authenticated" || !session?.user?._id) {
            toast({
                title: "Authentication Error",
                description: "You must be logged in to create a workspace.",
                variant: "destructive"
            });
            return;
        }
        try {
            setIsSubmitting(true)
            // setIsLoading(true)
            const formData = new FormData()
            // const id = uuid4()
            // formData.append("_id",id)
            formData.append("workspaceName",workspaceTitle)
            if(session?.user._id){
                formData.append("userId",session?.user._id)
            }

            // console.log("form Data in frontend ",formData)

            if (selectedImage) {
                formData.append('logo', selectedImage);
            } else {
                // Handle the case where no image is selected (optional)
                console.warn('No image selected for upload.');
            }
            if(selectedEmoji){
                formData.append('iconId',selectedEmoji)
            }
            const response = await createWorkspace(formData)
            // console.log("Response success ",response.data.success)
           
            if (response.success && response.data) {
                toast({
                    title: "Workspace created successfully",
                    description: "Moving to your workspace"
                });
                router.push(`/dashboard/${response.data._id}`);
            } else {
                toast({
                    title: "Failed to create workspace",
                    description: response.error || "Please try again",
                    variant: "destructive"
                });
            }
        } catch (error) {
           console.error("Unexpected error during workspace creation:", error);
            toast({
                title: "Unexpected Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive"
            });
        } finally{
            // setIsLoading(false)
            setIsSubmitting(false)
        }
    }
    return(
        <div className="flex justify-center items-center">
            <div className=" flex relative top-[13rem]">
        <Card className="w-screen h-screen sm:h-auto sm:w-auto">
            <CardHeader>
                <CardTitle>Create a workspace</CardTitle>
                <CardDescription>
                    Lets create a private workspace to get you started. You can add collaborator later from 
                    the workspace setting tab.
                </CardDescription>
            </CardHeader>
                    <form  onSubmit={handleSubmit}>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl">
                                <EmojiPicker getValue={(emoji) => setSelectedEmoji(emoji)}>
                                    {selectedEmoji}
                                </EmojiPicker>
                                </div>
                                <div className="w-full">
                                    <Label
                                    htmlFor="workspaceName"
                                    className="text-sm text-muted-foreground"
                                    >
                                        Workspace name
                                    </Label>
                                    <Input 
                                    placeholder="Workspace name"
                                    disabled={isLoadingWorkspaces || isSubmitting}
                                    {...register("workspaceName", {required: true})}
                                    onChange={onChangeWorkspaceNameHandler}
                                    />
                                </div>
                            </div>
                            <div className="w-full">
                                    <Label
                                    htmlFor="logo"
                                    className="text-sm text-muted-foreground"
                                    >
                                        Workspace Logo
                                    </Label>
                                    <Input 
                                    placeholder="Workspace Logo"
                                    type="file"
                                    accept="image/*"
                                    disabled={isLoadingWorkspaces || isSubmitting}
                                    {...register("logo")}
                                    onChange={onChangeImageHandler}
                                    />
                            </div>
                       
                                    
                            
                                   
                        </div>
                        </CardContent>
                        <CardFooter className="self-end">
                            <Button
                            disabled={isLoadingWorkspaces}
                            type="submit"
                            >
                            {!isLoadingWorkspaces ? 'Create Workspace' : <Loader2 className="h-5 w-5 animate-spin"/>}    
                             </Button>
                        </CardFooter>
                    </form>

        </Card>
        </div>
        </div>
    )
}

export default DashboardSetup
/**
 * @component DashboardSetup
 * @description The primary onboarding interface for Workspace creation. 
 * It provides a managed form environment to collect branding and configuration 
 * data before the user enters their personalized dashboard.
 * * * Core Logic:
 * - Hybrid Form Management: Uses `react-hook-form` for structure and local state 
 * for binary data (files) and emojis.
 * - Multi-part Submission: Encapsulates inputs into `FormData` for compatibility 
 * with backend image processing (logos) and JSON fields.
 * - Auth Guarded: Integrated with Redux to verify session status before initiating 
 * server requests.
 */
"use client"

import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import EmojiPicker from "../global/emoji-picker"
import { useState } from "react"
import { Button } from "../ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "../ui/use-toast"
import { useRouter } from "next/navigation"
import { Label } from "../ui/label"
import { useWorkspace } from "@/hooks/useWorkspace"
import UserCard from "../sidebar/user-card"
import WorkspaceVisibilityToggle from "./workspace-visibility-toggle"
import { useSelector } from "react-redux"
import { selectAuthStatus, selectUserId } from "@/store/selectors/userSelector"
import { selectWorkspaceLoading } from "@/store/selectors/workspaceSelector"

const DashboardSetup = () => {
    // --- AUTH & GLOBAL STATE ---
    const userId = useSelector(selectUserId);
    const authStatus = useSelector(selectAuthStatus);
    const isLoadingWorkspace = useSelector(selectWorkspaceLoading);

    // --- LOCAL UI STATE ---
    const [ isSubmitting, setIsSubmitting ] = useState(false)
    const [selectedEmoji, setSelectedEmoji] = useState('💼');
    const [ selectedImage, setSelectedImage ] = useState(null)
    const [workspaceTitle, setWorkspaceTitle ] = useState('')
    const [ isPublic, setIsPublic ] = useState(false);

    
    const {
         createWorkspace
    } = useWorkspace();
    const { register  } = useForm()
    const { toast } = useToast()
    const router = useRouter()

    // --- EVENT HANDLERS ---

    /**
     * @handler onChangeImageHandler
     * Captures file input for the workspace logo.
     */
    const onChangeImageHandler = (e:any) => {
        setSelectedImage(e.target.files[0]);
      };

      /**
     * @handler onChangeWorkspaceNameHandler
     * Synchronizes the controlled input for the title.
     */
      const onChangeWorkspaceNameHandler = (e:any) => {
        setWorkspaceTitle(e.target.value);
      }

      /**
     * @handler handleSubmit
     * Orchestrates the workspace creation flow.
     * 1. Validates local constraints (Empty names, Auth status).
     * 2. Constructs FormData for multi-part file upload.
     * 3. Dispatches the creation request and handles navigation on success.
     */
    const handleSubmit = async(data:any) => {
       data.preventDefault();

        // 1. Client-side Validation
        if (!workspaceTitle.trim()) {
            toast({
                title: "Validation Error",
                description: "Workspace name cannot be empty.",
                variant: "destructive"
            });
            return;
        }
         if (authStatus !== "authenticated" || !userId) {
            toast({
                title: "Authentication Error",
                description: "You must be logged in to create a workspace.",
                variant: "destructive"
            });
            return;
        }
        try {
            setIsSubmitting(true)

            // 2. Prepare Payload
            const formData = new FormData()
            formData.append("workspaceName",workspaceTitle)
            if(userId){
                formData.append("userId",userId)
            }
            if (selectedImage) {
                formData.append('logo', selectedImage);
            } else {
                // Handle the case where no image is selected (optional)
                console.warn('No image selected for upload.');
            }
            if(selectedEmoji){
                formData.append('iconId',selectedEmoji)
            }
            if(isPublic){
                formData.append('isPublic', String(isPublic));
            }
            const response = await createWorkspace(formData)
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
                    Lets create a private or public (allow collaborators) workspace to get you started.
                </CardDescription>
            </CardHeader>


            <form  onSubmit={handleSubmit}>
                <CardContent>
                    {/* Branding: Icon & Name */}
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
                                    disabled={isLoadingWorkspace || isSubmitting}
                                    {...register("workspaceName", {required: true})}
                                    onChange={onChangeWorkspaceNameHandler}
                                />
                            </div>
                        </div>

                        {/* Logo Upload */}
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
                                disabled={isLoadingWorkspace || isSubmitting}
                                {...register("logo")}
                                onChange={onChangeImageHandler}
                            />
                        </div>
                       
                            {/* Permissions Logic */}
                            <div 
                            className="flex items-center gap-2"
                            onClick={(e) => e.preventDefault()}
                            >
                               <WorkspaceVisibilityToggle 
                               value={isPublic}
                               onChange={setIsPublic}
                               />
                            </div>
                                   
                        </div>
                        </CardContent>
                        <CardFooter className="self-end">
                            <Button
                            disabled={isLoadingWorkspace}
                            type="submit"
                            >
                            {!isLoadingWorkspace ? 'Create Workspace' : <Loader2 className="h-5 w-5 animate-spin"/>}    
                             </Button>
                        </CardFooter>
                    </form>

        </Card>
        </div>

       {/* Account Management Shortcut */}
        <div className="absolute bottom-4 right-4">
            <UserCard />
        </div>
        </div>
    )
}

export default DashboardSetup
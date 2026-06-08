"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { selectAuthStatus, selectUserId } from "@/store/selectors/userSelector";
import { useSelector } from "react-redux";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Image from "next/image";
import EmojiPicker from "../global/emoji-picker";
import { Loader2, Lock, Rocket } from "lucide-react";
import WorkspaceVisibilityToggle from "../dashboard-setup/workspace-visibility-toggle";
import { selectWorkspaceLoading } from "@/store/selectors/workspaceSelector";
import { signOut } from "next-auth/react";

const WorkspaceCreateForm = () => {
    // --- AUTH & GLOBAL STATE ---
    const userId = useSelector(selectUserId);
    const authStatus = useSelector(selectAuthStatus);
    const isLoadingWorkspace = useSelector(selectWorkspaceLoading);
    
    // --- LOCAL UI STATE ---
    const [ isSubmitting, setIsSubmitting ] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState('💼');
    const [ selectedImage, setSelectedImage ] = useState<File | null>(null);
    const [ imagePreviewUrl, setImagePreviewUrl ] = useState<string | null>(null);
    const [workspaceTitle, setWorkspaceTitle ] = useState('')
    const [ isPublic, setIsPublic ] = useState(false);
        
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { createWorkspace } = useWorkspace();
    const { toast } = useToast()
    const router = useRouter()

    // --- EVENT HANDLERS ---
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file){
            setSelectedImage(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    }
    
    /**
    * @handler handleSubmit
    * Orchestrates the workspace creation flow.
    * 1. Validates local constraints (Empty names, Auth status).
    * 2. Constructs FormData for multi-part file upload.
    * 3. Dispatches the creation request and handles navigation on success.
    */
    const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
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
        <div className="w-full max-w-md mx-auto bg-[#131316] border border-white/[0.05]
         rounded-xl p-5 sm:p-7 shadow-2xl text-left relative">
            <div>
                <h3 className="text-white text-lg font-bold tracking-tight">
                    Create Workspace
                </h3>
                <p className="text-zinc-500 text-xs mt-1 font-medium">
                    Initialize your research environment variables.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label
                        htmlFor="workspaceName"
                        className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 
                        uppercase block"
                    >   
                        Workspace Name
                    </label>
                    <input 
                        id="workspaceName"
                        type="text"
                        value={workspaceTitle}
                        onChange={(e) => setWorkspaceTitle(e.target.value)}
                        placeholder="e.g., Quantum Physics Research"
                        disabled={isLoadingWorkspace || isSubmitting}
                        className="w-full bg-[#18181c] border border-white/5
                        rounded-lg px-4 py-3 text-sm text-white outline-none
                      focus:border-purple-500/50 placeholder:text-zinc-700
                        font-medium transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold tracking-wider
                    text-zinc-500 uppercase block">
                        Workspace Brand
                    </label>
                    <div className="flex items-center gap-x-3 w-full bg-[#18181c]
                        border border-white/5 rounded-lg p-3">
                        {/* Dynamic Thumnail Preview Avatar Block */}
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 border
                        border-white/5 flex items-center justify-center shrink-0
                        overflow-hidden text-xl select-none relative group/emoji">
                            {imagePreviewUrl ? (
                                <Image 
                                    src={imagePreviewUrl}
                                    alt="Logo Preview"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <EmojiPicker getValue={(emoji) => setSelectedEmoji(emoji)}>
                                    <div className="cursor-pointer hover:scale-105 transition-transform">
                                        {selectedEmoji}
                                    </div>
                                </EmojiPicker>
                            )}
                        </div>

                        {/* Hidden Native File Input Field Wrapper */}
                        <div className="flex-1 min-w-0">
                            <input 
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isLoadingWorkspace || isSubmitting}
                                className="hidden"
                            />
                            <div className="flex items-center gap-x-2 w-full">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-zinc-800 hover:bg-zinc-700
                                    border border-white/5 text-[10px] font-mono
                                    font-bold tracking-tight px-3 py-2 rounded-md
                                    text-zinc-300 transition-colors cursor-pointer
                                    shrink-0"
                                >
                                    CHOOSE LOGO
                                </button>
                                <span className="text-[11px] font-mono text-zinc-600
                                truncate flex-1">
                                    {selectedImage 
                                        ? selectedImage.name
                                        : "Default brand icon active"
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#18181c] border border-white/5 rounded-xl p-4 flex 
                items-center justify-between gap-x-4">
                    <div className="flex items-start gap-x-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800/60 border
                        border-white/5 flex items-center justify-center shrink-0
                        text-zinc-400 mt-0.5">
                            <Lock size={14}/>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-white text-xs font-bold tracking-tight">
                                {isPublic ? "Public" : " Private"} Workspace
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                                {isPublic 
                                    ? "Open collaboration network" 
                                    : "Encrypted access only"
                                }
                            </span>
                        </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <WorkspaceVisibilityToggle value={isPublic} onChange={setIsPublic}/>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoadingWorkspace || isSubmitting}
                    className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white
                    disabled:bg-zinc-800 font-semibold text-sm py-3.5 px-4
                    rounded-xl flex items-center justify-center gap-x-2
                    transition-all cursor-pointer shadow-lg shadow-blue-600/10
                    active:scale-[0.99]"
                >
                    {isSubmitting || isLoadingWorkspace ? (
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400"/>
                    ) : (
                        <>
                            <Rocket size={14} strokeWidth={2.5}/>
                            <span>Create Workspace</span>
                        </>
                    )}
                </button>
            </form>

        </div>
    )
}

export default WorkspaceCreateForm;
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

import EmojiPicker from "../global/emoji-picker"
import { useRef, useState } from "react"
import {  
    FileText, 
    GitFork, 
    GraduationCap, 
    HelpCircle, 
    Loader2, 
    Lock, 
    LogOut, 
    Network, 
    Rocket, 
    TrendingUp, 
    User
} from "lucide-react"
import { useToast } from "../ui/use-toast"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/hooks/useWorkspace"
import WorkspaceVisibilityToggle from "./workspace-visibility-toggle"
import { useSelector } from "react-redux"
import { selectAuthStatus, selectUserId } from "@/store/selectors/userSelector"
import { selectWorkspaceLoading } from "@/store/selectors/workspaceSelector"
import { signOut } from "next-auth/react"
import Image from "next/image"
import { useUser } from "@/lib/providers/user-provider"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import SettingsPage from "../settings/settings"
import TooltipComponent from "../global/tooltip-component"

type StartingPoint = "academic" | "professional" | "personal";

interface TrackingFeatureCardProps{
    icon: React.ReactNode;
    title: string;
    description: string;
    animationClass: string;
    colorClass: string;
}

const FeatureCard = ({
    icon,
    title,
    description,
    animationClass,
    colorClass,
}: TrackingFeatureCardProps) => (
    <div 
        className="group relative bg-[#110A10] backdrop-blur-md border border-white/10
        hover:border-purple-500/40 p-6 rounded-xl space-y-3 transition-all duration-500
        hover:-translate-y-0.5 shadow-lg overflow-hidden font-mono"
    >
        {/* Ambient inner card glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"/>

        <div 
            className={`w-5 h-5 flex items-center justify-center transition-all duration-500 
                ${animationClass} ${colorClass}`}
        >
            {icon}
        </div>
        <h3 className="text-white text-sm font-bold tracking-tight">{title}</h3>
        <p className="text-neutral-400 text-xs font-mono leading-relaxed">{description}</p>
    </div>
);

const DashboardSetup = () => {
    // --- AUTH & GLOBAL STATE ---
    const userId = useSelector(selectUserId);
    const authStatus = useSelector(selectAuthStatus);
    const isLoadingWorkspace = useSelector(selectWorkspaceLoading);

    // --- LOCAL UI STATE ---
    const [ isSubmitting, setIsSubmitting ] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState('💼');
    const [ selectedImage, setSelectedImage ] = useState<File | null>(null);
    const [ imagePreviewUrl, setImagePreviewUrl ] = useState<string | null>(null);
    const [ selectedTrack, setSelectedTrack ] = useState<StartingPoint>("academic");
    const [workspaceTitle, setWorkspaceTitle ] = useState('')
    const [ isPublic, setIsPublic ] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { createWorkspace } = useWorkspace();
    const { toast } = useToast()
    const router = useRouter()
    const { user } = useUser();

    // --- EVENT HANDLERS ---

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file){
            setSelectedImage(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    }

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/sign-in"});
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
        } catch (error: any) {
           console.error("Unexpected error during workspace creation:", error);
            toast({
                title: "Unexpected Error",
                description: error?.message || "An unexpected error occurred. Please try again.",
                variant: "destructive"
            });
        } finally{
            setIsSubmitting(false)
        }
    }

    return(
        <div className="min-h-screen w-full bg-[#0A0507] font-mono text-neutral-100
        flex flex-col p-4 sm:p-6 lg:p-10 selection:bg-purple-500/30 selection:text-white
        bg-surface text-on-surface font-inter overflow-hidden relative">

            {/* Main Border Wrapper Box Container */}
            <div className="w-full max-w-[1500px] mx-auto flex-1 border-b border-white/10
            rounded-[24px] bg-[#0A0507] flex flex-col relative shadow-2xl overflow-hidden">
                {/* Nav header line */}
                <header className="w-full px-6 py-5 flex items-center justify-between border-b
                border-white/10 relative z-20 bg-[#110A10]/90 backdrop-blur-md">
                    <div className="flex items-center gap-x-2">
                        <span className="text-white text-base font-bold tracking-tight">
                            Studysprout
                        </span>
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5
                        rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30 
                        tracking-widest ">
                            SETUP MODE
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-x-4">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-x-2 text-xs font-mono font-bold 
                            text-neutral-400 hover:text-rose-400 border border-white/10
                             hover:border-rose-500/40 px-3 py-1.5 rounded-xl transition-all 
                             cursor-pointer bg-[#0A0507] shrink-0"
                        >   
                            <LogOut size={12}/>
                            <span>EXIT SESSION</span>
                        </button>
                        <SettingsPage>
                            <TooltipComponent message="Account Setting">
                                <button 
                                    type="button"
                                    className="flex items-center gap-x-3 cursor-pointer 
                                    group/profile text-left outline-none bg-[#110A10]
                                    hover:bg-white/5 border border-white/10 pl-3 pr-1.5 py-1
                                    rounded-xl transition-all duration-300 shadow-md"
                                >
                                    {/* User Identify String Indicator */}
                                    <span className="text-xs font-mono font-bold 
                                    text-neutral-400 tracking-tight
                                    select-none truncate max-w-[120px]">
                                        {user?.username || 'USER NAME'}
                                    </span>

                                    {/* User Avatar Frame */}
                                    <div className="w-7 h-7 rounded-lg bg-[#0A0507] border 
                                    border-white/10 flex items-center justify-center 
                                    overflow-hidden shrink-0">
                                        <Avatar className="w-7 h-7 rounded-lg">
                                            {(user?.avatarType === "image" && user.avatarUrl) ? (
                                                <AvatarImage 
                                                    src={user.avatarUrl}
                                                    alt="Profile Avatar"
                                                    className="object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) 
                                            : null}
                                            <AvatarFallback className="w-full h-full rounded-lg
                                            bg-purple-900 text-purple-300 text-xs font-mono 
                                            font-bold flex items-center justify-center">
                                                {user?.avatarInitials ?? 
                                                    user?.username?.[0]?.toUpperCase()
                                                }
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </button>
                            </TooltipComponent>
                        </SettingsPage>
                    </div>
                </header>

                {/* Main Interaction Panel Area */}
                <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 relative z-10">

                    {/* LEFT COLUMN PANEL */}
                    <div className="lg:col-span-7 p-6 sm:p-12 lg:p-16 flex flex-col justify-center
                    space-y-10">
                        
                        {/* Interactive Platform Introduction Header */}
                        <div className="space-y-4 max-w-xl">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight 
                            text-white leading-tight">
                                Welcome to the future of research.
                            </h2>
                            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed
                            font-mono">
                                Workspaces are intelligent containers that organize your thoughts,
                                documents, and discoveries into a unified knowledge graph.
                            </p>
                        </div>

                        {/* App Features Metric Matrix Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                            <FeatureCard 
                                icon={<FileText size={20} strokeWidth={1.75}/>}
                                title="Organize"
                                description="Keep papers, notes, and sources in one place."
                                animationClass="animate-ambient-float"
                                colorClass="text-purple-400"
                            />
                            <FeatureCard 
                                icon={<HelpCircle size={20} strokeWidth={1.75}/>}
                                title="Recall"
                                description="Auto-generate smart flashcards from your reading."
                                animationClass="animate-ambient-pulse [animation-delay:1s]"
                                colorClass="text-amber-400"
                            />
                            <FeatureCard 
                                icon={<GitFork size={20} strokeWidth={1.75}/>}
                                title="Connect"
                                description="Map concepts to visualize relationships."
                                animationClass="animate-ambient-connect [animation-delay:2.2s]"
                                colorClass="text-emerald-400"
                            />
                        </div>

                        {/* Strategic Selection Tracks Grid */}
                        <div className="space-y-3 max-w-2xl">
                            <span className="text-[10px] font-mono font-bold text-neutral-500
                            tracking-widest uppercase block">
                                CHOOSE A STARTING POINT
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                                {/* Track 1: Academic */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedTrack("academic")}
                                    className={`p-4 rounded-2xl border flex flex-col items-center
                                        justify-center text-center gap-y-2.5 transition-all
                                        cursor-pointer select-none duration-300 font-mono
                                        ${selectedTrack === "academic"
                                            ? "border-purple-500/60 bg-purple-950/40 shadow-md"
                                            : "border-white/10 bg-[#110A10] hover:border-white/5"
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center
                                        justify-center transition-all duration-300 
                                        ${selectedTrack === "academic"
                                            ? "bg-purple-900/40 border-purple-500/40 text-purple-300"
                                            : "bg-[#0A0507] border border-white/10 text-neutral-400"
                                        }`}>
                                            <GraduationCap size={18} strokeWidth={2}/>
                                    </div>
                                    <span className="text-neutral-200 text-xs font-bold tracking-tight">
                                        Academic Research
                                    </span>
                                </button>

                                {/* Track 2: Professional */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedTrack("professional")}
                                    className={`p-4 rounded-2xl border flex flex-col items-center
                                        justify-center text-center gap-y-2.5 transition-all
                                        cursor-pointer select-none duration-300 font-mono
                                        ${selectedTrack === "professional"
                                            ? "border-amber-500/60 bg-amber-900/30 shadow-md"
                                            : "border-white/10 bg-[#110A10] hover:border-white/5"
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center
                                        justify-center transition-all duration-300
                                        ${selectedTrack === "professional"
                                            ? "bg-amber-900/40 border-amber-500/40 text-amber-300"
                                            : "bg-[#0A0507] border border-white/10 text-neutral-400"
                                        }`}>
                                            <TrendingUp size={18} strokeWidth={2}/>
                                    </div>
                                    <span className="text-neutral-200 text-xs font-bold tracking-tight">
                                        Professional
                                    </span>
                                </button>

                                {/* Track 3: Personal */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedTrack("personal")}
                                    className={`p-4 rounded-2xl border flex flex-col items-center
                                    justify-center text-center gap-y-2.5 transition-all cursor-pointer
                                    select-none duration-300 font-mono ${selectedTrack === "personal"
                                        ? "border-emerald-500/60 bg-emerald-950/30 shadow-md"
                                        : "border-white/10 bg-[#110A10] hover:border-white/5"
                                    }`}
                                >
                                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center
                                    transition-all duration-300 ${selectedTrack === "personal"
                                        ? "bg-emerald-900/40 border-emerald-500/40 text-emerald-300"
                                        : "bg-[#0A0507] border border-white/10 text-neutral-400"
                                    }`}>
                                        <User size={18} strokeWidth={2}/>
                                    </div>
                                    <span className="text-neutral-200 text-xs font-bold tracking-tight">
                                        Personal
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column Panel: Workspace creation form */}
                    <div className="lg:col-span-5 p-6 sm:p-12 lg:p-12 border-t bg-[#0A0507]
                    lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-center">
                        <div className="max-w-max w-full mx-auto bg-[#110A10] border
                         border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
                            <div>
                                <h3 className="text-white text-lg font-bold tracking-tight">
                                    Create Workspace
                                </h3>
                                <p className="text-neutral-500 text-xs mt-1 font-mono">
                                    Initialize your research environment variables.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="workspaceName"
                                        className="text-[10px] font-mono font-bold tracking-wider
                                        text-neutral-400 uppercase block px-0.5"
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
                                        className="w-full bg-[#0A0507] border border-white/10
                                        rounded-xl px-4 py-3 text-xs text-white outline-none
                                        focus:border-purple-500/50 placeholder:text-neutral-600
                                        font-mono transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono font-bold tracking-wider
                                    text-neutral-400 uppercase block px-0.5">
                                        Workspace Brand
                                    </label>
                                    <div className="flex items-center gap-x-3 w-full bg-[#0A0507]
                                    border border-white/10 rounded-xl p-2.5">
                                        {/* Dynamic Thumnail Preview Avatar Block */}
                                        <div className="w-10 h-10 rounded-lg bg-[#110A10] border
                                        border-white/10 flex items-center justify-center shrink-0
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
                                                    <div className="cursor-pointer hover:scale-105
                                                    transition-transform">
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
                                                    className="bg-[#110A10] hover:bg-white/5
                                                    border border-white/10 text-[10px] font-mono
                                                    font-bold tracking-tight px-3 py-1.5 rounded-lg
                                                    text-neutral-300 transition-colors cursor-pointer
                                                    shrink-0"
                                                >
                                                    CHOOSE LOGO
                                                </button>
                                                <span className="text-[10px] font-mono
                                                 text-neutral-500
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

                                <div className="bg-[#0A0507] border border-white/10 rounded-2xl
                                p-3.5 flex items-center justify-between gap-x-4">
                                    <div className="flex items-start gap-x-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-[#110A10] border
                                        border-white/10 flex items-center justify-center shrink-0
                                        text-neutral-400 mt-0.5">
                                            <Lock size={14}/>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-white text-xs font-bold tracking-tight">
                                               {isPublic ? "Public" : " Private"} Workspace
                                            </span>
                                            <span className="text-[10px] font-mono text-neutral-500
                                            mt-0.5 truncate">
                                                {isPublic 
                                                    ? "Open collaboration network" 
                                                    : "Encrypted access only"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <WorkspaceVisibilityToggle 
                                            value={isPublic}
                                            onChange={setIsPublic}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoadingWorkspace || isSubmitting}
                                    className="w-full bg-purple-600 hover:bg-purple-500 
                                    text-white uppercase tracking-wider
                                    disabled:opacity-70 disabled:cursor-not-allowed font-bold text-xs py-3.5 px-4
                                    rounded-xl flex items-center justify-center gap-x-2
                                    transition-all cursor-pointer shadow-md
                                    active:scale-[0.99]"
                                >
                                    {isSubmitting || isLoadingWorkspace ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-purple-200"/>
                                    ) : (
                                        <>
                                            <Rocket size={14} strokeWidth={2.5}/>
                                            <span>Create Workspace</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Code Sandbox Terminal System Log Footer details */}
                            <div className="flex items-center justify-between border-t
                             border-white/10
                            pt-4 text-[9px] font-mono text-neutral-500 uppercase tracking-widest 
                            select-none">
                                <div className="flex items-center gap-x-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 
                                    animate-pulse"/>
                                    <span>READY FOR DEPLOYMENT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Micro Ambient Frame Details Footer line indicator */}
                <footer className="w-full px-8 py-3 border-t border-white/10 flex justify-end
                items-center relative z-20 pointer-events-none select-none bg-[#110A10]/50">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                        Initial System Load
                    </span>
                </footer>
            </div>
            
        </div>
    )
}

export default DashboardSetup
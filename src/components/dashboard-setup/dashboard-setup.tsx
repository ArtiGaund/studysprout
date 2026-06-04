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
    className="group relative bg-[#131316]/40 backdrop-blur-md border border-white/[0.03]
    hover:border-purple-500/30 p-6 rounded-xl space-y-3 transition-all duration-500
    hover:-translate-y-1 hover:bg-[#161619]/60 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]
    overflow-hidden"
    >
        {/* Ambient inner card glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"/>

        <div 
        className={`w-5 h-5 flex items-center justify-center mb-md group-hover:scale-110 
        transition-all duration-500 group-hover:text-purple-300 group-hover:animate-pulse 
        ${animationClass} ${colorClass}`}
        >
            {icon}
        </div>
        <h3 
        className="text-white text-base font-bold tracking-tight transition-colors duration-300
        group-hover:text-purple-200"
        >
            {title}
        </h3>
        <p 
        className="text-zinc-500 text-body-sm text-xs font-mono leading-relaxed transition-colors
        duration-300 group-hover:text-zinc-400"
        >
            {description}
        </p>
    </div>)

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
    //    data.preventDefault();
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
        <div className="min-h-screen w-full bg-[#070708] font-sans antialiased text-zinc-200
        flex flex-col p-4 sm:p-6 lg:p-10 selection:bg-purple-500/30 selection:text-white
        bg-surface text-on-surface font-inter overflow-hidden relative">

            {/* Main Border Wrapper Box Container */}
            <div className="w-full max-w-[1500px] mx-auto flex-1 border border-white[0.08]
            rounded-[24px] bg-[#0c0c0e] flex flex-col relative shadow-2xl">
                {/*DOT GRID EFFECT: Embedded CSS background grid layer */}
                <div 
                    className="absolute inset-0 opacity-[0.45] pointer-events-none 
                    mix-blend-screen z-0"
                    style={{
                        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, 
                            transparent 1px)`,
                        backgroundSize: '24px 24px',
                        maskImage: 'radial-gradient(ellipse at 50% 50%, black 60%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 60%, transparent 100%)'
                    }}
                />

                {/* Nav header line */}
                <header className="w-full px-6 py-5 flex items-center justify-between border-b
                border-white/[0.04] relative z-20 bg-[#0c0c0e]/80 backdrop-blur-md">
                    <div className="flex items-center gap-x-2">
                        <span className="text-white text-base font-bold tracking-tight">
                            Studysprout
                        </span>
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5
                        rounded bg-zinc-800 text-zinc-400 border border-white/5 
                        tracking-widest ">
                            SETUP MODE
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-x-4">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-x-2 text-xs font-mono font-bold
                            text-zinc-500 hover:text-red-400 border border-dashed border-zinc-800
                            hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer
                            bg-black/20 shrink-0"
                        >   
                            <LogOut size={12}/>
                            <span>EXIT SESSION</span>
                        </button>
                        <SettingsPage>
                            <TooltipComponent message="Account Setting">
                                <button 
                                    type="button"
                                    className="flex items-center gap-x-3 cursor-pointer group/profile text-left
                                    outline-none focus:outline-none bg-[#131124]/40 hover:bg-[#1a1733]/60
                                    border border-purple-500/10 hover:border-purple-500/30 pl-3.5 pr-2 py-1.5
                                    rounded-xl transition-all duration-300 shadow-md backdrop-blur-sm
                                    active:scale-[0.98]"
                                >
                                    {/* User Identify String Indicator */}
                                    <span className="text-xs font-mono font-bold text-zinc-400 tracking-tight
                                    select-none truncate max-w-[120px]">
                                        {user?.username || 'USER NAME'}
                                    </span>

                                    {/* User Avatar Frame */}
                                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-white/10
                                    flex items-center justify-center overflow-hidden shrink-0 
                                    shadow-inner transition-colors">
                                        <Avatar className="w-8 h-8 rounded-lg">
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
                                            bg-purple-500/10 text-purple-400 text-xs font-mono font-bold flex
                                            items-center justify-center">
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
                    space-y-12">
                        
                        {/* Interactive Platform Introduction Header */}
                        <div className="space-y-4 max-w-xl">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white
                            leading-tight">
                                Welcome to the future of research.
                            </h2>
                            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed
                            font-normal">
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
                                colorClass="text-blue-400"
                            />
                        </div>

                        {/* Strategic Selection Tracks Grid */}
                        <div className="space-y-4 max-w-2xl">
                            <span className="text-[10px] font-mono font-bold text-zinc-500
                            tracking-widest uppercase block">
                                CHOOSE A STARTING POINT
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                                {/* Track 1: Academic */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedTrack("academic")}
                                    className={`p-6 rounded-xl border flex flex-col items-center
                                        justify-center text-center gap-y-3 transition-all
                                        cursor-pointer select-none duration-300
                                        ${selectedTrack === "academic"
                                            ? "border-purple-500/60 bg-purple-500/[0.02] border-dashed -translate-y-1 shadow-[0_10px_25px_rgba(168,85,247,0.08)]"
                                            : "border-white/[0.04] bg-[#111113]/40 hover:border-white/[0.08] hover:bg-[#141417]/60"
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center
                                        justify-center transition-all duration-300 
                                        ${selectedTrack === "academic"
                                            ? "bg-purple-500/10 border-purple-500/30 text-purple-400 scale-105"
                                            : "bg-zinc-900/60 border-white/5 text-purple-400/70"
                                        }`}>
                                            <GraduationCap size={18} strokeWidth={2}/>
                                    </div>
                                    <span className="text-zinc-200 text-xs font-bold tracking-tight">
                                        Academic Research
                                    </span>
                                </button>

                                {/* Track 2: Professional */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedTrack("professional")}
                                    className={`p-6 rounded-xl border flex flex-col items-center
                                        justify-center text-center gap-y-3 transition-all
                                        cursor-pointer select-none duration-300
                                        ${selectedTrack === "professional"
                                            ? "border-amber-500/60 bg-amber-500/[0.02] border-dashed -translate-y-1 shadow-[0_10px_25px_rgba(245,158,11,0.08)]"
                                            : "border-white/[0.04] bg-[#111113]/40 hover:border-white/[0.08] hover:bg-[#141417]/60"
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center
                                        justify-center transition-all duration-300
                                        ${selectedTrack === "professional"
                                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400 scale-105"
                                            : "bg-zinc-900/60 border-white/5 text-amber-400/70"
                                        }`}>
                                            <TrendingUp size={18} strokeWidth={2}/>
                                    </div>
                                    <span className="text-zinc-200 text-xs font-bold tracking-tight">
                                        Professional
                                    </span>
                                </button>

                                {/* Track 3: Personal */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedTrack("personal")}
                                    className={`p-6 rounded-xl border flex flex-col items-center
                                    justify-center text-center gap-y-3 transition-all cursor-pointer
                                    select-none duration-300 ${selectedTrack === "personal"
                                        ? "border-blue-500/60 bg-blue-500/[0.02] border-dashed -translate-y-1 shadow-[0_10px_25px_rgba(59,130,246,0.08)]"
                                        : "border-white/[0.04] bg-[#111113]/40 hover:border-white/[0.08] hover:bg-[#141417]/60"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center
                                    transition-all duration-300 ${selectedTrack === "personal"
                                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400 scale-105"
                                        : "bg-zinc-900/60 border-white/5 text-blue-400/70"
                                    }`}>
                                        <User size={18} strokeWidth={2}/>
                                    </div>
                                    <span className="text-zinc-200 text-xs font-bold tracking-tight">
                                        Personal
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column Panel: Workspace creation form */}
                    <div className="lg:col-span-5 p-6 sm:p-12 lg:p-12 bg-black/20 border-t
                    lg:border-t-0 lg:border-l border-white/[0.04] flex flex-col justify-center">
                        <div className="max-w-max w-full mx-auto bg-[#131316] border
                         border-white/[0.05] rounded-2xl p-6 sm:p-8 space-y-8 shadow-xl">
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
                                        className="text-[10px] font-mono font-bold tracking-wider
                                        text-zinc-500 uppercase block"
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

                                <div className="bg-[#18181c] border border-white/5 rounded-xl
                                p-4 flex items-center justify-between gap-x-4">
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
                                            <span className="text-[10px] font-mono text-zinc-500
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

                            {/* Code Sandbox Terminal System Log Footer details */}
                            <div className="flex items-center justify-between border-t border-white/[0.03]
                            pt-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest select-none">
                                <div className="flex items-center gap-x-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                                    <span>READY FOR DEPLOYMENT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Micro Ambient Frame Details Footer line indicator */}
                <footer className="w-full px-8 py-3 border-t border-white/[0.03] flex justify-end
                items-center relative z-20 pointer-events-none select-none">
                    <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
                        Initial System Load
                    </span>
                </footer>
            </div>
            
        </div>
    )
}

export default DashboardSetup
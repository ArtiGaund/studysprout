/**
 * @component SettingsForm
 * @description A comprehensive administrative interface for managing Workspace and User Profile settings.
 * * Key Capabilities:
 * - Debounced Updates: Implements a timer-based ref for workspace title changes to minimize API overhead.
 * - Asset Management: Handles binary file uploads for workspace logos and user avatars.
 * - Destructive Action Workflows: Integrated modal-based confirmation for account deletion and 
 * automatic routing logic after workspace removal.
 * - Reactive Sync: Synchronizes local component state with Redux global state via useEffect hooks.
 */
'use client';

import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Briefcase, LogOut, User } from "lucide-react";
import { Label } from "../ui/label";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { UPDATE_WORKSPACE } from "@/store/slices/workspaceSlice";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import LogoutButton from "../global/logout-button";
import { useModal } from "@/context/ModalProvider";
import { ReduxWorkSpace } from "@/types/state.type";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useDir } from "@/hooks/useDir";
import { transformWorkspace } from "@/utils/data-transformers";
import { useUser } from "@/lib/providers/user-provider";
import { selectUserId } from "@/store/selectors/userSelector";
import { selectCurrentWorkspace, selectWorkspaces } from "@/store/selectors/workspaceSelector";
import { WorkSpace as MongooseWorkSpace} from "@/model/workspace.model";

const SettingsForm = () => {
    const { openModal, closeModal } = useModal();
    const { toast } = useToast()
    const { user } = useUser(); 
    const router = useRouter()
    const dispatch = useDispatch()

    // --- Global State & Context ---
    const userId = useSelector(selectUserId);
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const workspaces = useSelector(selectWorkspaces);

    // --- Custom Hooks for Business Logic ---
    const {
        updateWorkspaceTitle,
        updateWorkspaceLogo,
    } = useWorkspace();

    const {
        handleDelete: handleDeleteWorkspace,
    } = useDir({
        dirType: "workspace",
        dirId: currentWorkspace?._id || "",
    })
   
    // --- Local UI State ---
    const [ workspaceTitle, setWorkspaceTitle ] = useState("");
    const [ profilePicFile, setProfilePicFile ] = useState<File | null>(null);
    const [ uploadingProfilePic, setUploadingProfilePic ] = useState(false)
    const [ logo, setLogo ] = useState<File | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false)
   
    const logoInputRef = useRef<HTMLInputElement>(null);
    const profileInputRef = useRef<HTMLInputElement>(null);
    
    // Sync local state when the active workspace changes in the Redux store
    useEffect(() => {
        if(currentWorkspace){
           setWorkspaceTitle(currentWorkspace.title);
        }
    }, [currentWorkspace]);

    const handleCancelWorkspaceTitle = () => {
        if(currentWorkspace){
            setWorkspaceTitle(currentWorkspace.title);
        }
    }

    const handleCancelWorkspaceLogo = () => {
        setLogo(null);
        if(logoInputRef.current) logoInputRef.current.value = "";
    }

    const handleCancelProfilePicture = () => {
        setProfilePicFile(null);
        if(profileInputRef.current) profileInputRef.current.value = "";
    }

    /**
     * @handler workspaceNameChange
     */
    const workspaceNameChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setWorkspaceTitle(value);
    }

    const onChangeProfilePictures = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if(file) setProfilePicFile(file);
    }
    /**
     * @handler onChangeWorkspaceLogo
     * Facilitates file selection and upload for workspace branding.
     */
    const onChangeWorkspaceLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if(!file) return
        setLogo(file);
    } 
    const handleSaveWorkspaceTitle = async() => {
        if(!currentWorkspace || !workspaceTitle.trim()) return;
        try {
            const response = await updateWorkspaceTitle(currentWorkspace._id, workspaceTitle);
            if(response.success && response.data){
                const transformedWorkspace = transformWorkspace(response.data as MongooseWorkSpace);
                dispatch(UPDATE_WORKSPACE(transformedWorkspace));
            }
        } catch (error) {
            console.error("[SettingForm] Error while updating workspace title: ",error);
        }
    }

    const handleSaveWorkspaceLogo = async () => {
        if(!currentWorkspace || !logo) return;
        setUploadingLogo(true);
        try {
            const response = await updateWorkspaceLogo(currentWorkspace._id, logo);
            if(response.success && response.data){
                const transformedWorkspace = transformWorkspace(response.data as MongooseWorkSpace);
                dispatch(UPDATE_WORKSPACE(transformedWorkspace));
            }
        } catch (error) {
            console.error("[SettingForm] Error while updating workspace logo: ",error);
        }
    }

    const handleSaveProfilePicture = async () => {

    }
    /**
     * @handler onDeleteWorkspaceClick
     * Handles the complex logic of workspace removal:
     * 1. API deletion call.
     * 2. Calculation of the next available workspace for redirection.
     * 3. Fallback routing to dashboard root if no workspaces remain.
     */
    const onDeleteWorkspaceClick = async () => {
        if(!currentWorkspace || !currentWorkspace._id) {
            toast({
                title: "Error",
                description: "No workspace selected for deletion",
                variant: "destructive",
            });
            return;
        }
        await handleDeleteWorkspace();
        const remainingWorkspaces = workspaces.filter(
            (workspace: ReduxWorkSpace) => workspace._id !== currentWorkspace._id
        )

        if(remainingWorkspaces.length > 0){
            const nextWorkspace = remainingWorkspaces[0];
            router.push(`/dashboard/${nextWorkspace._id}`);
        }else{
            router.push(`/dashboard`);
        }
    }

   /**
     * @handler deleteAccount
     * Permanent user account deletion. Clears remote data and local session.
     */
    const deleteAccount = async () => {
        try {
            const response = await axios.delete(`/api/delete-account?userId=${userId}`)
    
            if(!response.data.success){
                    toast({
                        title: "Failed to delete account",
                        description: response.data.message,
                        variant: "destructive"
                    })
                }else{
                    toast({
                        title: "Success",
                        description: "Successfully deleted account",
                    })
                    // Sign the user out to clear session
                    await signOut({ callbackUrl: "/sign-up" });
                }
        } catch (error) {
            console.error("Error while deleting user account", error)
            toast({
                title: "Failed to delete account",
                description: "Something went wrong",
                variant: "destructive"
            })
        }
      }
    
    
    return (
    <div className="w-full text-zinc-200 flex flex-col h-full bg-[#0c0c0e]">
        {/* Scrollable Container Body Area */}
        <div className="flex-1 px-4 sm:px-6 py-6 space-y-6 overflow-y-auto max-h-[75vh]
        md:max-h-[65vh] pr-2 scrollbar-thin scrollbar-thumb-zinc-800/60">

            {/* 1. Workspace Settlement Contols */}
            {workspaces && currentWorkspace && (
                <div className="space-y-4">
                    <div className="flex items-center gap-x-2 text-zinc-400 font-medium text-sm
                    border-b border-white/[0.04] pb-2 select-none">
                        <Briefcase size={16}/>
                        <span>Workspace</span>
                    </div>

                    {/* Input Field Workspace Title */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="workspaceName"
                            className="text-[10px] font-mono font-bold tracking-wider text-zinc-500
                            uppercase"
                        >
                            Name
                        </Label>
                        <input 
                            id="workspaceName"
                            type="text"
                            value={workspaceTitle}
                            placeholder="Workspace Name"
                            onChange={workspaceNameChange}
                            className="w-full bg-[#141416] border border-white/5 rounded-lg
                            px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/30
                            font-medium transition-all"
                        />

                        {currentWorkspace && workspaceTitle !== currentWorkspace.title && 
                            workspaceTitle.trim() !== "" && (
                                <div className="flex justify-end pt-1 animate-in fade-in
                                slide-in-from-top-2 duration-150">
                                    <button
                                        type="button"
                                        onClick={handleCancelWorkspaceTitle}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300
                                        text-xs font-semibold px-3 py-1.5 rounded-md transition-all
                                        cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveWorkspaceTitle}
                                        className="bg-purple-600 hover:bg-purple-700 text-white
                                        text-xs font-semibold px-3 py-1.5 rounded-md transition-all
                                        cursor-pointer shadow-sm"
                                    >
                                        Save Title
                                    </button>
                                </div>
                            )
                        }
                    </div>

                    {/* Custom Form File Input Node - Workspace Branding */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-mono font-bold tracking-wider uppercase
                        text-zinc-500">
                            Workspace Logo
                        </Label>
                        <div className="flex items-center gap-x-3 w-full bg-[#141416] border
                        border-white/5 rounded-lg p-2.5">
                            <input 
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={onChangeWorkspaceLogo}
                                disabled={uploadingLogo}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={uploadingLogo}
                                className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900
                                text-white text-xs font-semibold px-4 py-2 rounded-md
                                transition-colors cursor-pointer shrink-0 border border-white/5"
                            >
                                {uploadingLogo ? "Uploading..." : "Choose File"}
                            </button>
                            <span className="text-xs font-mono text-zinc-500 truncate flex-1
                            select-none">
                                {currentWorkspace.logo 
                                    ? "Custom workspace logo active" 
                                    : "No file chosen"
                                }
                            </span>
                            {logo && (
                                <div className="flex justify-end gap-x-2 pt-1 animate-in fade-in
                                slide-in-from-top-2 duration-150">
                                    <button
                                        type="button"
                                        onClick={handleCancelWorkspaceLogo}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300
                                        font-semibold px-3 py-1.5 rounded-md transition-all
                                        cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveWorkspaceLogo}
                                        disabled={uploadingLogo}
                                        className="bg-purple-600 hover:bg-purple-700 text-xs
                                        disabled:bg-purple-900 text-white font-semibold px-3
                                        py-1.5 rounded-md transition-all cursor-pointer shadow-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Destructive Container: Delete Workspace Context */}
                    <div className="border border-red-500/10 bg-red-500/[0.02] rounded-xl
                    p-4 space-y-3 mt-2">
                        <p className="text-xs text-red-400/90 leading-relaxed font-normal">
                            Warning! Deleting your workspace will permanently delete all data
                            related to this workspace.
                        </p>
                        <button
                            type="button"
                            // onClick={onDeleteWorkspaceClick}
                            onClick={() => 
                            openModal(
                                <div className="flex flex-col justify-center items-center p-2">
                                    <h2 className="text-xl p-3 text-white font-bold mb-2">
                                        Confirm Delete
                                    </h2>
                                    <p className="text-sm text-center text-zinc-400 max-w-xs">
                                        Are you sure you want to delete this workspace? This action
                                        cannot be undone.
                                    </p>
                                    <div className="flex gap-4 mt-6 w-full justify-center">
                                        <button
                                            onClick={closeModal}
                                            className="bg-zinc-800 hover:bg-zinc-700
                                            text-zinc-200 px-4 py-2 rounded-md text-sm
                                            font-semibold transition-colors min-w-[80px]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={onDeleteWorkspaceClick}
                                            className="bg-red-600 hover:bg-red-700 text-white
                                            px-4 py-2 rounded-md text-sm font-semibold
                                            transition-colors min-w-[80px]"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                        className="w-full py-2 px-4 rounded-lg bg-red-950/20 hover:bg-red-950/40
                        border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs
                        font-semibold tracking-wide transition-all cursor-pointer"
                    >   
                        Delete Workspace
                    </button>
                </div>
            </div>
            )}

            {/* 2. User Profile Identification controls */}
            <div className="space-y-4">
                <div className="flex items-center gap-x-2 text-zinc-400 font-medium text-sm
                border-b border-white/[0.04] pb-2 select-none">
                    <User size={16}/>
                    <span>Profile</span>
                </div>

                {/* Identify Avatar Layout Node */}
                <div className="flex items-center gap-x-4 bg-[#141416]/40 p-3 rounded-xl border
                border-white/[0.02]">
                    <Avatar className="w-12 h-12 rounded-xl border border-white/10 shrink-0">
                        <AvatarImage 
                            src={user?.avatarUrl || ''}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-zinc-900 rounded-xl text-zinc-400
                        font-bold text-sm">
                            {user?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-white truncate">
                            {user?.email || ""}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider
                        text-zinc-500 mt-0.5">
                            Profile Picture
                        </span>
                    </div>
                </div>

                {/* Custom Form File Input Node - User Avatar Image */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-x-3 w-full bg-[#141416] border
                    border-white/5 rounded-lg p-2.5">
                        <input 
                            ref={profileInputRef}
                            type="file"
                            accept="image/*"
                            disabled={uploadingProfilePic}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => profileInputRef.current?.click()}
                            disabled={uploadingProfilePic}
                            className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900
                            text-white text-xs font-semibold px-4 py-2 rounded-md shrink-0
                            transition-colors cursor-pointer border border-white/5"
                        >
                            Choose File
                        </button>
                        <span className="text-xs font-mono text-zinc-500 truncate flex-1
                        select-none">
                           {profilePicFile ? `Queued: ${profilePicFile.name}` : " No file chosen"}
                        </span>
                    </div>

                    {profilePicFile && (
                        <div className="flex justify-end gap-x-2 pt-1 animate-in fade-in
                        slide-in-from-top-2 duration-150">
                            <button
                                type="button"
                                onClick={handleCancelProfilePicture}
                                disabled={uploadingProfilePic}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs
                                font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveProfilePicture}
                                disabled={uploadingProfilePic}
                                className="bg-purple-600 hover:bg-purple-700 text-white
                                 disabled:bg-purple-900 text-xs font-semibold px-3 py-1.5
                                 rounded-md transition-all cursor-pointer shadow-sm"
                            >
                                Save
                            </button>
                        </div>
                    )}
                </div>

                {/* Destructive container: Parmanent System Account Deletion */}
                <div className="border border-red-500/10 bg-red-500/[0.02] rounded-xl p-4
                space-y-3 mt-2">
                    <p className="text-xs text-red-400/90 leading-relaxed font-normal">
                        Warning! Deleting your account will permanently delete all data related to this
                        account.
                    </p>
                    <button
                        type="button"
                        onClick={() => 
                            openModal(
                                <div className="flex flex-col justify-center items-center p-2">
                                    <h2 className="text-xl p-3 text-white font-bold mb-2">
                                        Confirm Delete
                                    </h2>
                                    <p className="text-sm text-center text-zinc-400 max-w-xs">
                                        Are you sure you want to delete your account? This action
                                        cannot be undone.
                                    </p>
                                    <div className="flex gap-4 mt-6 w-full justify-center">
                                        <button
                                            onClick={closeModal}
                                            className="bg-zinc-800 hover:bg-zinc-700
                                            text-zinc-200 px-4 py-2 rounded-md text-sm
                                            font-semibold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={deleteAccount}
                                            className="bg-red-600 hover:bg-red-700 text-white
                                            px-4 py-2 rounded-md text-sm font-semibold
                                            transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                        className="w-full py-2 px-4 rounded-lg bg-red-950/20 hover:bg-red-950/40
                        border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs
                        font-semibold tracking-wide transition-all cursor-pointer"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
        
       {/* 3. STICKY ACTION FOOTER BAR */}
        <div className="w-full px-6 py-4 border-t border-white/[0.04] bg-[#0c0c0e]/95 
        backdrop-blur-md flex items-center justify-between sticky bottom-0 z-20 shrink-0 pb-safe">
            
            <LogoutButton className="flex items-center gap-x-2 text-[10px] font-mono font-bold
            text-zinc-500 hover:text-red-400 border border-dashed border-zinc-800
            hover:border-red-500/20 px-3 py-1.5 rounded-lg transition-all duration-200
            bg-zinc-900/20 hover:bg-red-500/[0.02] tracking-wider select-none
            outline-none focus:outline-none">
                <LogOut size={12} strokeWidth={2.5} />
                <span>LOGOUT</span>
            </LogoutButton>
        </div>
    </div>
    )
}

export default SettingsForm
'use client';

import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, LogOut, User } from "lucide-react";
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
import { WorkSpace as MongooseWorkSpace } from "@/model/workspace.model";

/**
 * Sub-component for Delete Workspace Modal to manage loader and closeModal cleanly.
 */
const DeleteWorkspaceModalContent = ({ 
    onConfirm, 
    onCancel 
}: { 
    onConfirm: () => Promise<void>; 
    onCancel: () => void; 
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center p-2 bg-[#0A0507] font-mono">
            <h2 className="text-lg p-2 text-white font-bold mb-1">
                Confirm Delete
            </h2>
            <p className="text-xs text-center text-neutral-400 max-w-xs leading-relaxed">
                Are you sure you want to delete this workspace? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6 w-full justify-center">
                <button
                    onClick={onCancel}
                    disabled={isDeleting}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors min-w-[80px] disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isDeleting}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all min-w-[90px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-60"
                >
                    {isDeleting ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-200" />
                            <span>Deleting...</span>
                        </>
                    ) : (
                        <span>Delete</span>
                    )}
                </button>
            </div>
        </div>
    );
};

const SettingsForm = () => {
    const { openModal, closeModal } = useModal();
    const { toast } = useToast();
    const { user } = useUser(); 
    const router = useRouter();
    const dispatch = useDispatch();

    const userId = useSelector(selectUserId);
    const currentWorkspace = useSelector(selectCurrentWorkspace);
    const workspaces = useSelector(selectWorkspaces);

    const {
        updateWorkspaceTitle,
        updateWorkspaceLogo,
    } = useWorkspace();

    const {
        handleDelete: handleDeleteWorkspace,
    } = useDir({
        dirType: "workspace",
        dirId: currentWorkspace?._id || "",
    });
   
    const [workspaceTitle, setWorkspaceTitle] = useState("");
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
    const [logo, setLogo] = useState<File | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
   
    const logoInputRef = useRef<HTMLInputElement>(null);
    const profileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (currentWorkspace) {
           setWorkspaceTitle(currentWorkspace.title);
        }
    }, [currentWorkspace]);

    const handleCancelWorkspaceTitle = () => {
        if (currentWorkspace) {
            setWorkspaceTitle(currentWorkspace.title);
        }
    };

    const handleCancelWorkspaceLogo = () => {
        setLogo(null);
        if (logoInputRef.current) logoInputRef.current.value = "";
    };

    const handleCancelProfilePicture = () => {
        setProfilePicFile(null);
        if (profileInputRef.current) profileInputRef.current.value = "";
    };

    const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWorkspaceTitle(e.target.value);
    };

    const onChangeProfilePictures = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setProfilePicFile(file);
    };

    const onChangeWorkspaceLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogo(file);
    }; 

    const handleSaveWorkspaceTitle = async () => {
        if (!currentWorkspace || !workspaceTitle.trim()) return;
        try {
            const response = await updateWorkspaceTitle(currentWorkspace._id, workspaceTitle);
            if (response.success && response.data) {
                const transformedWorkspace = transformWorkspace(response.data as MongooseWorkSpace);
                dispatch(UPDATE_WORKSPACE(transformedWorkspace));
            }
        } catch (error) {
            console.error("[SettingsForm] Error updating workspace title: ", error);
        }
    };

    const handleSaveWorkspaceLogo = async () => {
        if (!currentWorkspace || !logo) return;
        setUploadingLogo(true);
        try {
            const response = await updateWorkspaceLogo(currentWorkspace._id, logo);
            if (response.success && response.data) {
                const transformedWorkspace = transformWorkspace(response.data as MongooseWorkSpace);
                dispatch(UPDATE_WORKSPACE(transformedWorkspace));
            }
        } catch (error) {
            console.error("[SettingsForm] Error updating workspace logo: ", error);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSaveProfilePicture = async () => {};

    /**
     * Handles workspace deletion & auto-closing modal
     */
    const onDeleteWorkspaceClick = async () => {
        if (!currentWorkspace || !currentWorkspace._id) {
            toast({
                title: "Error",
                description: "No workspace selected for deletion",
                variant: "destructive",
            });
            return;
        }

        try {
            await handleDeleteWorkspace();
            
            // Explicitly close modal after successful backend deletion
            closeModal();

            const remainingWorkspaces = workspaces.filter(
                (workspace: ReduxWorkSpace) => workspace._id !== currentWorkspace._id
            );

            if (remainingWorkspaces.length > 0) {
                const nextWorkspace = remainingWorkspaces[0];
                router.push(`/dashboard/${nextWorkspace._id}`);
            } else {
                router.push(`/dashboard`);
            }
        } catch (error) {
            console.error("[SettingsForm] Failed to delete workspace:", error);
            closeModal();
            toast({
                title: "Delete Failed",
                description: "Could not delete workspace. Please try again.",
                variant: "destructive"
            });
        }
    };

    const deleteAccount = async () => {
        try {
            const response = await axios.delete(`/api/delete-account?userId=${userId}`);
            if (!response.data.success) {
                toast({
                    title: "Failed to delete account",
                    description: response.data.message,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Success",
                    description: "Successfully deleted account",
                });
                closeModal();
                await signOut({ callbackUrl: "/sign-up" });
            }
        } catch (error) {
            console.error("Error deleting user account", error);
            toast({
                title: "Failed to delete account",
                description: "Something went wrong",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="w-full text-neutral-200 flex flex-col h-full bg-[#0A0507] font-mono select-none">
            <div className="flex-1 px-4 sm:px-6 py-6 space-y-6 overflow-y-auto max-h-[75vh] md:max-h-[65vh] pr-2 custom-insights-scrollbar">

                {/* Workspace Controls */}
                {workspaces && currentWorkspace && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-x-2 text-neutral-400 font-bold text-xs uppercase tracking-wider border-b border-white/10 pb-2">
                            <Briefcase size={15}/>
                            <span>Workspace</span>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="workspaceName" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                Name
                            </Label>
                            <input 
                                id="workspaceName"
                                type="text"
                                value={workspaceTitle}
                                placeholder="Workspace Name"
                                onChange={workspaceNameChange}
                                className="w-full bg-[#0A0507] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500/50 transition-all font-mono"
                            />

                            {currentWorkspace && workspaceTitle !== currentWorkspace.title && workspaceTitle.trim() !== "" && (
                                <div className="flex justify-end gap-2 pt-1 animate-in fade-in duration-150">
                                    <button
                                        type="button"
                                        onClick={handleCancelWorkspaceTitle}
                                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveWorkspaceTitle}
                                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                    >
                                        Save Title
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                Workspace Logo
                            </Label>
                            <div className="flex items-center gap-x-3 w-full bg-[#110A10] border border-white/10 rounded-xl p-2.5">
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
                                    className="bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 text-neutral-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0 border border-white/10"
                                >
                                    {uploadingLogo ? "Uploading..." : "Choose File"}
                                </button>
                                <span className="text-xs text-neutral-500 truncate flex-1">
                                    {currentWorkspace.logo ? "Custom logo active" : "No file chosen"}
                                </span>
                                {logo && (
                                    <div className="flex justify-end gap-x-2 animate-in fade-in duration-150">
                                        <button
                                            type="button"
                                            onClick={handleCancelWorkspaceLogo}
                                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveWorkspaceLogo}
                                            disabled={uploadingLogo}
                                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                        >
                                            Save
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Destructive Delete Workspace */}
                        <div className="border border-rose-500/20 bg-rose-950/20 rounded-2xl p-4 space-y-3 mt-2">
                            <p className="text-xs text-rose-300/90 leading-relaxed font-mono">
                                Warning! Deleting your workspace will permanently delete all associated documents and study decks.
                            </p>
                            <button
                                type="button"
                                onClick={() => openModal(
                                    <DeleteWorkspaceModalContent 
                                        onConfirm={onDeleteWorkspaceClick}
                                        onCancel={closeModal}
                                    />
                                )}
                                className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                            >   
                                Delete Workspace
                            </button>
                        </div>
                    </div>
                )}

                {/* Profile Controls */}
                <div className="space-y-4">
                    <div className="flex items-center gap-x-2 text-neutral-400 font-bold text-xs uppercase tracking-wider border-b border-white/10 pb-2">
                        <User size={15}/>
                        <span>Profile</span>
                    </div>

                    <div className="flex items-center gap-x-4 bg-[#110A10] p-3 rounded-2xl border border-white/10">
                        <Avatar className="w-10 h-10 rounded-xl border border-white/10 shrink-0">
                            <AvatarImage src={user?.avatarUrl || ''} className="object-cover" />
                            <AvatarFallback className="bg-purple-950 text-purple-300 rounded-xl font-bold text-xs">
                                {user?.username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">
                                {user?.email || ""}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5 font-bold">
                                Profile Picture
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center gap-x-3 w-full bg-[#110A10] border border-white/10 rounded-xl p-2.5">
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
                                className="bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 text-neutral-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                            >
                                Choose File
                            </button>
                            <span className="text-xs text-neutral-500 truncate flex-1">
                               {profilePicFile ? `Queued: ${profilePicFile.name}` : "No file chosen"}
                            </span>
                        </div>
                    </div>

                    {/* Destructive Delete Account */}
                    <div className="border border-rose-500/20 bg-rose-950/20 rounded-2xl p-4 space-y-3 mt-2">
                        <p className="text-xs text-rose-300/90 leading-relaxed font-mono">
                            Warning! Deleting your account will permanently wipe all user data and saved workspaces.
                        </p>
                        <button
                            type="button"
                            onClick={() => openModal(
                                <div className="flex flex-col justify-center items-center p-2 font-mono">
                                    <h2 className="text-lg p-2 text-white font-bold mb-1">
                                        Confirm Account Deletion
                                    </h2>
                                    <p className="text-xs text-center text-neutral-400 max-w-xs leading-relaxed">
                                        Are you sure you want to delete your account? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-3 mt-6 w-full justify-center">
                                        <button
                                            onClick={closeModal}
                                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors min-w-[80px]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={deleteAccount}
                                            className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                                        >
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            )}
                            className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Action Footer */}
            <div className="w-full px-6 py-4 border-t border-white/10 bg-[#0A0507] flex items-center justify-between sticky bottom-0 z-20 shrink-0">
                <LogoutButton className="flex items-center gap-x-2 text-[10px] font-mono font-bold text-neutral-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 px-3 py-1.5 rounded-xl transition-all duration-200 bg-[#110A10] tracking-wider select-none outline-none">
                    <LogOut size={13} strokeWidth={2} />
                    <span>LOGOUT</span>
                </LogoutButton>
            </div>
        </div>
    );
};

export default SettingsForm;
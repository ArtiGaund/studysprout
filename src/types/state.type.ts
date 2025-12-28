// Core Redux Model Interfaces (frontend Representation)

import { IBlock } from "@/model/file.model";

// File document
export interface ReduxFile{
    _id: string;
    
    // core metadata
    title: string;
    iconId?: string;
    createdAt: string;
    lastUpdated: string;
    workspaceId?: string;
    folderId?: string;
    bannerUrl?: string;
    inTrash?: string;

    // Block based content
    blocks: Record<string, IBlock>;
    blockOrder: string[];

    // versioning and sync
    version: number;
    contentHash?: string;
    localChangeId?: string;
    lastLocalChangeId?: number;
    lastSyncedAt?: string;
    updatedAtLocal?: string;
    conflictState?: "none" | "conflict" | "resolved";
    isLocked?: boolean;
    deletedAt?: string | null;

    //history (if needed)
    history?: Array<{
        version: number;
        blocks: any;
        updatedAt: string;
    }>;
}

// Folder document
export interface ReduxFolder{
    _id: string;
    createdAt: string;
    title: string;
    iconId?: string;
    data?: string;
    inTrash?: string;
    bannerUrl?: string;
    workspaceId?: string;
    files?: string[] //Array of file _ids for normalization
}
//  WorkSpace document
export interface ReduxWorkSpace {
    _id: string;
    workspace_owner: string; 
    title: string;
    iconId?: string;
    data?: string; 
    inTrash?: string; 
    logo?: string; 
    bannerUrl?: string;
    folders: string[]; 
    createdAt?: string; 
    updatedAt?: string;
}
// Image document
export interface ReduxImage{
   _id: string;
    image_url: string;
    public_id: string;
    createdAt?: string; 
    updatedAt?: string;
}

// PasswordResetToken document
export interface ReduxPasswordResetToken {
    _id: string;
    userId: string; // Reference to User by its ID (string)
    tokenHash: string;
    expiresAt: string; // ISO string date
}

// UnverifiedUser document
export interface ReduxUnverifiedUser {
    _id: string;
    username: string;
    email: string;
    verifyCode: string; 
    verifyCodeExpiry: string; 
}
// User document
export interface ReduxUser {
    _id: string;
    username: string;
    email: string;
    isVerified: boolean;
    workspace: string[]; // Array of WorkSpace _ids for normalization
    createdAt?: string; 
    updatedAt?: string; 
}

// --- Redux Slice States (How data is structured within each slice) ---

export interface FilesState {
    byId: { [id: string]: ReduxFile };
    allIds: string[]; 
    loading: boolean;
    error: string | null;
    currentFile: string | null;
}

export interface FoldersState {
    byId: { [id: string]: ReduxFolder }; 
    allIds: string[];
    loading: boolean;
    error: string | null;
    currentFolder: string | null;
}

export interface ImagesState {
    byId: { [id: string]: ReduxImage }; 
    loading: boolean;
    error: string | null;
}

export interface PasswordResetTokenState {
    resetInProgress: boolean;
    resetSuccess: boolean;
    error: string | null;
}

export interface UnverifiedUserState {
    registrationInProgress: boolean;
    registrationSuccess: boolean;
    verificationSuccess: boolean;
    error: string | null;
}

export interface UsersState {
    byId: { [id: string]: ReduxUser }; 
    currentUser: string | null;
    loading: boolean;
    error: string | null;
}

export interface WorkspacesState {
    byId: { [id: string]: ReduxWorkSpace }; 
    allIds: string[];
    currentWorkspace: string | null; 
    loading: boolean;
    error: string | null;
}

// --- Root Redux State (Combines all slices) ---

export interface RootState {
    files: FilesState;
    folders: FoldersState;
    images: ImagesState;
    passwordReset: PasswordResetTokenState;
    unverifiedUser: UnverifiedUserState;
    users: UsersState;
    workspaces: WorkspacesState;
    
}

export interface ReduxFlashcard{
    _id: string;
    question: string;
    answer: string;
    type: "mcq" | "question-answer" | "fill-in-the-blank";
    options?: string[];

    // SRS
    dueDate: string;
    interval: number;
    difficulty: number;
    repetition: number;
    lastReviewed: string | null;    

    // source
    source?: {
        fileIds: string[];
        blockIds: string[];
        blocksState: Record<string, { updatedAt: string }>;
    };
    isOutDated?: boolean;
}

export interface FlashcardState{
   cardsBySet: Record<string,ReduxFlashcard[]>;
   activeSetId: string | null;
}

export interface ReduxFlashcardSet{
    _id: string;
    title: string;
    icon?: string;

    cards: ReduxFlashcard[];
    totalCards: number;
    dueCount: number;

    // grouping context
    workspaceId: string;
    folderId?: string;
    resourceId: string;

    resourceType: "Workspace" | "Folder" | "File";
    cardCount: number;
    desiredTypes: ("question-answer" | "fill-in-the-blank" | "mcq")[];
    sourceSnapshot?: {
        fileIds: string[];
        blockCount: number;
        totalChars: number;
    };
    isOutdated?: boolean;
    updatedAt: string;
}

export interface FlashcardSetState{
    sets: ReduxFlashcardSet[];
    loading: boolean;
}
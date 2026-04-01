/**
 * @module ReduxStateModels
 * @description Centralized Type Definitions for the StudySprout Redux Store.
 * * ARCHITECTURAL PRINCIPLES:
 * 1. Data Normalization: Implements the 'Dictionary' pattern (`byId` / `allIds`) 
 * to ensure O(1) lookup speeds and prevent redundant re-renders.
 * 2. SRS Integration: Defines `ReduxFlashcard` with Spaced Repetition metadata 
 * (interval, difficulty, repetition) to support adaptive learning.
 * 3. Atomic Block Architecture: `ReduxFile` treats content as a collection of 
 * independent `blocks`, enabling Notion-style granular editing.
 * 4. Multi-Tenant Scoping: States like `filesByFolder` and `foldersByWorkspace` 
 * segment data by parent ID to ensure strict data isolation and performance.
 */

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
    inTrash?: string | null;

    contentBinary?:any;
    contentLastModified: string;

    // Block based content
    blocks: Record<string, IBlock>;
    blockOrder: string[];
    deletedAt?: string | null;
}

// Folder document
export interface ReduxFolder{
    _id: string;
    createdAt: string;
    title: string;
    iconId?: string;
    data?: string;
    inTrash?: string | null;
    bannerUrl?: string;
    workspaceId?: string;
    files?: string[] //Array of file _ids for normalization
}
export type WorkspaceRole = "editor" | "viewer";

export interface WorkspaceMemberState {
    userId: string;
    role: WorkspaceRole;
}
//  WorkSpace document
export interface ReduxWorkSpace {
    _id: string;
    workspace_owner: string; 
    title: string;
    iconId?: string;
    data?: string; 
    inTrash?: string | null; 
    logo?: string; 
    bannerUrl?: string;
    folders: string[]; 
    createdAt?: string; 
    updatedAt?: string;
    members?: WorkspaceMemberState[];
    isPublic: boolean;
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

    avatarType: "image" | "initial";
    avatarUrl?: string;
    avatarInitials: string; 
    
    createdAt?: string; 
    updatedAt?: string; 
}

// --- Redux Slice States (How data is structured within each slice) ---

export interface FilesState {
    filesByFolder: Record<
    string,
    {
        byId: Record<string, ReduxFile>;
        allIds: string[];
        loading?:boolean;
    }
    >;
    loading: boolean;
    error: string | null;
    currentFile: ReduxFile | null;
}

export interface FoldersState {
   foldersByWorkspace: Record<
       string,
       {
           byId: Record<string, ReduxFolder>;
           allIds: string[];
           loading?: boolean;
       }
       >;
       currentFolder: ReduxFolder | null;
       loading: boolean;
       error: string | null;
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
    currentWorkspace: ReduxWorkSpace | null; 
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
    
    user: ReduxUserState;
}

export interface ReduxFlashcard{
    _id: string;
    question: string;
    answer: string;
    type: "mcq" | "question-answer" | "fill-in-the-blank";
    options?: string[];

    // UI MetaData
    isOutDated?: boolean;

    // USER-SPECIFIC SRS (Mapped from FlashcardProgress in DB)
    progress?: {
        dueDate: string;
        interval: number;
        difficulty: number;
        repetition: number;
        lastReviewed: string | null;
    };

    source?: {
        fileIds: string[];
        blockIds: string[];
        blockState: Record<string, { updatedAt: string }>;
    };
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

export interface ReduxUserState{
    userId: string | null;
    status: "loading" | "authenticated" | "unauthenticated";
    token?: string | null;
}
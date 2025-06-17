// Core Redux Model Interfaces (frontend Representation)

// File document
export interface ReduxFile{
    _id: string;
    title: string;
    iconId?: string;
    data?:any;
    inTrash?: string;
    bannerUrl?: string;
    workspaceId?: string;
    folderId?: string;
    createdAt: Date;
    lastUpdated: Date;
}

// Folder document
export interface ReduxFolder{
    _id: string;
    createdAt: Date;
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
}

export interface FoldersState {
    byId: { [id: string]: ReduxFolder }; 
    allIds: string[];
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
    currentWorkspaceId: string | null; 
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
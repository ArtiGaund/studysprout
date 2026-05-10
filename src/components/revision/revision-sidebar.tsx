/**
 * @component RevisionSidebar
 * @description A real-time collaborative sidebar for managing and generating flashcard sets.
 * * Key Architectural Features:
 * - Concurrency Control: Implements a "Locking" mechanism via WebSockets (`request_gen_start`) 
 * to ensure only one user generates cards per resource at a time.
 * - Distributed State: Synchronizes Redux store and local UI state across multiple clients 
 * using Socket.io events (`flashcard_set_created`, `flashcard_set_deleted`).
 * - Multi-Step Async Workflows: Manages complex generation requests involving parent-child 
 * context resolution (Workspace vs Folder vs File).
 * - Live Feedback: Integrates progress bars that track both local and remote (other users') 
 * generation status in real-time.
 */
'use client';

import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { twMerge } from "tailwind-merge";
import { Button } from "../ui/button";
import { Loader2, PlusIcon } from "lucide-react";
import { Sheet, SheetTrigger } from "../ui/sheet";
import FlashcardTypesForm from "../flashcard/flashcard-types-form";
import { useEffect, useState } from "react";
import FlashcardSetViewerSheet from "../flashcard/flashcard-set-viewer-sheet";
import RevisionFlashcardSetList from "./revision-flashcard-set-list";
import { useFlashcardSet } from "@/hooks/flashcard/useFlashcardSet";
import { useParams } from "next/navigation";
import {  useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
import { useFlashcardGenerationLock } from "@/hooks/flashcard/useFlashcardGenerationLock";
import { useSocket } from "@/lib/providers/socket-provider";
import { useUser } from "@/lib/providers/user-provider";
import { toast } from "../ui/use-toast";
import { removeSet } from "@/store/slices/flashcardSetSlice";
import { ProgressBar } from "./progress-bar";

interface RevisionSidebarProps{
    params: { workspaceId: string};
    className?: string;
}

const RevisionSidebar: React.FC<RevisionSidebarProps> = ({ params, className }) => {
    // --- STORE & CONTEXT SELECTORS ---
    const currentContext = useSelector((state: RootState) => state.context.currentResource);
    const sets = useSelector((state: RootState) => state.flashcardSet.sets);
    const { isRevisionSidebarOpen } = useRevisionSidebar();

    // --- LOCAL UI STATE ---
    const [ isFlashcardTypeSheetOpen, setFlashcardTypeSheetOpen ] = useState(false);
    const [ flashcardSetViewerId, setFlashcardSetViewerId ] = useState<string | null>(null);
    const [ isLocalActor, setIsLocalActor ] = useState(false);
    const [ showProgress, setShowProgress ] = useState(true);
    const [ isRequesting, setIsRequesting ] = useState(false);

    const { workspaceId, folderId } = useParams();
    const currentWorkspaceId = Array.isArray(workspaceId) ? workspaceId[0] : workspaceId;

    // --- CUSTOM HOOKS (Business Logic) ---
    const {
        loading,
        getFlashcardSets,
    } = useFlashcardSet(currentWorkspaceId);
    const { 
        deleteFlashcardSet,
        generateCards,
    } = useFlashcardGenerator();
    /** * @hook useFlashcardGenerationLock
     * Custom hook managing the synchronization of generation "locks" 
     * across the workspace to prevent duplicate AI requests.
     */
    const {
      myProgress,
       isLocked,
       otherProgress
    } = useFlashcardGenerationLock(currentWorkspaceId, currentContext.id as string);
    const {
        socket,
        isConnected,
    } = useSocket();

    const { user } = useUser();
    const dispatch  = useDispatch();

    const closeFlashcardTypeSheet = () => setFlashcardTypeSheetOpen(false);
    const openFlashcardSetViewerSheet = (setId: string) => {
        setFlashcardSetViewerId(setId);
    }
    const closeFlashcardSetViewerSheet = () => {
        setFlashcardSetViewerId(null);
    }

    const isCurrentLocationLocked = !!myProgress;

    // --- ACTION HANDLERS ---

    /**
     * @function deleteFlashcard
     * @description Delete Flashcard Set using the SetId
     */
    const deleteFlashcard = async (setId: string) => {
        try {
            const result = await deleteFlashcardSet(setId);
            if(!result || !result.success){
                console.warn("[RevisionSidebar] Error deleting flashcard set", result);
            }
        } catch (error) {
            console.warn("[RevisionSidebar] Error deleting flashcard set", error);
        }
    }

    /**
     * @function generateFlashcardOnThisLevel
     * @description Initiates the flashcard generation handshake. 
     * 1. Requests a lock from the server.
     * 2. Waits for 'lock_granted' or 'lock_denied'.
     * 3. Triggers the AI generation service upon approval.
     */
    const generateFlashcardOnThisLevel = async () => {
        if(!currentContext.id || !socket || !socket.connected || isLocked || isRequesting) {
            console.warn("[Revision Sidebar] Blocked by pre-condition");
            return;
        }

        setIsRequesting(true);

        const parentId = currentContext.type === 'File' ? folderId : workspaceId;

        // Callback: Handles successful lock acquisition
        const onGranted =  async (data: {
            rId: string 
        }) => { 

            const incomingResouceId = String(data.rId);
            const currentId = String(currentContext.id);

            if(incomingResouceId !== currentId) return;
            
            setIsRequesting(false);
            socket.off("lock_denied", onDenied);
           
            try {
                const finalCardCount = 5;
                const desiredTypes = [
                    "question-answer", 
                    "fill-in-the-blank", 
                    "mcq"
                ] as ("question-answer" | "fill-in-the-blank" | "mcq")[];
        
                const payload = {
                    workspaceId: workspaceId as string,
                    folderId: (folderId ?? "") as string,
                    resourceId: currentId ?? "",
                    resourceType: currentContext.type ?? "Workspace",
                    cardCount: finalCardCount,
                    desiredTypes,
                }
               
                const result = await generateCards(payload);

                if(!result || !result.success){
                    console.warn("[RevisionSidebar] Error generating flashcards", result);
                }
            } catch (error) {
                    console.warn("[RevisionSidebar] Error generating flashcards", error);
            }finally{
                // Release the lock on the server
                socket.emit("request_gen_end", {
                    resourceId: currentContext.id,
                    workspaceId: currentWorkspaceId,
                });
            }

            
        };
        
    // Callback: Handles lock rejection (another user clicked first)
     const onDenied = (data: {
        resourceId: string
    }) => {
        if(data.resourceId === currentContext.id){
            setIsRequesting(false);
            socket.off("lock_granted", onGranted);
            // Show toast
            toast({
                title: "Access Denied",
                description: "Someone is already generating the flashcards of this location.",
                variant: "destructive",
            });

            console.warn("[RevisionSidebar] Lock Denied: Someone beat you to it!.")
        }
    };

    socket.once("lock_granted", onGranted);
    socket.once("lock_denied", onDenied);
        
    socket.emit("request_gen_start", {
            resourceId: currentContext.id,
            parentId: parentId,
            workspaceId: currentWorkspaceId,
            username: user?.username,
        });
    }
    useEffect(() => {
        if(myProgress){
        setShowProgress(true);
    }
    },[myProgress]);

    // --- REAL-TIME SIDE EFFECTS (WebSockets) ---
    /**
     * @effect Sync-Logic
     * Listens for cross-client events to keep the local Redux store 
     * and UI consistent with remote changes.
     */
    useEffect(() => {
        if(!socket || !isConnected ) return;

        const handleRefresh = (data: {
            resourceId: string
        }) => {
            // Trigger a fresh fetch from the server for everyone
            getFlashcardSets(currentWorkspaceId, true);

            toast({
                title: "List Updated",
                description: "New Flashcard Sheet have been added to the workspace",
            });
        }

        const handleRemoteDelete = ( data: {setId: string}) => {
            const { setId } = data;
            dispatch(removeSet(data));

            // If this user is currently looking at the deleted set, close it
            if(flashcardSetViewerId === setId){
                closeFlashcardSetViewerSheet();
                toast({
                    title: "Set Removed",
                    description: "This Flashcard Sheet was deleted by another member.",
                    variant: "destructive",
                });
            }
        }



        socket.on("flashcard_set_created", handleRefresh );
        socket.on("flashcard_set_deleted", handleRemoteDelete)

        return () => {
            socket.off("flashcard_set_created", handleRefresh);
            socket.off("flashcard_set_deleted", handleRemoteDelete);
        }
    },[
        socket,
        currentWorkspaceId,
        getFlashcardSets,
        flashcardSetViewerId,
        dispatch,
        isConnected,
    ])

    // When flashcard sheet is created by another user, re-trigger fetch fir everyone in workspace
    useEffect(() => {

        if(!socket || !isConnected) return;

        const handleRefreshFlashcardSheet = (data: {
            resourceId: string
        }) => {
            getFlashcardSets(currentWorkspaceId, true);
        }

        socket.on("flashcard_set_created", handleRefreshFlashcardSheet);
        socket.on("flashcard_set_completed", handleRefreshFlashcardSheet);

        return () => {
            socket.off("flashcard_set_created", handleRefreshFlashcardSheet);
            socket.off("flashcard_set_completed", handleRefreshFlashcardSheet);
        }
    },[
        socket,
        isConnected,
        currentWorkspaceId,
        getFlashcardSets,
    ])

    useEffect(() => {
        if(!socket || !isConnected) return;

        const handleRemoteDeleteSet = (data: {
            setId: string
        }) => {
            const { setId } = data;

            // Remove from Redux immediately for this user
            dispatch(removeSet({ setId }));

            // If the user is currently viewing the deleted set, close the viewer
            if(flashcardSetViewerId === setId){
                closeFlashcardSetViewerSheet();
                toast({
                    title: "Flashcard Set Removed",
                    description: "This Flashcard sheet was deleted by another member",
                    variant: "destructive",
                });
            }
        };

        // emit in server
        socket.on("flashcard_set_deleted", handleRemoteDeleteSet);

        return () => {
            socket.off("flashcard_set_deleted", handleRemoteDeleteSet);
        }
    }, [
        socket,
        isConnected,
        flashcardSetViewerId,
        dispatch,
    ])

    // --- RENDER ---
    return(
        <>
            {/* {isRevisionSidebarOpen && ( */}
                <aside
                className={twMerge(
                    'flex flex-col shrink-0 p-2 gap-2 h-full',
                    'w-[260px] md:w-[280px] lg:w-[300px] xl:w-[320px]',
                    className
                )}
                >
                    <div className="flex flex-col w-full min-w-0 px-2 sm:px-0">
                        <div className="flex flex-col py-3 sm:items-start items-center">
                            <span className="hidden sm:block font-bold text-sm">
                                Revision Bar
                            </span>

                            {/* Centered Mobile Header */}
                            <div className="sm:hidden flex flex-col items-center text-center mb-4">
                                <h2 className="text-2xl font-bold text-white">
                                    Flashcards
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Revision Mode
                                </p>
                            </div>
                        </div>

                        {/* 1. Progress State UI */}
                        {myProgress && showProgress && (
                            <ProgressBar 
                            title="Your Generation"
                            currentProgress={myProgress.progress}
                            currentCount={myProgress.currentCount}
                            totalCards={myProgress.totalCards}
                            />
                            )}
                             {/*Others Progress bar  */}
                            {otherProgress && (
                                <ProgressBar
                                title={`${otherProgress.username} is generating...`}
                                currentProgress={otherProgress.progress}
                                currentCount={otherProgress.currentCount}
                                totalCards={otherProgress.totalCards}
                                others={true}
                                onMinimize={() => setShowProgress(false)}
                                />
                            )}
                            {/* Action Button  */}
                            <div
                            className="flex flex-row w-full items-center justify-center gap-2 px-2 py-1"
                            >
                                <Button
                                className="flex-1 max-w-[200px] bg-purple-950 hover:bg-purple-800
                                h-12 text-md"
                                onClick={generateFlashcardOnThisLevel}
                                disabled={isCurrentLocationLocked || isRequesting}
                                >
                                    {isCurrentLocationLocked 
                                    ? (
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Loader2 className="w-3 h-3 animate-spin shrink-0"/>
                                        <span className="text-sm truncate">
                                            {isLocalActor ? "Generating..."  :"Busy..."}
                                        </span>
                                    </div>
                                ) 
                                    : (
                                        <span className="truncate">Generate Flashcard</span>
                                    )}
                                </Button>
                                {/* Custom Config sheet trigger */}
                                <div className="flex-1">
                                <Sheet 
                                open={isFlashcardTypeSheetOpen}
                                onOpenChange={setFlashcardTypeSheetOpen}
                                >
                                    <SheetTrigger asChild>
                                        <button
                                        className={twMerge(
                                            "h-10 w-10 flex items-center justify-center",
                                            " hover:bg-gray-800 rounded-md transition-colors"
                                        )}
                                        >
                                            {/* <div className="flex items-center gap-2 lg:block"> */}
                                            <PlusIcon className="w-5 h-5"/>
                                            {/* </div> */}
                                        </button>
                                    </SheetTrigger>
                                    <FlashcardTypesForm 
                                    closeFlashcardTypeSheet={closeFlashcardTypeSheet}
                                    openFlashcardSetViewerSheet={openFlashcardSetViewerSheet}
                                    />
                                </Sheet>
                                </div>
                                {/* </div> */}
                            </div>
                    </div>

                    {/* Flashcard set List */}
                    <div className="flex-1 mt-5 overflow-y-auto min-w-0">
                        {loading 
                        ? (
                            <div className="flex justify-center py-10">
                                <Loader2 
                                className="w-6 h-6 animate-spin text-purple-500"
                                />
                            </div>
                        ) 
                        : (
                            <RevisionFlashcardSetList 
                            sets={sets}
                            onOpen={openFlashcardSetViewerSheet}
                            onDelete={deleteFlashcard}
                            />
                        )}
                    </div>

                    {/* Viewer Sheets */}
                    <Sheet 
                    open={!!flashcardSetViewerId}
                    onOpenChange={closeFlashcardSetViewerSheet}
                    >
                        <FlashcardSetViewerSheet setId={flashcardSetViewerId!}/>
                    </Sheet>
                </aside>
            {/* )} */}
        </>
    )
}

export default RevisionSidebar;
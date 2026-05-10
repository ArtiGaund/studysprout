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
    return (
        <>
            {isRevisionSidebarOpen && (
                <aside
                    className={twMerge(
                        // Fixed width column; flex-col so children stack vertically
                        "hidden sm:flex sm:flex-col shrink-0 p-2 gap-2 h-full overflow-hidden",
                        "w-[260px] md:w-[280px] lg:w-[300px] xl:w-[320px]",
                        className
                    )}
                >
                    {/* ── TOP SECTION (header + progress + buttons) ── */}
                    {/* min-w-0 stops this flex child from overflowing the aside */}
                    <div className="flex flex-col w-full min-w-0 gap-1">
                        <span className="py-3 px-2 font-bold text-sm">Revision Bar</span>

                        {myProgress && showProgress && (
                            <ProgressBar
                                title="Your Generation"
                                currentProgress={myProgress.progress}
                                currentCount={myProgress.currentCount}
                                totalCards={myProgress.totalCards}
                            />
                        )}
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

                        {/* ── BUTTON ROW ──
                            Generate button: flex-1 min-w-0 → takes all remaining space.
                            Plus button:     plain <button> with fixed w-10 h-10 shrink-0.
                            SheetTrigger is intentionally NOT used here — it can collapse
                            in a flex row. State is controlled manually via useState.       */}
                        {/*
                          ── BUTTON ROW ──
                          Using CSS Grid instead of Flexbox.
                          grid-cols-[1fr_40px] gives the Generate button all remaining
                          space and locks the Plus button to exactly 40px — no child
                          component styles (e.g. Button's internal w-full) can override
                          a grid column's explicit size.
                        */}
                        <div className="flex flex-row gap-2 px-2 py-1 w-full">

                            {/* Column 1: Generate button — fills 1fr */}
                            <Button
                                className="flex-1 min-w-0 w-full bg-purple-950
                                 hover:bg-purple-800 text-sm"
                                onClick={generateFlashcardOnThisLevel}
                                disabled={isCurrentLocationLocked || isRequesting}
                            >
                                {isCurrentLocationLocked ? (
                                    <div className="flex items-center gap-2 overflow-hidden w-full">
                                        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                        <span className="truncate text-sm">
                                            {isLocalActor ? "Generating..." : "Busy..."}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="truncate">Generate Flashcard</span>
                                )}
                            </Button>

                            {/* Column 2: Plus button — locked to 40px by the grid column */}
                            <button
                                onClick={() => setFlashcardTypeSheetOpen(true)}
                                className="flex-1 min-w-0 h-10 w-full flex items-center justify-center
                                           border border-gray-700 hover:bg-gray-800
                                           rounded-md transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sheet lives outside the grid row — portal-based, no layout impact */}
                        <Sheet
                            open={isFlashcardTypeSheetOpen}
                            onOpenChange={setFlashcardTypeSheetOpen}
                        >
                            <FlashcardTypesForm
                                closeFlashcardTypeSheet={closeFlashcardTypeSheet}
                                openFlashcardSetViewerSheet={openFlashcardSetViewerSheet}
                            />
                        </Sheet>
                    </div>

                    {/* ── FLASHCARD SET LIST ──
                        flex-1 fills remaining height; overflow-y-auto enables scroll;
                        min-w-0 prevents list items from blowing out the column.          */}
                    <div className="flex-1 overflow-y-auto min-w-0">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                            </div>
                        ) : (
                            <RevisionFlashcardSetList
                                sets={sets}
                                onOpen={openFlashcardSetViewerSheet}
                                onDelete={deleteFlashcard}
                            />
                        )}
                    </div>

                    {/* Viewer Sheet */}
                    <Sheet
                        open={!!flashcardSetViewerId}
                        onOpenChange={closeFlashcardSetViewerSheet}
                    >
                        <FlashcardSetViewerSheet setId={flashcardSetViewerId!} />
                    </Sheet>
                </aside>
            )}
        </>
    );
}

export default RevisionSidebar;
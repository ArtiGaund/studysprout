"use client";

import { useRevisionSidebar } from "@/lib/providers/revision-sidebar-provider";
import { WorkspaceSocketProvider } from "@/lib/providers/workspace-socket-context";
import Sidebar from "../sidebar/sidebar";
import RevisionSidebar from "../revision/revision-sidebar";
import MobileSidebar from "../sidebar/mobile-sidebar";
import InboxSidebar from "../inbox/inbox-sidebar";
import { Sheet } from "../ui/sheet";
import FlashcardSetViewerSheet from "../flashcard/flashcard-set-viewer-sheet";
import FlashcardTypesForm from "../flashcard/flashcard-types-form";

interface DashboardShellProps{
    children: React.ReactNode;
    /**
     * The workspace to hand down to Sidebar/RevisionSidebar for their own display purposes
     * (workspace switcher, "My workspace" link, etc). On workspace routes this is the real 
     * URL param; on non-workspace routes like /dashboard/inbox it's the user's default/last-active
     * workspace, resolved by the calling layout.
     */
    workspaceId: string;
    /**
     * Optional chrome that renders as a sibling of <Sidebar /> inside <main>, Not inside the 
     * scrollable content div. used for things like <WorkspaceSocketManager /> that are
     * genuinely workspace-scoped and shouldn't render on non-workspace routes (eg: /dashboard/
     * inbox simply omits this prop, so no socket connection is opened there).
     */
    mainSlotExtras?: React.ReactNode;
}

/**
 * DashboardShell
 * 
 * Pure UI shell shared by every dashboard route that needs the sidebar chrome:
 * Sidebar (desktop), MobileSidebar (mobile drawer with folder/revision/inbox panels),
 * and the two flashcard sheets. Deliberately contains No workspace-scoped data-fetching- that
 * stays in each route's own layout, since routes differ in what data they need (a single
 * workspace's resources vs. all-workspaces data for the inbox picker).
 */
const DashboardShell: React.FC<DashboardShellProps> = ({
    children,
    workspaceId,
    mainSlotExtras,
}) => {
    const {
        isRevisionSidebarOpen,
        isInboxSidebarOpen,
        flashcardSetViewerId,
        closeFlashcardSetViewerSheet,
        isFlashcardTypeSheetOpen,
        closeFlashcardTypeSheet,
    } = useRevisionSidebar();

    // Sidebar/RevisionSidebar currently expect a `params` object shaped like the route's own
    // params 
    const params = { workspaceId };

    return (
        <WorkspaceSocketProvider>
            <main className="flex overflow-hidden h-screen w-screen">
                {mainSlotExtras}
                <Sidebar params={params} className="hidden sm:flex"/>

                {isRevisionSidebarOpen && (
                    <div className="hidden sm:flex shrink-0 border-neutral-12/70 borde-l-[1px]
                    relative overflow-scroll">
                        <RevisionSidebar params={params}/>
                    </div>
                )}

                {isInboxSidebarOpen && (
                    <div className="hidden sm:flex shrink-0 border-neutral-12/70 borde-l-[1px]
                    relative overflow-scroll">
                        <InboxSidebar />
                    </div>
                )}
                <MobileSidebar 
                    revisionContent={
                        <RevisionSidebar params={params} className="flex"/>
                    }
                    inboxContent={ <InboxSidebar />}
                >
                    <Sidebar params={params} className="w-full flex h-full"/>
                </MobileSidebar>

                <div className="border-neutral-12/70 border-l-[1px] w-full relative overflow-scroll">
                    {children}
                </div>
            </main>

            <Sheet
                open={!!flashcardSetViewerId}
                onOpenChange={(open) => {
                    if(!open) closeFlashcardSetViewerSheet();
                }}
            >
                {flashcardSetViewerId && 
                    <FlashcardSetViewerSheet setId={flashcardSetViewerId}/>
                }
            </Sheet>

            <Sheet
                open={isFlashcardTypeSheetOpen}
                onOpenChange={(open) => {
                    if(open) closeFlashcardTypeSheet();
                }}
            >
                <FlashcardTypesForm />
            </Sheet>
        </WorkspaceSocketProvider>
    )
} 

export default DashboardShell;
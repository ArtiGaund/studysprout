import { useInbox } from "@/hooks/inbox/useInbox";
import { useSession } from "next-auth/react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

interface RevisionSidebarContextType{
    // Mobile drawer's overall open/closed state
    isMobileMenuOpen: boolean;
    openMobileMenu: () => void;
    closeMobileMenu: () => void;

    //which content the drawer show (folder tree vs revision panel)
    isRevisionSidebarOpen: boolean;
    setRevisionSidebarOpen: (open: boolean) => void;

    // which content the drawer shows (folder tree vs inbox panel)
    isInboxSidebarOpen: boolean;
    setInboxSidebarOpen: (open: boolean) => void;

    // Inbox badge count - shared between InboxButton (badge) and InboxSidebar/InboxPage (list),
    //so they always agree on the number
    inboxCount: number;
    setInboxCount: (count: number) => void;
    decrementInboxCount: () => void;

    inboxVersion: number;
    bumpInboxVersion: () => void;

    // Flashcard Set Viewer Sheet
    flashcardSetViewerId: string | null;
    openFlashcardSetViewerSheet: (setId: string) => void;
    closeFlashcardSetViewerSheet: () => void;

    // Flashcard Type/Generation Form Sheet
    isFlashcardTypeSheetOpen: boolean;
    openFlashcardTypeSheet: () => void;
    closeFlashcardTypeSheet: () => void;
}

const RevisionSidebarContext = createContext<RevisionSidebarContextType | null>(null);

export const RevisionSidebarProvider = ({ children }: {children: ReactNode}) => {
    const [ isMobileMenuOpen, setIsMobileMenuOpen ] = useState(false);
    const [ isRevisionSidebarOpen, setIsRevisionSidebarOpen ] = useState(false);
    const [ isInboxSidebarOpen, setIsInboxSidebarOpen ] = useState(false);
    const [ inboxCount, setInboxCountState ] = useState(0);
    const [ inboxVersion, setInboxVersion ] = useState(0);
    const [ flashcardSetViewerId, setFlashcardSetViewerId ] = useState<string | null>(null);
    const [ isFlashcardTypeSheetOpen, setFlashcardTypeSheetOpen ] = useState(false);

    const { getInboxCount } = useInbox();
    const { status } = useSession();
    const lastFetchRef = useRef<number>(0);
    
   /**
    * Closing the mobile drawer BEFORE operating any sheet is the core fix.
    * It guarantee the drawer's `<aside>` (manually translated, not Radix-managed) is 
    * never simultaneously "open" while a Redix Dialog/Sheet is mounted as its descendant-
    * which is what caused the pointer-events lock and stacking conflict.
    */
    const openMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(true);
    },[]);
    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
        setIsRevisionSidebarOpen(false);
        setIsInboxSidebarOpen(false);
    },[]);

    /**
     * Revision and Inbox are mutually exclusive drawer panels - opening one closes the other,
     * so the mobile drawer never has to decide between two "open" panels at once. Each setter
     * still accepts a raw boolean (rather than only "open") so exisiting call sites like the mobile
     * button's setRevisionSidebarOpen(false) keep working unchanged.
     */

    const setRevisionSidebarOpen = useCallback((open: boolean) => {
        if(open) setIsInboxSidebarOpen(false);
        setIsRevisionSidebarOpen(open);
    },[]);

    const setInboxSidebarOpen = useCallback((open: boolean) => {
        if(open) setIsRevisionSidebarOpen(false);
        setIsInboxSidebarOpen(open);
    },[]);


    // --- Inbox count management ---
    const setInboxCount = useCallback((count: number) => {
        setInboxCountState(count);
    },[]); 

    const decrementInboxCount = useCallback(() => {
        setInboxCountState((prev) => Math.max(0, prev-1));
    },[]);

    const bumpInboxVersion = useCallback(() => {
        setInboxVersion((v) => v + 1);
    },[]);

    // Centralized sync function with a 3-second throttle window
    const syncInboxState = useCallback(() => {
        const now = Date.now();
        // Throttle focus refetches to once every 3 seconds
        if(now - lastFetchRef.current < 3000) return;

        lastFetchRef.current = now;

        // 1. Update count badge
        getInboxCount().then((result) => {
            if(result.success && typeof result.data === "number"){
                setInboxCountState(result.data);
            }
        });

        // 2. Notify open/mounted components (InboxPage and InboxSidebar) to refetch
        bumpInboxVersion();
    },[ 
        getInboxCount,
        bumpInboxVersion,
    ]);

    // Fetch the count on mount, and again whenever the window regains focus - this catches items
    // captured through the extension while the user was on a different tab, since there's no
    // live connection telling us about those.
    useEffect(() => {
        if(status !== "authenticated") return;

        // 1. Initial count fetch on mount
        syncInboxState();
        // 2. Throttled sync on tab focus
            let lastFetch = Date.now();

            const handleFocus = () => {
                const now = Date.now();
                // Prevent refetching if focused less than 3 seconds ago
                if (now - lastFetch < 3000) return;
                lastFetch = now;

                syncInboxState();
            };

            window.addEventListener("focus", handleFocus);
            return () => window.removeEventListener("focus", handleFocus);
    },[
        status,
        syncInboxState,
    ]);

    const openFlashcardSetViewerSheet = useCallback((setId: string) => {
        closeMobileMenu();
        setFlashcardSetViewerId(setId);
    },[closeMobileMenu]);

    const closeFlashcardSetViewerSheet = useCallback(() => {
        setFlashcardSetViewerId(null);
    },[]);

    const openFlashcardTypeSheet = useCallback(() => {
        closeMobileMenu();
        setFlashcardTypeSheetOpen(true);
    },[closeMobileMenu]);

    const closeFlashcardTypeSheet = useCallback(() => {
        setFlashcardTypeSheetOpen(false);
    },[]);

   
    return(
        <RevisionSidebarContext.Provider value={{ 
            isMobileMenuOpen,
            openMobileMenu,
            closeMobileMenu,
            isRevisionSidebarOpen, 
            setRevisionSidebarOpen,
            isInboxSidebarOpen,
            setInboxSidebarOpen,
            inboxCount,
            setInboxCount,
            decrementInboxCount,
            inboxVersion,
            bumpInboxVersion,
            flashcardSetViewerId,
            openFlashcardSetViewerSheet,
            closeFlashcardSetViewerSheet,
            isFlashcardTypeSheetOpen,
            openFlashcardTypeSheet,
            closeFlashcardTypeSheet,
        }}>
            {children}
        </RevisionSidebarContext.Provider>
    )
}

export const useRevisionSidebar = () => {
    const context = useContext(RevisionSidebarContext);
    if(!context) throw new Error("useRevisionSidebar must be used within RevisionSidebarProvider");
    return context;
}
import { createContext, ReactNode, useCallback, useContext, useState } from "react";

interface RevisionSidebarContextType{
    // Mobile drawer's overall open/closed state
    isMobileMenuOpen: boolean;
    openMobileMenu: () => void;
    closeMobileMenu: () => void;

    //which content the drawer show (folder tree vs revision panel)
    isRevisionSidebarOpen: boolean;
    setRevisionSidebarOpen: (open: boolean) => void;

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
    const [ isRevisionSidebarOpen, setRevisionSidebarOpen ] = useState(false);
    const [ flashcardSetViewerId, setFlashcardSetViewerId ] = useState<string | null>(null);
    const [ isFlashcardTypeSheetOpen, setFlashcardTypeSheetOpen ] = useState(false);

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
        setRevisionSidebarOpen(false);
    },[]);

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
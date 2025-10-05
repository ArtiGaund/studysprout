import { createContext, ReactNode, useContext, useState } from "react";

interface RevisionSidebarContextType{
    isRevisionSidebarOpen: boolean;
    setRevisionSidebarOpen: (open: boolean) => void;
}

const RevisionSidebarContext = createContext<RevisionSidebarContextType | undefined>(undefined);

export const RevisionSidebarProvider = ({ children }: {children: ReactNode}) => {
    const [ isRevisionSidebarOpen, setRevisionSidebarOpen ] = useState(false);

    return(
        <RevisionSidebarContext.Provider value={{ isRevisionSidebarOpen, setRevisionSidebarOpen }}>
            {children}
        </RevisionSidebarContext.Provider>
    )
}

export const useRevisionSidebar = () => {
    const context = useContext(RevisionSidebarContext);
    if(!context) throw new Error("useRevisionSidebar must be used within RevisionSidebarProvider");
    return context;
}
"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

const ModalContext = createContext({
    openModal: (content: ReactNode) => {},
    closeModal: () => {},
})

export function ModalProvider({ children }: { children: ReactNode }){
    const [ modalContent, setModalContent ] = useState<ReactNode>(null);
    const [ mounted, setMounted ] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    },[]);

    const openModal = (content: ReactNode) => {
        setModalContent(content);
    }

    const closeModal = () => {
        setModalContent(null);
    }

    return(
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            {modalContent && createPortal(
            <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/60
            backdrop-blur-sm p-4 animate-fade-in">
                <div 
                    className="absolute inset-0 z-10 pointer-events-none cursor-pointer" 
                    onClick={closeModal}
                />

                <div className="relative z-20 w-full max-w-md transform overflow-hidden rounded-xl
                bg-[#0c0c0e] border border-white/10 p-6 shadow-2xl pointer-events-auto transition-all">
                    {modalContent}
                </div>
            </div>,
            document.body
            )}
        </ModalContext.Provider>
    )
}

export const useModal = () => useContext(ModalContext);
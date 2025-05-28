"use client";
import { createContext, useContext, useState, ReactNode } from "react";

const ModalContext = createContext({
    openModal: (content: ReactNode) => {},
    closeModal: () => {},
})

export function ModalProvider({ children }: { children: ReactNode }){
    const [ modalContent, setModalContent ] = useState<ReactNode>(null);

    const openModal = (content: ReactNode) => {
        setModalContent(content);
    }

    const closeModal = () => {
        setModalContent(null);
    }

    return(
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            {modalContent && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
                {modalContent}
            </div>
            )}
        </ModalContext.Provider>
    )
}

export const useModal = () => useContext(ModalContext);
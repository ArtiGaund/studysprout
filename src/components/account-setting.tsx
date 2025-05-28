"use client"

import { useModal } from "@/context/ModalProvider"
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React, {
  ReactNode,
} from "react";

const AccountSetting = ({children, className }: {children: ReactNode, className?:string}) => {
    return (
        <AnimatePresence>
            <motion.div
            initial={{
                opacity:0,
            }}
            animate={{
                opacity:1,
                backdropFilter:"blur(4px)",
            }}
            exit={{
                opacity:0,
                backdropFilter:"blur(0px)",
            }}
            className="fixed [perspective:800px] [transform-style:preserve-3d] inset-0 h-full w-full  flex items-center justify-center z-50"
            >
                <Overlay />
                <motion.div
                className={cn(
              "max-w-[40%] bg-white dark:bg-neutral-950 border border-transparent dark:border-neutral-800 md:rounded-2xl relative z-50 flex flex-col flex-1 overflow-hidden p-5",
              className
            )}
            initial={{
              opacity: 0,
              scale: 0.5,
              rotateX: 40,
              y: 40,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateX: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              rotateX: 10,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 15,
            }}
                >
                    <CloseIcon />
                     {children}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default AccountSetting

const Overlay = ({ className }: { className?: string }) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        backdropFilter: "blur(10px)",
      }}
      exit={{
        opacity: 0,
        backdropFilter: "blur(0px)",
      }}
      className={`fixed inset-0 h-full w-full bg-black bg-opacity-50 z-50 ${className}`}
    ></motion.div>
  );
};
const CloseIcon = () => {
  const { closeModal  } = useModal();
  return (
    <button
      onClick={closeModal}
      className="absolute top-4 right-4 group"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-black dark:text-white h-4 w-4 group-hover:scale-125 group-hover:rotate-3 transition duration-200"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};
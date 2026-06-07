"use client"
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import clsx from "clsx";

  interface CustomDialogProps{
    header?: string;
    content?: React.ReactNode;
    children?: React.ReactNode;
    description?: string;
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void; 
  }

const CustomDialogTrigger: React.FC<CustomDialogProps> = ({ 
    header, 
    content,
    children, 
    description, 
    className,
    open,
    onOpenChange,
}) => {
    return (
       <Dialog open={open} onOpenChange={onOpenChange}>
        {/* When we click on children whole children element is triggerred and will bring dialog on screen */}
            <DialogTrigger asChild>
                <div className={clsx('',className)}>
                    {children}
                </div>            
            </DialogTrigger>
            <DialogContent className="max-w-md w-full h-full sm:h-auto md:max-h-[85vh] bg-[#0c0c0e]
            border border-white/5 p-0 overflow-hidden flex flex-col rounded-none sm:rounded-2xl
            z-[150]">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0 text-left">
                    <DialogTitle className="text-white text-lg font-bold tracking-tight">
                        {header}
                    </DialogTitle>
                   {description && ( 
                    <DialogDescription className="text-zinc-500 text-xs">
                        {description}
                    </DialogDescription>
                    )}
                
                </DialogHeader>
                <div className="flex-1 min-h-0 w-full flex flex-col">
                    {content}
                </div>
            </DialogContent>
       </Dialog>
    )
}

export default CustomDialogTrigger
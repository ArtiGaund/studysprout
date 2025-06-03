"use client"
import React from "react";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"


  interface TooltipComponentProps{
    children: React.ReactNode;
    message: string;
  }
  const TooltipComponent: React.FC<TooltipComponentProps> = ({ children, message }) => {
    return(
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>{children}</TooltipTrigger>
                <TooltipContent className="relative top-[-10px]">{message}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
  }

  export default TooltipComponent
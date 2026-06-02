/**
 * @component TooltipComponent
 * @description A reusable abstraction over the Radix UI Tooltip primitive. 
 * This component simplifies the implementation of accessible tooltips by 
 * wrapping the Provider, Root, Trigger, and Content into a single functional unit.
 * * * Design Patterns:
 * - Composition: Uses the `asChild` pattern to allow the tooltip to attach to any valid React element.
 * - Flexibility: Accepts a `className` prop to allow for contextual styling overrides (e.g., positioning adjustments).
 * - Accessibility: Leverages the built-in WAI-ARIA compliance of the underlying Radix primitive.
 */
"use client"
import React from "react";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"

  interface TooltipComponentProps{
    /** The element that will trigger the tooltip on hover/focus */
    children: React.ReactNode;
    /** The text content to display inside the tooltip */
    message: string;
    /** Optional Tailwind classes for custom positioning or styling of the TooltipContent */
    className?: string;
  }
  const TooltipComponent: React.FC<TooltipComponentProps> = ({ children, message, className }) => {
    
    // If there is no active system notification message, bypass rendering the portal container
    // entirely
    if(!message || message.trim() === "") return <>{children}</>

    return(
        <TooltipProvider>
            <Tooltip>
                {/* * 'asChild' is crucial here: it prevents the TooltipTrigger from 
                    * rendering its own <button> tag, instead merging its props into the child. 
                    */}
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent className={`relative top-[-10px] ${className}`}>{message}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
  }

  export default TooltipComponent
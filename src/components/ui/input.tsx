import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2 rounded-md  px-3 py-2 bg-zinc-900">
          {icon && (
            <span className=" text-gray-400">{icon}</span>
          )}
          <input
            type={type}
            className={cn(
              `shadow-input placeholder-text-neutral-600 w-full border-none bg-transparent text-sm placeholder:text-neutral-400 focus:outline-none focus-visible:ring-0 text-white`,
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

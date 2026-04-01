/**
 * @component WorkspaceVisibilityToggle
 * @description A controlled input wrapper designed for StudySprout's workspace settings.
 * It abstracts the generic ToggleSwitch into a semantic "Visibility" selector.
 * * * Features:
 * - Controlled Component: Relies on parent state (value/onChange) for predictable data flow.
 * - Dynamic Labeling: Provides immediate visual feedback on the current privacy state.
 * - Accessible Layout: Uses a flexible, centered alignment suitable for settings sidebars or modals.
 */
"use client";

import { ToggleSwitch } from "@/components/ui/toggle-button";

interface WorkspaceVisibilityToggleProps{
    /** Current visibility state: true for Public, false for Private */
    value: boolean;
    /** Callback to update visibility in the parent state or Redux store */
    onChange: (value: boolean) => void;
}
export default function WorkspaceVisibilityToggle({
    value,
    onChange
}: WorkspaceVisibilityToggleProps){
   
    return(
        <div className="flex justify-center items-center gap-3">
            {/* The underlying UI primitive for the toggle action */}
            <ToggleSwitch 
            checked={value}
            onCheckedChange={onChange}
            size="md"
            />

            {/* Semantic label that updates based on the boolean state */}
            <span className="text-sm text-muted-foreground">
                {value ? "Public workspace" : "Private workspace"}
            </span>
        </div>
    )
}
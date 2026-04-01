import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import { forwardRef } from "react";

const toggleVariants = cva(
  "relative inline-flex items-center rounded-full transition-colors focus:outline-none",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
      },
      variant: {
        active: [
          // All active styles bundled together
          "bg-indigo-700",
          "hover:bg-indigo-800",
          "focus:bg-indigo-800 focus:border focus:border-indigo-600 focus:shadow-[0_0px_0px_4px_rgba(68,76,231,0.12)]",
          "disabled:cursor-not-allowed disabled:opacity-50"
        ],
        inactive: [
          // All inactive styles bundled together
          "bg-gray-500",
          "hover:bg-gray-400",
          "focus:bg-gray-300 focus:border focus:border-gray-400 focus:shadow-[0_0px_0px_4px_rgba(157,164,174,0.20)]",
          "disabled:cursor-not-allowed disabled:bg-gray-100"
        ]
      }
    },
    defaultVariants: {
      size: "md",
      variant: "inactive"
    }
  }
);

const thumbVariants = cva(
  "inline-block transform rounded-full bg-black transition-transform shadow-sm",
  {
    variants: {
      size: {
        sm: ["h-4 w-4", "translate-x-0.5 data-[checked=true]:translate-x-[1.15rem]"],
        md: ["h-5 w-5", "translate-x-0.5 data-[checked=true]:translate-x-[1.4rem]"],
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

export interface ToggleSwitchProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof toggleVariants> {
  checked?: boolean;
  onCheckedChange?: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch = forwardRef<HTMLButtonElement, ToggleSwitchProps>((props, ref) => {
  const { checked = false,
    onCheckedChange,
    disabled = false,
    size,
    className,
    ...rest } = props;


  const handleToggle = () => {
    if (!disabled) {
      onCheckedChange?.(!checked);
    }
  };

  return (
    <button
      ref={ref}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        toggleVariants({
          size,
          variant: checked ? "active" : "inactive"
        }),
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className
      )}
      {...rest}
    >
      <span
        data-checked={checked}
        className={cn(thumbVariants({ size }))}
      />
    </button>
  );
});

ToggleSwitch.displayName = "ToggleSwitch";

export { ToggleSwitch, toggleVariants };
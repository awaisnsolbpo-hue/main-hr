/**
 * MDButton - Material Dashboard Button Component
 * Styled button component matching Material Dashboard design
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const mdButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink hover:shadow-md",
        info: "bg-gradient-to-r from-[#49a3f1] to-[#1A73E8] text-white border-0 shadow-blue hover:shadow-md",
        success: "bg-gradient-to-r from-[#66BB6A] to-[#43A047] text-white border-0 shadow-green hover:shadow-md",
        warning: "bg-gradient-to-r from-[#FFA726] to-[#fb8c00] text-white border-0 shadow-orange hover:shadow-md",
        error: "bg-gradient-to-r from-[#EF5350] to-[#F44335] text-white border-0 shadow-red hover:shadow-md",
        dark: "bg-gradient-to-r from-[#42424a] to-[#344767] text-white border-0 shadow-dark hover:shadow-md",
        outline: "border border-[#dee2e6] bg-white text-[#7b809a] hover:bg-[#f0f2f5] hover:text-[#344767]",
        ghost: "hover:bg-[#f0f2f5] hover:text-[#344767] text-[#7b809a]",
        link: "text-[#e91e63] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface MDButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mdButtonVariants> {
  asChild?: boolean;
}

const MDButton = React.forwardRef<HTMLButtonElement, MDButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(mdButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
MDButton.displayName = "MDButton";

export { MDButton, mdButtonVariants };

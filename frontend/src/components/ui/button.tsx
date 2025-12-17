// Add this to your button.tsx file in the buttonVariants section
// Location: src/components/ui/button.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-white font-bold shadow-sm hover:shadow-md hover:bg-primary/90 hover:scale-[1.02] active:bg-primary/95",
        destructive:
          "bg-destructive text-white font-bold shadow-sm hover:shadow-md hover:bg-destructive/90 hover:scale-[1.02] active:bg-destructive/95",
        outline:
          "border-2 border-primary/40 bg-background text-foreground font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/60 hover:scale-[1.02] active:bg-primary/5",
        secondary:
          "bg-secondary text-foreground font-semibold shadow-sm hover:shadow-md hover:bg-secondary/80 hover:scale-[1.02] active:bg-secondary/70",
        ghost: "text-foreground hover:bg-accent/50 hover:text-accent-foreground font-semibold hover:scale-[1.02] active:bg-accent/40",
        link: "text-primary font-semibold underline-offset-4 hover:underline hover:text-primary/80 active:text-primary/70",
        hero: "bg-gradient-to-r from-primary to-accent text-white font-bold shadow-sm hover:shadow-md hover:from-primary/95 hover:to-accent/95 hover:scale-[1.02] active:from-primary/90 active:to-accent/90",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border-2 border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 text-sm font-medium text-foreground ring-offset-background",
          "placeholder:text-muted-foreground/60 placeholder:font-normal",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus-visible:border-primary/80 focus-visible:bg-background focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]",
          "transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
          "hover:border-primary/50 hover:bg-background hover:shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
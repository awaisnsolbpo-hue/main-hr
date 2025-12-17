import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-border/60 bg-background/95 backdrop-blur-sm px-4 py-2.5 text-base font-medium text-foreground ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground",
          "placeholder:text-muted-foreground/60 placeholder:font-normal",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus-visible:border-primary/80 focus-visible:bg-background focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]",
          "transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
          "hover:border-primary/50 hover:bg-background hover:shadow-sm",
          "md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

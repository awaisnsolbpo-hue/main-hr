import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-primary to-primary/90 text-white shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.3)] hover:shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:scale-[1.05]",
        secondary: "border-transparent bg-gradient-to-r from-secondary to-secondary/90 text-foreground font-bold shadow-sm hover:shadow-md hover:scale-[1.05]",
        destructive: "border-transparent bg-gradient-to-r from-destructive to-destructive/90 text-white shadow-[0_2px_8px_-2px_hsl(var(--destructive)/0.3)] hover:shadow-[0_4px_12px_-2px_hsl(var(--destructive)/0.4)] hover:scale-[1.05]",
        outline: "text-foreground font-bold border-2 border-primary/40 bg-background/80 backdrop-blur-sm hover:border-primary/60 hover:bg-primary/10 hover:scale-[1.02]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

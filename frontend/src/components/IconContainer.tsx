import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconContainerProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "accent" | "success" | "warning" | "destructive";
  className?: string;
}

const sizeClasses = {
  sm: "p-2 w-8 h-8",
  md: "p-2.5 w-10 h-10",
  lg: "p-3 w-12 h-12",
};

const variantGradients = {
  default: "bg-gradient-to-br from-primary to-accent",
  primary: "bg-gradient-to-br from-primary to-primary/80",
  accent: "bg-gradient-to-br from-accent to-accent/80",
  success: "bg-gradient-to-br from-green-500 to-emerald-600",
  warning: "bg-gradient-to-br from-yellow-500 to-orange-600",
  destructive: "bg-gradient-to-br from-red-500 to-red-600",
};

export const IconContainer = ({
  children,
  size = "md",
  variant = "default",
  className,
}: IconContainerProps) => {
  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center shadow-sm transition-shadow duration-150 hover:shadow-md",
        sizeClasses[size],
        variantGradients[variant],
        className
      )}
    >
      <div className="text-white">
        {children}
      </div>
    </div>
  );
};


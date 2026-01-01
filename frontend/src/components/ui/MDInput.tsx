/**
 * MDInput - Material Dashboard Input Component
 * Form input component with Material Dashboard styling
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MDInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const MDInput = React.forwardRef<HTMLInputElement, MDInputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[#344767] mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-[#d2d6da] bg-white px-4 py-3 text-sm text-[#344767] placeholder:text-[#7b809a] focus:border-[#e91e63] focus:outline-none focus:ring-2 focus:ring-[#e91e63]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error && "border-[#F44335] focus:border-[#F44335] focus:ring-[#F44335]/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-[#F44335] font-medium">{error}</p>
        )}
      </div>
    );
  }
);
MDInput.displayName = "MDInput";

export { MDInput };

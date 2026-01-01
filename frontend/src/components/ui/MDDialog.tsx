/**
 * MDDialog - Material Dashboard Dialog/Modal Component
 * Styled modal component matching Material Dashboard design
 */

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const MDDialog = DialogPrimitive.Root;
const MDDialogTrigger = DialogPrimitive.Trigger;
const MDDialogPortal = DialogPrimitive.Portal;
const MDDialogClose = DialogPrimitive.Close;

const MDDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
MDDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const MDDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <MDDialogPortal>
    <MDDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-white p-6 shadow-md-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl border-0",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#e91e63] focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-5 w-5 text-[#7b809a]" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </MDDialogPortal>
));
MDDialogContent.displayName = DialogPrimitive.Content.displayName;

const MDDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left pb-4 border-b border-[#dee2e6]",
      className
    )}
    {...props}
  />
);
MDDialogHeader.displayName = "MDDialogHeader";

const MDDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-[#dee2e6]",
      className
    )}
    {...props}
  />
);
MDDialogFooter.displayName = "MDDialogFooter";

const MDDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight text-[#344767]",
      className
    )}
    {...props}
  />
));
MDDialogTitle.displayName = DialogPrimitive.Title.displayName;

const MDDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[#7b809a] font-light", className)}
    {...props}
  />
));
MDDialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  MDDialog,
  MDDialogPortal,
  MDDialogOverlay,
  MDDialogClose,
  MDDialogTrigger,
  MDDialogContent,
  MDDialogHeader,
  MDDialogFooter,
  MDDialogTitle,
  MDDialogDescription,
};

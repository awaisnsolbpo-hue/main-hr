/**
 * MDBox - Material Dashboard Box Component
 * Utility component for creating Material Dashboard style containers
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MDBoxProps {
  children: ReactNode;
  variant?: "contained" | "gradient";
  bgColor?: "primary" | "info" | "success" | "warning" | "error" | "dark" | "light" | "white" | "transparent";
  color?: "primary" | "info" | "success" | "warning" | "error" | "dark" | "light" | "white" | "text";
  shadow?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "none" | "pink" | "blue" | "green" | "orange" | "red" | "dark";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  p?: number;
  px?: number;
  py?: number;
  pt?: number;
  pb?: number;
  pl?: number;
  pr?: number;
  m?: number;
  mx?: number;
  my?: number;
  mt?: number;
  mb?: number;
  ml?: number;
  mr?: number;
  display?: "block" | "flex" | "inline-flex" | "grid" | "inline-block";
  justifyContent?: "start" | "end" | "center" | "between" | "around" | "evenly";
  alignItems?: "start" | "end" | "center" | "baseline" | "stretch";
  flexDirection?: "row" | "col" | "row-reverse" | "col-reverse";
  gap?: number;
  [key: string]: any;
}

const gradients = {
  primary: "bg-gradient-to-br from-[#EC407A] to-[#D81B60]",
  info: "bg-gradient-to-br from-[#49a3f1] to-[#1A73E8]",
  success: "bg-gradient-to-br from-[#66BB6A] to-[#43A047]",
  warning: "bg-gradient-to-br from-[#FFA726] to-[#FB8C00]",
  error: "bg-gradient-to-br from-[#EF5350] to-[#E53935]",
  dark: "bg-gradient-to-br from-[#42424a] to-[#191919]",
  light: "bg-gradient-to-br from-[#EBEFF4] to-[#CED4DA]",
  white: "bg-white",
  transparent: "bg-transparent",
};

const bgColors = {
  primary: "bg-[#e91e63]",
  info: "bg-[#1A73E8]",
  success: "bg-[#4CAF50]",
  warning: "bg-[#fb8c00]",
  error: "bg-[#F44335]",
  dark: "bg-[#344767]",
  light: "bg-[#f0f2f5]",
  white: "bg-white",
  transparent: "bg-transparent",
};

const textColors = {
  primary: "text-[#e91e63]",
  info: "text-[#1A73E8]",
  success: "text-[#4CAF50]",
  warning: "text-[#fb8c00]",
  error: "text-[#F44335]",
  dark: "text-[#344767]",
  light: "text-[#f0f2f5]",
  white: "text-white",
  text: "text-[#7b809a]",
};

const shadows = {
  xs: "shadow-md-xs",
  sm: "shadow-md-sm",
  md: "shadow-md",
  lg: "shadow-md-lg",
  xl: "shadow-md-xl",
  xxl: "shadow-md-xxl",
  none: "",
  pink: "shadow-pink",
  blue: "shadow-blue",
  green: "shadow-green",
  orange: "shadow-orange",
  red: "shadow-red",
  dark: "shadow-dark",
};

const borderRadii = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export function MDBox({
  children,
  variant = "contained",
  bgColor = "transparent",
  color,
  shadow = "none",
  borderRadius = "none",
  className,
  p,
  px,
  py,
  pt,
  pb,
  pl,
  pr,
  m,
  mx,
  my,
  mt,
  mb,
  ml,
  mr,
  display,
  justifyContent,
  alignItems,
  flexDirection,
  gap,
  ...props
}: MDBoxProps) {
  const spacing = [];
  if (p !== undefined) spacing.push(`p-${p}`);
  if (px !== undefined) spacing.push(`px-${px}`);
  if (py !== undefined) spacing.push(`py-${py}`);
  if (pt !== undefined) spacing.push(`pt-${pt}`);
  if (pb !== undefined) spacing.push(`pb-${pb}`);
  if (pl !== undefined) spacing.push(`pl-${pl}`);
  if (pr !== undefined) spacing.push(`pr-${pr}`);
  if (m !== undefined) spacing.push(`m-${m}`);
  if (mx !== undefined) spacing.push(`mx-${mx}`);
  if (my !== undefined) spacing.push(`my-${my}`);
  if (mt !== undefined) spacing.push(`mt-${mt}`);
  if (mb !== undefined) spacing.push(`mb-${mb}`);
  if (ml !== undefined) spacing.push(`ml-${ml}`);
  if (mr !== undefined) spacing.push(`mr-${mr}`);

  const layout = [];
  if (display) {
    if (display === "flex") layout.push("flex");
    else if (display === "inline-flex") layout.push("inline-flex");
    else if (display === "grid") layout.push("grid");
    else if (display === "inline-block") layout.push("inline-block");
    else layout.push("block");
  }
  if (justifyContent) layout.push(`justify-${justifyContent}`);
  if (alignItems) layout.push(`items-${alignItems}`);
  if (flexDirection) layout.push(`flex-${flexDirection}`);
  if (gap !== undefined) layout.push(`gap-${gap}`);

  return (
    <div
      className={cn(
        variant === "gradient" ? gradients[bgColor] : bgColors[bgColor],
        color && textColors[color],
        shadows[shadow],
        borderRadii[borderRadius],
        ...spacing,
        ...layout,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

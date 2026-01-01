/**
 * MDTypography - Material Dashboard Typography Component
 * Handles all text styling with Material Dashboard design system
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MDTypographyProps {
  children: ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "subtitle1" | "subtitle2" | "body1" | "body2" | "button" | "caption" | "overline";
  color?: "primary" | "info" | "success" | "warning" | "error" | "dark" | "light" | "white" | "text" | "inherit";
  fontWeight?: "light" | "regular" | "medium" | "bold";
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
  verticalAlign?: "baseline" | "sub" | "super" | "text-top" | "text-bottom" | "middle" | "top" | "bottom";
  textGradient?: boolean;
  opacity?: number;
  className?: string;
  component?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  [key: string]: any;
}

const variantStyles = {
  h1: "text-5xl leading-tight font-bold",
  h2: "text-4xl leading-tight font-bold",
  h3: "text-3xl leading-snug font-bold",
  h4: "text-2xl leading-snug font-bold",
  h5: "text-xl leading-snug font-semibold",
  h6: "text-lg leading-normal font-semibold",
  subtitle1: "text-xl leading-normal font-light",
  subtitle2: "text-base leading-normal font-light",
  body1: "text-xl leading-normal font-normal",
  body2: "text-base leading-normal font-light",
  button: "text-sm leading-normal font-light uppercase",
  caption: "text-xs leading-tight font-light",
  overline: "text-xs leading-tight font-normal uppercase",
};

const colorStyles = {
  primary: "text-[#e91e63]",
  info: "text-[#1A73E8]",
  success: "text-[#4CAF50]",
  warning: "text-[#fb8c00]",
  error: "text-[#F44335]",
  dark: "text-[#344767]",
  light: "text-[#f0f2f5]",
  white: "text-white",
  text: "text-[#7b809a]",
  inherit: "",
};

const fontWeights = {
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  bold: "font-bold",
};

const textTransforms = {
  none: "",
  capitalize: "capitalize",
  uppercase: "uppercase",
  lowercase: "lowercase",
};

const verticalAligns = {
  baseline: "align-baseline",
  sub: "align-sub",
  super: "align-super",
  "text-top": "align-text-top",
  "text-bottom": "align-text-bottom",
  middle: "align-middle",
  top: "align-top",
  bottom: "align-bottom",
};

export function MDTypography({
  children,
  variant = "body1",
  color = "dark",
  fontWeight,
  textTransform = "none",
  verticalAlign,
  textGradient = false,
  opacity,
  className,
  component,
  ...props
}: MDTypographyProps) {
  const Component = component || (variant.startsWith("h") ? variant : "p");

  return (
    <Component
      className={cn(
        variantStyles[variant],
        !textGradient && colorStyles[color],
        fontWeight && fontWeights[fontWeight],
        textTransforms[textTransform],
        verticalAlign && verticalAligns[verticalAlign],
        textGradient && "bg-gradient-to-br from-[#EC407A] to-[#D81B60] bg-clip-text text-transparent",
        className
      )}
      style={{ opacity }}
      {...props}
    >
      {children}
    </Component>
  );
}

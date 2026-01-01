/**
 * ComplexStatisticsCard - Material Dashboard Style
 * Replicate the iconic Material Dashboard card design with gradient icon box
 */

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplexStatisticsCardProps {
  color?: "primary" | "info" | "success" | "warning" | "error" | "dark";
  icon: LucideIcon;
  title: string;
  count: string | number;
  percentage?: {
    color: "success" | "error" | "warning" | "info";
    amount: string;
    label: string;
  };
  onClick?: () => void;
  className?: string;
}

const colorStyles = {
  primary: {
    gradient: "bg-gradient-to-br from-[#EC407A] to-[#D81B60]",
    shadow: "shadow-pink",
  },
  info: {
    gradient: "bg-gradient-to-br from-[#49a3f1] to-[#1A73E8]",
    shadow: "shadow-blue",
  },
  success: {
    gradient: "bg-gradient-to-br from-[#66BB6A] to-[#43A047]",
    shadow: "shadow-green",
  },
  warning: {
    gradient: "bg-gradient-to-br from-[#FFA726] to-[#FB8C00]",
    shadow: "shadow-orange",
  },
  error: {
    gradient: "bg-gradient-to-br from-[#EF5350] to-[#E53935]",
    shadow: "shadow-red",
  },
  dark: {
    gradient: "bg-gradient-to-br from-[#42424a] to-[#191919]",
    shadow: "shadow-dark",
  },
};

const percentageColors = {
  success: "text-[#4CAF50]",
  error: "text-[#F44335]",
  warning: "text-[#fb8c00]",
  info: "text-[#1A73E8]",
};

export function ComplexStatisticsCard({
  color = "info",
  icon: Icon,
  title,
  count,
  percentage,
  onClick,
  className,
}: ComplexStatisticsCardProps) {
  const colorStyle = colorStyles[color];

  return (
    <Card
      className={cn(
        "relative overflow-visible bg-white border-0 shadow-md-lg hover:shadow-md-xl transition-all duration-300",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 pt-2">
        {/* Icon Box with Gradient - Negative margin for floating effect */}
        <div className="relative -mt-7 mb-4 flex items-start justify-between">
          <div
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center text-white",
              colorStyle.gradient,
              colorStyle.shadow,
              "transform hover:scale-105 transition-transform duration-300"
            )}
          >
            <Icon className="h-8 w-8" />
          </div>

          {/* Stats on the right */}
          <div className="flex flex-col items-end text-right">
            <p className="text-sm font-light text-[#7b809a] mb-1">{title}</p>
            <h4 className="text-2xl font-bold text-[#344767] leading-none">
              {count}
            </h4>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#dee2e6] my-3" />

        {/* Percentage Change */}
        {percentage && (
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "text-sm font-bold",
                percentageColors[percentage.color]
              )}
            >
              {percentage.amount}
            </span>
            <span className="text-sm font-light text-[#7b809a]">
              {percentage.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

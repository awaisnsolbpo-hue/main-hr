/**
 * MetricCard - Material Dashboard Style
 * Updated to match Material Dashboard's ComplexStatisticsCard design
 */

import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/numberFormat";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  href: string;
  gradient: string;
  color?: "primary" | "info" | "success" | "warning" | "error" | "dark";
  loading?: boolean;
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

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  href,
  color = "dark",
  loading = false,
}: MetricCardProps) => {
  const colorStyle = colorStyles[color];

  return (
    <Link to={href} className="block">
      <Card className="relative overflow-visible bg-white border-0 shadow-md-lg hover:shadow-md-xl transition-all duration-300 group">
        <CardContent className="p-4 pt-2">
          {/* Icon Box with Gradient - Material Dashboard signature floating effect */}
          <div className="relative -mt-7 mb-4 flex items-start justify-between">
            <div
              className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center text-white",
                colorStyle.gradient,
                colorStyle.shadow,
                "transform group-hover:scale-105 transition-transform duration-300"
              )}
            >
              <Icon className="h-8 w-8" />
            </div>

            {/* Stats on the right */}
            <div className="flex flex-col items-end text-right">
              <p className="text-sm font-light text-[#7b809a] mb-1">{title}</p>
              <h4 className="text-2xl font-bold text-[#344767] leading-none">
                {loading ? "..." : value}
              </h4>
            </div>
          </div>

          {/* Divider - Material Dashboard style */}
          <div className="border-t border-[#dee2e6] my-3" />

          {/* Percentage Change or Subtitle */}
          {trend ? (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-bold",
                  trend.isPositive ? "text-[#4CAF50]" : "text-[#F44335]"
                )}
              >
                {trend.isPositive ? "+" : ""}{formatPercentage(trend.value)}
              </span>
              <span className="text-sm font-light text-[#7b809a]">
                {subtitle}
              </span>
            </div>
          ) : (
            <p className="text-sm font-light text-[#7b809a]">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};


import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, ArrowRight } from "lucide-react";
import { IconContainer } from "@/components/IconContainer";
import { formatPercentage } from "@/lib/numberFormat";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  href: string;
  gradient: string;
  loading?: boolean;
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  href,
  gradient,
  loading = false,
}: MetricCardProps) => {
  return (
    <Link to={href}>
      <Card className="metric-card group h-full cursor-pointer transition-shadow duration-150 hover:shadow-md relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-150 rounded-lg pointer-events-none z-0`}></div>
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
          <CardTitle className="text-sm font-bold text-foreground">
            {title}
          </CardTitle>
          <IconContainer size="md" variant="default">
            <Icon className="h-5 w-5" />
          </IconContainer>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-4xl font-bold mb-2 text-foreground">
            {loading ? "..." : value}
          </div>
          <p className="text-sm font-semibold text-foreground/90 mb-1">{subtitle}</p>
          {trend && (
            <div className={`text-xs flex items-center gap-1 mt-2 font-bold ${trend.isPositive ? 'text-green-700' : 'text-red-700'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{formatPercentage(Math.abs(trend.value))}</span>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center text-xs font-bold group-hover:text-primary transition-colors text-foreground">
            <span>View details</span>
            <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-150" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};


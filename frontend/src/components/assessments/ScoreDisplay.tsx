import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ScoreDisplayProps {
  label: string;
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
  colorScheme?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const ScoreDisplay = ({
  label,
  score,
  maxScore = 100,
  size = 'md',
  showBar = true,
  colorScheme,
  className = "",
}: ScoreDisplayProps) => {
  // Auto-determine color scheme based on score percentage
  const percentage = (score / maxScore) * 100;
  const autoColorScheme = colorScheme || (
    percentage >= 80 ? 'success' :
    percentage >= 60 ? 'warning' :
    'danger'
  );

  const colorConfig = {
    success: {
      text: 'text-green-700 font-bold',
      bg: 'bg-green-500',
      badge: 'bg-green-500 text-white border-green-600 font-bold',
    },
    warning: {
      text: 'text-yellow-700 font-bold',
      bg: 'bg-yellow-500',
      badge: 'bg-yellow-500 text-white border-yellow-600 font-bold',
    },
    danger: {
      text: 'text-red-700 font-bold',
      bg: 'bg-red-500',
      badge: 'bg-red-500 text-white border-red-600 font-bold',
    },
    default: {
      text: 'text-blue-700 font-bold',
      bg: 'bg-blue-500',
      badge: 'bg-blue-500 text-white border-blue-600 font-bold',
    },
  };

  const colors = colorConfig[autoColorScheme];
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className={`${sizeClasses[size]} font-semibold text-foreground`}>{label}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={colors.badge}>
            {Number(score).toFixed(2)}%
          </Badge>
          {percentage >= 80 && <TrendingUp className="h-4 w-4 text-green-600" />}
          {percentage < 60 && <TrendingDown className="h-4 w-4 text-red-600" />}
        </div>
      </div>
      {showBar && (
        <Progress value={percentage} className="h-2" />
      )}
    </div>
  );
};


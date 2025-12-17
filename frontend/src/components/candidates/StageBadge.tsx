import { Badge } from "@/components/ui/badge";
import { UserPlus, ClipboardList, Code2, UserCheck, Award, CheckCircle, XCircle } from "lucide-react";
import { LucideIcon } from "lucide-react";

type Stage = 'new' | 'mcq' | 'technical' | 'final_interview' | 'shortlisted' | 'hired' | 'rejected';

interface StageBadgeProps {
  stage: Stage | string;
  className?: string;
}

const stageConfig: Record<string, { label: string; color: string; icon: LucideIcon; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { 
    label: 'New', 
    color: 'bg-blue-100 text-blue-800 border-blue-200 font-bold', 
    icon: UserPlus,
    variant: 'outline',
  },
  mcq: { 
    label: 'MCQ Test', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 font-bold', 
    icon: ClipboardList,
    variant: 'outline',
  },
  technical: { 
    label: 'Technical', 
    color: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary dark:border-primary/40 font-bold', 
    icon: Code2,
    variant: 'outline',
  },
  final_interview: { 
    label: 'Final Interview', 
    color: 'bg-orange-100 text-orange-800 border-orange-200 font-bold', 
    icon: UserCheck,
    variant: 'outline',
  },
  shortlisted: { 
    label: 'Shortlisted', 
    color: 'bg-green-100 text-green-800 border-green-200 font-bold', 
    icon: Award,
    variant: 'default',
  },
  hired: { 
    label: 'Hired', 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold', 
    icon: CheckCircle,
    variant: 'default',
  },
  rejected: { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-800 border-red-200 font-bold', 
    icon: XCircle,
    variant: 'destructive',
  },
};

export const StageBadge = ({ stage, className = "" }: StageBadgeProps) => {
  // Normalize stage string
  const normalizedStage = stage.toLowerCase().replace(/\s+/g, '_') as Stage;
  const config = stageConfig[normalizedStage] || stageConfig.new;
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.color} ${className} flex items-center gap-1.5 border`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
};


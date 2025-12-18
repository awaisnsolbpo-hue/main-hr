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
    color: 'bg-blue-500 text-white border-blue-600 font-bold', 
    icon: UserPlus,
    variant: 'outline',
  },
  mcq: { 
    label: 'MCQ Test', 
    color: 'bg-yellow-500 text-white border-yellow-600 font-bold', 
    icon: ClipboardList,
    variant: 'outline',
  },
  technical: { 
    label: 'Technical', 
    color: 'bg-primary text-white border-primary dark:bg-primary dark:text-white dark:border-primary font-bold', 
    icon: Code2,
    variant: 'outline',
  },
  final_interview: { 
    label: 'Final Interview', 
    color: 'bg-orange-500 text-white border-orange-600 font-bold', 
    icon: UserCheck,
    variant: 'outline',
  },
  shortlisted: { 
    label: 'Shortlisted', 
    color: 'bg-green-500 text-white border-green-600 font-bold', 
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
    color: 'bg-red-500 text-white border-red-600 font-bold', 
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


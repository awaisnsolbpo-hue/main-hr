import { CheckCircle2 } from "lucide-react";

interface InterviewBadgeProps {
  status: "scheduled" | "active" | "completed";
}

const InterviewBadge = ({ status }: InterviewBadgeProps) => {
  const statusConfig = {
    scheduled: {
      label: "Interview Scheduled",
      className: "bg-primary text-white border-primary",
    },
    active: {
      label: "Interview In Progress",
      className: "bg-accent text-white border-accent",
    },
    completed: {
      label: "Interview Completed",
      className: "bg-green-500 text-white border-green-600",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.className} transition-all duration-300`}>
      <CheckCircle2 className="w-4 h-4" />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
};

export default InterviewBadge;


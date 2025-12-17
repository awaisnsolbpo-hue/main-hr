import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, UserPlus, CheckCircle, Calendar, Award, Briefcase, ClipboardList, Code2, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  action_type: string;
  entity_type: string;
  entity_name: string | null;
  description: string;
  created_at: string;
  actor_name?: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
}

const activityConfig: Record<string, { icon: any; color: string; label: string }> = {
  candidate_added: { icon: UserPlus, color: "bg-blue-500", label: "Candidate Added" },
  interview_completed: { icon: CheckCircle, color: "bg-green-500", label: "Interview Completed" },
  candidate_shortlisted: { icon: Award, color: "bg-primary", label: "Shortlisted" },
  job_posted: { icon: Briefcase, color: "bg-orange-500", label: "Job Posted" },
  mcq_completed: { icon: ClipboardList, color: "bg-yellow-500", label: "MCQ Completed" },
  technical_completed: { icon: Code2, color: "bg-primary", label: "Technical Completed" },
  meeting_scheduled: { icon: Calendar, color: "bg-blue-500", label: "Meeting Scheduled" },
};

export const ActivityFeed = ({ activities, loading = false }: ActivityFeedProps) => {
  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const getActivityConfig = (actionType: string) => {
    return activityConfig[actionType] || { icon: UserPlus, color: "bg-gray-500", label: actionType };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-md bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-3/4 bg-muted"></div>
                  <div className="h-3 rounded w-1/4 bg-muted/50"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => {
              const config = getActivityConfig(activity.action_type);
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 group p-3 rounded-md transition-all duration-300 hover:bg-primary/5"
                >
                  <div className={`w-10 h-10 rounded-md ${config.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed text-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {formatTimeAgo(activity.created_at)}
                      </Badge>
                      {activity.entity_name && (
                        <span className="text-xs font-medium text-foreground/70">• {activity.entity_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <Link to="/activity-logs">
              <Button variant="outline" size="sm" className="w-full mt-4">
                View All Activity <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 bg-muted">
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold mb-1 text-foreground">No recent activity</p>
            <p className="text-xs font-medium text-foreground/70">Start by creating a job or importing candidates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


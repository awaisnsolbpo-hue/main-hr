import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StageBadge } from "./StageBadge";
import { ScoreDisplay } from "../assessments/ScoreDisplay";
import { Calendar, Eye, MoreVertical, Briefcase } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CandidateCardProps {
  candidate: {
    id: string;
    full_name?: string;
    name?: string;
    email: string;
    phone?: string;
    job_title?: string;
    stage?: string;
    ats_score?: number;
    ai_score?: number;
    skills?: string[];
    experience_years?: number;
    avatar_url?: string;
    cv_file_url?: string;
    created_at: string;
  };
  compact?: boolean;
  onView: () => void;
  onSchedule?: () => void;
  onMoveStage?: () => void;
}

export const CandidateCard = ({
  candidate,
  compact = false,
  onView,
  onSchedule,
  onMoveStage,
}: CandidateCardProps) => {
  const name = candidate.full_name || candidate.name || 'Unknown';
  const score = candidate.ats_score || candidate.ai_score;
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer" onClick={onView}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={candidate.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{name}</h3>
                  <p className="text-xs text-foreground/80 font-medium truncate">{candidate.email}</p>
                  {candidate.job_title && (
                    <div className="flex items-center gap-1 mt-1">
                      <Briefcase className="h-3 w-3 text-foreground/70" />
                      <span className="text-xs text-foreground/80 font-medium">{candidate.job_title}</span>
                    </div>
                  )}
                </div>
                <StageBadge stage={candidate.stage || 'new'} />
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                {score !== undefined && (
                  <div className="text-xs">
                    <span className="text-foreground/80 font-medium">Score: </span>
                    <span className="font-bold text-foreground">{score}%</span>
                  </div>
                )}
                {candidate.experience_years && (
                  <div className="text-xs text-foreground/80 font-medium">
                    {candidate.experience_years}y exp
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {onSchedule && (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSchedule(); }}>
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onView(); }}>
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-foreground/80 font-medium">{candidate.email}</p>
            </div>
          </div>
          <StageBadge stage={candidate.stage || 'new'} />
        </div>

        {candidate.job_title && (
          <div className="mb-4">
            <div className="flex items-center gap-1 text-sm text-foreground/80 font-medium">
              <Briefcase className="h-4 w-4" />
              <span>{candidate.job_title}</span>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-4">
          {score !== undefined && (
            <ScoreDisplay label="ATS Score" score={score} size="sm" />
          )}
          {candidate.skills && candidate.skills.length > 0 && (
            <div>
              <span className="text-xs text-foreground font-semibold">Skills: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {candidate.skills.slice(0, 3).map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{candidate.skills.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-xs text-foreground/80 font-medium">
            {candidate.experience_years && (
              <span>{candidate.experience_years} years exp</span>
            )}
            <span>{new Date(candidate.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            {onSchedule && (
              <Button size="sm" variant="outline" onClick={onSchedule}>
                <Calendar className="h-3 w-3 mr-1" />
                Schedule
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onView}>
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={onView}>View Profile</DropdownMenuItem>
                {onSchedule && (
                  <DropdownMenuItem onClick={onSchedule}>Schedule Interview</DropdownMenuItem>
                )}
                {onMoveStage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onMoveStage}>Move to Next Stage</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


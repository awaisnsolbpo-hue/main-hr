import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStage {
  label: string;
  count: number | null;
  color: string;
  filterKey?: string;
}

interface PipelineFunnelProps {
  stages: PipelineStage[];
  onStageClick?: (stage: PipelineStage) => void;
}

export const PipelineFunnel = ({ stages, onStageClick }: PipelineFunnelProps) => {
  const navigate = useNavigate();

  const handleStageClick = (stage: PipelineStage) => {
    if (onStageClick) {
      onStageClick(stage);
      return;
    }

    // Route to specific pages based on stage
    switch (stage.label) {
      case "Applied":
        navigate("/candidates");
        break;
      case "MCQ Test":
        navigate("/mcq-tests");
        break;
      case "Technical":
        navigate("/technical-tests");
        break;
      case "Final Interview":
        navigate("/final-interviews");
        break;
      case "Shortlisted":
        navigate("/shortlisted");
        break;
      default:
        // Fallback to candidates with filter if filterKey exists
        if (stage.filterKey) {
          navigate(`/candidates?stage=${stage.filterKey}`);
        } else {
          navigate("/candidates");
        }
    }
  };

  const totalCandidates = stages.reduce((sum, stage) => sum + (stage.count ?? 0), 0);

  return (
    <Card className="border border-border/40 bg-card/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Candidate Pipeline</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{totalCandidates} total candidates</p>
            </div>
          </div>
        </div>

        {/* Horizontal Pipeline - Compact Design */}
        <div className="relative">
          {/* Connecting Line Background */}
          <div className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent hidden sm:block" />
          
          {/* Stages Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {stages.map((stage, index) => {
              const isLast = index === stages.length - 1;
              const stageCount = stage.count ?? 0;
              const percentage = totalCandidates > 0 ? Math.round((stageCount / totalCandidates) * 100) : 0;
              
              return (
                <div key={stage.label} className="relative">
                  {/* Stage Card */}
                  <div
                    onClick={() => handleStageClick(stage)}
                    className={cn(
                      "group relative cursor-pointer rounded-lg p-4 transition-all duration-200",
                      "bg-gradient-to-br from-background to-background/95 border border-border/60",
                      "hover:border-primary/50 hover:shadow-md hover:-translate-y-1",
                      "hover:bg-gradient-to-br hover:from-primary/5 hover:via-primary/3 hover:to-background"
                    )}
                  >
                    {/* Colored top accent */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                      style={{ backgroundColor: stage.color }}
                    />
                    
                    {/* Content */}
                    <div className="space-y-2.5 pt-1">
                      {/* Label with icon */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wide">
                          {stage.label}
                        </span>
                      </div>
                      
                      {/* Count */}
                      <div className="flex items-baseline gap-2">
                        <div 
                          className="text-3xl font-bold leading-none transition-transform group-hover:scale-105"
                          style={{ color: stage.color }}
                        >
                          {stage.count !== null && stage.count !== undefined ? stage.count : 'null'}
                        </div>
                        {totalCandidates > 0 && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {percentage}%
                          </span>
                        )}
                      </div>
                      
                      {/* Mini Progress Bar */}
                      {totalCandidates > 0 && (
                        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: stage.color,
                              boxShadow: `0 0 8px ${stage.color}40`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Hover glow effect */}
                    <div 
                      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                      style={{
                        boxShadow: `0 0 20px ${stage.color}20`,
                      }}
                    />
                  </div>

                  {/* Arrow Separator - Only on larger screens */}
                  {!isLast && (
                    <div className="hidden sm:block absolute top-12 -right-2 z-10">
                      <div className="p-1 rounded-full bg-background border border-border/60 shadow-sm">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Progress Bar - Compact */}
        <div className="mt-5 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pipeline Distribution</span>
          </div>
          <div className="h-3 rounded-full bg-muted/40 overflow-hidden flex gap-0.5">
            {stages.map((stage, index) => {
              const stageCount = stage.count ?? 0;
              const width = totalCandidates > 0 ? (stageCount / totalCandidates) * 100 : 0;
              const displayCount = stage.count !== null && stage.count !== undefined ? stage.count : 'null';
              return (
                <div
                  key={stage.label}
                  className="h-full transition-all duration-500 hover:opacity-90 cursor-pointer relative group"
                  style={{
                    width: `${width}%`,
                    backgroundColor: stage.color,
                    opacity: stageCount > 0 ? 1 : 0.2,
                  }}
                  title={`${stage.label}: ${displayCount} (${totalCandidates > 0 ? Math.round((stageCount / totalCandidates) * 100) : 0}%)`}
                  onClick={() => handleStageClick(stage)}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {stage.label}: {displayCount}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


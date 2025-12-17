import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DashboardHeaderProps {
  title?: string;
  description?: string;
  showInvite?: boolean;
  referralLink?: string;
  profile?: {
    full_name?: string;
    company_name?: string | null;
  } | null;
  user?: {
    email?: string;
  } | null;
  showWelcome?: boolean;
}

const DashboardHeader = ({ 
  title, 
  description,
  showInvite = false,
  referralLink = "",
  profile,
  user,
  showWelcome = false
}: DashboardHeaderProps) => {
  const [referralLinkState] = useState(referralLink);
  const { toast } = useToast();

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLinkState);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  return (
    <header className="border-b-2 border-border/60 sticky top-0 z-30 bg-background/95 backdrop-blur-xl shrink-0 w-full shadow-sm">
      <div className={`flex ${showWelcome ? 'h-14' : 'h-12'} items-center gap-4 px-4 sm:px-6 lg:px-8 w-full`}>
        <SidebarTrigger className="-ml-1 hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-200 rounded-xl shrink-0" />
        
        {showWelcome ? (
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate leading-tight">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-xs text-muted-foreground truncate leading-tight">
              {profile?.company_name ? `${profile.company_name} • ` : ''}Here's your hiring overview
            </p>
          </div>
        ) : (title || description) && (
          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="text-lg sm:text-xl font-bold truncate bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate font-medium">
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {showInvite && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex shrink-0 border-2"
              onClick={handleCopyReferral}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;


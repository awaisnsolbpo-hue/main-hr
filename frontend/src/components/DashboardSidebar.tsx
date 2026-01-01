import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  PlusCircle,
  FolderKanban,
  Search,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Briefcase,
  Upload,
  Zap,
  ClipboardList,
  Code2,
  UserCheck,
  Award,
  Calendar,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardSidebarProps {
  profile?: {
    full_name?: string;
    email?: string;
    company_logo_url?: string | null;
  } | null;
  hasUnviewedActivities?: boolean;
  onActivityClick?: () => void;
  onLogout?: () => void;
}

const DashboardSidebar = ({ 
  profile, 
  hasUnviewedActivities = false,
  onActivityClick,
  onLogout 
}: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/recruiter/login");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      onLogout?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/recruiter/dashboard",
      description: "Overview & metrics",
    },
    {
      title: "Create Job",
      icon: PlusCircle,
      url: "/recruiter/create-job",
      description: "Post new position",
    },
    {
      title: "Import Candidates",
      icon: Upload,
      url: "/recruiter/import-candidates",
      description: "Add candidates",
    },
    {
      title: "Search",
      icon: Search,
      url: "/recruiter/search-candidates",
      description: "Find candidates",
    },
    {
      title: "Jobs",
      icon: Briefcase,
      url: "/recruiter/jobs",
      description: "Manage openings",
    },
    {
      title: "Candidates",
      icon: User,
      url: "/recruiter/candidates",
      description: "All candidates",
    },
  ];

  const interviewPipelineItems = [
    {
      title: "MCQ Tests",
      icon: ClipboardList,
      url: "/recruiter/mcq-tests",
      description: "MCQ assessments",
    },
    {
      title: "Technical Tests",
      icon: Code2,
      url: "/recruiter/technical-tests",
      description: "Technical assessments",
    },
    {
      title: "Final Interviews",
      icon: UserCheck,
      url: "/recruiter/final-interviews",
      description: "Final stage",
    },
    {
      title: "Shortlisted",
      icon: Award,
      url: "/recruiter/shortlisted",
      description: "Ready to hire",
    },
  ];

  const managementItems = [
    {
      title: "Scheduled Meetings",
      icon: Calendar,
      url: "/recruiter/scheduled-meetings",
      description: "Upcoming interviews",
    },
    {
      title: "Activity Logs",
      icon: Activity,
      url: "/recruiter/activity-logs",
      description: "System activity",
    },
  ];


  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarBgImage = "/assets/images/Whisk_2962335e0e6a7c39b604ba64508b1b22dr.jpeg";

  return (
    <Sidebar 
      variant="floating" 
      collapsible="icon" 
      className="border-r-2 border-border/60 bg-card/95 backdrop-blur-xl group/sidebar relative overflow-hidden shadow-[var(--shadow-elegant)]"
      style={{
        backgroundImage: `url(${sidebarBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
      }}
    >
      {/* Overlay to reduce image visibility - matching main background opacity */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
        }}
      />
      <SidebarHeader className={`p-5 border-b-2 border-border/60 relative shrink-0 bg-card/30 backdrop-blur-sm ${isCollapsed ? 'p-3 flex justify-center items-center' : ''}`} style={{ zIndex: 1 }}>
        <Link to="/" className={`flex items-center group transition-all duration-200 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {isCollapsed ? (
            <div className="rounded-xl bg-gradient-to-br from-primary via-primary/95 to-accent flex items-center justify-center p-3 shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)] transition-all duration-200 hover:scale-105">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-gradient-to-br from-primary via-primary/95 to-accent group-hover:scale-105 transition-all duration-200 flex items-center justify-center p-3 shadow-[var(--shadow-button)] group-hover:shadow-[var(--shadow-button-hover)]">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
                  AI Hiring
                </span>
                <span className="text-xs text-muted-foreground font-medium">Dashboard</span>
              </div>
            </>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className={`px-2 py-2 relative flex-1 min-h-0 overflow-y-auto ${isCollapsed ? 'px-1' : ''}`} style={{ zIndex: 1 }}>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-bold text-foreground/70 mb-2">{isCollapsed ? '' : 'Navigation'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.description}
                    className={`group relative ${isCollapsed ? 'justify-center' : 'justify-start'} h-auto py-2.5`}
                  >
                    <Link to={item.url} className={`flex items-center w-full transition-all duration-200 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                      {isCollapsed ? (
                        <div className="rounded-xl bg-muted/50 p-2.5 group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-200 group-hover:scale-110 flex items-center justify-center">
                          <item.icon className="h-4 w-4 text-foreground flex-shrink-0" />
                        </div>
                      ) : (
                        <>
                          <div className="rounded-xl bg-gradient-to-br from-muted/80 to-muted/60 group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-200 flex items-center justify-center p-2.5 shadow-sm group-hover:shadow-md group-hover:scale-105 flex-shrink-0 w-10 h-10">
                            <item.icon className="h-4 w-4 text-foreground flex-shrink-0" />
                          </div>
                          <div className="flex flex-col items-start justify-center flex-1 min-w-0">
                            <span className="font-semibold text-sm leading-tight">{item.title}</span>
                            <span className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors leading-tight mt-0.5">
                              {item.description}
                            </span>
                          </div>
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Interview Pipeline */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-xs font-bold text-foreground/70 mb-2">{isCollapsed ? '' : 'Interview Pipeline'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {interviewPipelineItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.description}
                    className={`group relative ${isCollapsed ? 'justify-center' : 'justify-start'} h-auto py-2.5`}
                  >
                    <Link to={item.url} className={`flex items-center w-full transition-all duration-200 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                      {isCollapsed ? (
                        <div className={`rounded-xl p-2.5 transition-all duration-200 group-hover:scale-110 flex items-center justify-center ${
                          isActive(item.url) 
                            ? 'bg-gradient-to-br from-primary to-accent shadow-md' 
                            : 'bg-muted/50 group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:to-accent/10'
                        }`}>
                          <item.icon className={`h-4 w-4 flex-shrink-0 ${
                            isActive(item.url) ? 'text-white' : 'text-foreground'
                          }`} />
                        </div>
                      ) : (
                        <>
                          <div className={`rounded-xl transition-all duration-200 flex items-center justify-center p-2.5 shadow-sm flex-shrink-0 w-10 h-10 ${
                            isActive(item.url)
                              ? 'bg-gradient-to-br from-primary to-accent shadow-md scale-105'
                              : 'bg-gradient-to-br from-muted/80 to-muted/60 group-hover:from-primary/10 group-hover:to-accent/10 group-hover:shadow-md group-hover:scale-105'
                          }`}>
                            <item.icon className={`h-4 w-4 flex-shrink-0 ${
                              isActive(item.url) ? 'text-white' : 'text-foreground'
                            }`} />
                          </div>
                          <div className="flex flex-col items-start justify-center flex-1 min-w-0">
                            <span className={`font-semibold text-sm leading-tight ${
                              isActive(item.url) ? 'text-primary' : ''
                            }`}>{item.title}</span>
                            <span className={`text-xs transition-colors leading-tight mt-0.5 ${
                              isActive(item.url) 
                                ? 'text-primary/80' 
                                : 'text-muted-foreground group-hover:text-foreground/80'
                            }`}>
                              {item.description}
                            </span>
                          </div>
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-xs font-bold text-foreground/70 mb-2">{isCollapsed ? '' : 'Management'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.description}
                    className={`group relative ${isCollapsed ? 'justify-center' : 'justify-start'} h-auto py-2.5`}
                  >
                    <Link to={item.url} className={`flex items-center w-full transition-all duration-200 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                      {isCollapsed ? (
                        <div className={`rounded-xl p-2.5 transition-all duration-200 group-hover:scale-110 flex items-center justify-center ${
                          isActive(item.url) 
                            ? 'bg-gradient-to-br from-primary to-accent shadow-md' 
                            : 'bg-muted/50 group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:to-accent/10'
                        }`}>
                          <item.icon className={`h-4 w-4 flex-shrink-0 ${
                            isActive(item.url) ? 'text-white' : 'text-foreground'
                          }`} />
                        </div>
                      ) : (
                        <>
                          <div className={`rounded-xl transition-all duration-200 flex items-center justify-center p-2.5 shadow-sm flex-shrink-0 w-10 h-10 ${
                            isActive(item.url)
                              ? 'bg-gradient-to-br from-primary to-accent shadow-md scale-105'
                              : 'bg-gradient-to-br from-muted/80 to-muted/60 group-hover:from-primary/10 group-hover:to-accent/10 group-hover:shadow-md group-hover:scale-105'
                          }`}>
                            <item.icon className={`h-4 w-4 flex-shrink-0 ${
                              isActive(item.url) ? 'text-white' : 'text-foreground'
                            }`} />
                          </div>
                          <div className="flex flex-col items-start justify-center flex-1 min-w-0">
                            <span className={`font-semibold text-sm leading-tight ${
                              isActive(item.url) ? 'text-primary' : ''
                            }`}>{item.title}</span>
                            <span className={`text-xs transition-colors leading-tight mt-0.5 ${
                              isActive(item.url) 
                                ? 'text-primary/80' 
                                : 'text-muted-foreground group-hover:text-foreground/80'
                            }`}>
                              {item.description}
                            </span>
                          </div>
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className={`p-2 border-t-2 border-border/60 space-y-2 relative shrink-0 bg-card/30 backdrop-blur-sm ${isCollapsed ? 'p-2 space-y-1.5 flex flex-col items-center' : ''}`} style={{ zIndex: 1 }}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'justify-between'}`}>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`h-auto hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-200 rounded-xl ${isCollapsed ? 'w-full justify-center p-1.5' : 'w-full justify-start p-2 items-center'}`}
            >
              <Avatar className={`border-2 border-primary/30 shadow-sm flex-shrink-0 transition-all duration-200 hover:scale-105 ${isCollapsed ? 'h-7 w-7' : 'h-8 w-8 mr-2'}`}>
                <AvatarImage src={profile?.company_logo_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary via-primary/95 to-accent text-primary-foreground text-[10px] font-bold shadow-sm">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col items-start flex-1 min-w-0 text-left">
                  <span className="text-xs font-medium truncate w-full text-left">
                    {profile?.full_name || "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-left">
                    {profile?.email || ""}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/recruiter/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/recruiter/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`text-destructive hover:text-destructive hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 transition-all duration-200 rounded-xl ${isCollapsed ? 'w-full justify-center p-1.5' : 'w-full justify-start p-2'}`}
        >
          <div className={`rounded-lg bg-destructive/10 p-1 flex-shrink-0 ${isCollapsed ? '' : 'mr-2'}`}>
            <LogOut className={`${isCollapsed ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
          </div>
          {!isCollapsed && <span className="text-xs font-semibold">Log out</span>}
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default DashboardSidebar;


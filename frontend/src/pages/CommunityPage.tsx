import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Briefcase, Heart, Search, Plus, ArrowRight, User, Calendar, MapPin, DollarSign, Users, Eye, TrendingUp, Award, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { communityApi } from "@/services/api";
import { cn } from "@/lib/utils";

/*
  Standalone Community Page
  - No Navbar
  - No Footer
  - Full-width, clean layout
  - Suitable for /community route
*/

export default function CommunityStandalonePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "jobs" | "discussions">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: postsData, isLoading } = useQuery({
    queryKey: ["community", activeTab, page],
    queryFn: async () => {
      if (activeTab === "jobs") return await communityApi.getJobs({ page, limit: 10 });
      if (activeTab === "discussions") return await communityApi.getDiscussions({ page, limit: 10 });
      return await communityApi.getPosts({ page, limit: 10 });
    },
  });

  const posts: any[] =
    activeTab === "jobs"
      ? (postsData as any)?.jobs || []
      : activeTab === "discussions"
      ? (postsData as any)?.discussions || []
      : (postsData as any)?.posts || [];

  const getInitials = (name = "A") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b-2 border-border/60 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Community</h1>
          <p className="text-foreground/90 mt-2 max-w-2xl font-semibold">
            A dedicated space for HR professionals to discuss, hire, and collaborate.
          </p>

          <div className="mt-6 flex gap-4 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/60" />
              <Input
                placeholder="Search discussions or jobs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => navigate("/community/new-discussion")}>
              <Plus className="h-4 w-4 mr-2" /> New Post
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Feed */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="discussions">Discussions</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading && <p className="text-sm text-foreground/80 font-medium">Loading…</p>}

              {!isLoading && posts?.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-foreground/80 font-semibold">
                    No posts found
                  </CardContent>
                </Card>
              )}

              {posts?.map((post: any) => (
                <Card
                  key={post.id}
                  className="hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                  onClick={() =>
                    navigate(
                      post.type === "job"
                        ? `/jobs/public/${post.id}`
                        : `/community/discussions/${post.id}`
                    )
                  }
                >
                  <CardContent className="pt-6 flex gap-4">
                    <Avatar>
                      <AvatarImage src={post.user?.profile_picture_url} />
                      <AvatarFallback>{getInitials(post.user?.full_name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Badge variant={post.type === "job" ? "default" : "secondary"}>
                          {post.type === "job" ? <Briefcase className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                          {post.type === "job" ? "Job" : "Discussion"}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>

                      <p className="text-sm text-foreground/80 font-medium line-clamp-2">
                        {post.description || post.content}
                      </p>

                      {post.salary_min && (
                        <div className="flex items-center text-sm font-semibold text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {post.salary_min.toLocaleString()}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 text-sm text-foreground/80 font-medium">
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{post.likes_count || 0}</span>
                          {post.type !== "job" && (
                            <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{post.replies_count || 0}</span>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" /> Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-foreground/80 font-medium">Static placeholder</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Trending
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80 font-medium">Top posts by activity</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

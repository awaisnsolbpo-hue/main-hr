import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  User, 
  Calendar,
  Send,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { communityApi } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DiscussionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");

  // Fetch discussion with replies
  const { data, isLoading, error } = useQuery({
    queryKey: ['discussion', id],
    queryFn: () => communityApi.getDiscussionById(id!),
    enabled: !!id,
  });

  const discussion = data?.discussion;
  const replies = data?.replies || [];

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: (content: string) =>
      communityApi.createReply(id!, { content }),
    onSuccess: () => {
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ['discussion', id] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast({
        title: "Reply posted!",
        description: "Your reply has been added",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("Not authenticated") || error.message?.includes("Unauthorized")) {
        toast({
          title: "Login required",
          description: "Please log in to reply",
          variant: "destructive",
        });
        navigate(`/login?redirect=/community/discussions/${id}`);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to post reply",
          variant: "destructive",
        });
      }
    },
  });

  const handleLike = async (postId: string, targetType: 'discussion' | 'reply') => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      navigate(`/login?redirect=/community/discussions/${id}`);
      return;
    }

    try {
      await communityApi.likePost(postId, targetType);
      queryClient.invalidateQueries({ queryKey: ['discussion', id] });
      toast({
        title: "Liked!",
        description: "You've liked this post",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast({
        title: "Empty reply",
        description: "Please enter a reply",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to reply",
        variant: "destructive",
      });
      navigate(`/login?redirect=/community/discussions/${id}`);
      return;
    }

    createReplyMutation.mutate(replyContent);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Discussion not found or error loading discussion
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate("/community")} className="mt-4">
              Back to Community
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/community")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Community
          </Button>

          {/* Discussion Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{discussion.category}</Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">{discussion.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {discussion.user?.full_name || 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(discussion.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4 whitespace-pre-wrap">
                {discussion.content}
              </CardDescription>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(discussion.id, 'discussion')}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  {discussion.likes_count || 0}
                </Button>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reply Form */}
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Add a Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReply} className="space-y-4">
                  <Textarea
                    placeholder="Write your reply..."
                    rows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={createReplyMutation.isPending || !replyContent.trim()}
                  >
                    {createReplyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Reply
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Please log in to reply to this discussion</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/login?redirect=/community/discussions/${id}`)}
                  >
                    Log In
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Replies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Replies ({replies.length})
            </h3>
            {replies.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No replies yet. Be the first to reply!
                </CardContent>
              </Card>
            ) : (
              replies.map((reply: any) => (
                <Card key={reply.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {reply.user?.full_name || 'Anonymous'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {new Date(reply.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mb-3 whitespace-pre-wrap">{reply.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(reply.id, 'reply')}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      {reply.likes_count || 0}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DiscussionDetail;


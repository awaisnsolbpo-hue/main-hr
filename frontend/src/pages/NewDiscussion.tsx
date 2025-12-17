import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { communityApi } from "@/services/api";
import { useMutation } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

const NewDiscussion = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general" as "jobs" | "questions" | "general",
  });

  const createDiscussionMutation = useMutation({
    mutationFn: (data: { title: string; content: string; category: string }) =>
      communityApi.createDiscussion(data),
    onSuccess: (data) => {
      toast({
        title: "Discussion created!",
        description: "Your discussion has been posted to the community",
      });
      navigate(`/community/discussions/${data.discussion.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discussion",
        variant: "destructive",
      });
    },
  });

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate("/login?redirect=/community/new-discussion");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || formData.title.length < 3) {
      toast({
        title: "Invalid title",
        description: "Title must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim() || formData.content.length < 10) {
      toast({
        title: "Invalid content",
        description: "Content must be at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    createDiscussionMutation.mutate(formData);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/community")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Community
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create New Discussion</CardTitle>
              <CardDescription>
                Share your thoughts, ask questions, or start a conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter a descriptive title..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    minLength={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: "jobs" | "questions" | "general") =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jobs">Jobs</SelectItem>
                      <SelectItem value="questions">Questions</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your discussion content here..."
                    rows={10}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                    minLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.content.length} characters (minimum 10)
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Be respectful and follow community guidelines. Inappropriate content will be removed.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/community")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={createDiscussionMutation.isPending}
                    className="flex-1"
                  >
                    {createDiscussionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Discussion"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NewDiscussion;


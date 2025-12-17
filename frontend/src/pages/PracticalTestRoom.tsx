import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { publicApi, storageApi } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Clock,
  CheckCircle,
  Code2,
  Copy,
  AlertCircle,
  Video,
  Upload,
  FileVideo,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface PracticalTask {
  id: string;
  task_title: string;
  task_description: string;
  task_requirements: any[];
  difficulty: string;
  time_limit_minutes: number;
  programming_language: string;
  tools_allowed: string[];
  starter_code?: string;
  expected_output_example: string;
  success_criteria: any[];
  bonus_features: any[];
  task_notes?: string;
  evaluation_focus: any;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
}

const PracticalTestRoom = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = searchParams.get("email");
  const jobId = searchParams.get("job_id");

  // State
  const [practicalTask, setPracticalTask] = useState<PracticalTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [testEnded, setTestEnded] = useState(false);

  // Refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingTestRef = useRef(false);
  const wakeLockRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    if (!email || !jobId) {
      navigate("/practical-test-landing");
      return;
    }

    const fetchTask = async () => {
      try {
        const response = await publicApi.getTechnicalPractical(email, jobId);
        if (!response) {
          throw new Error("Practical test not found");
        }

        setPracticalTask(response);
        setTimeRemaining(response.time_limit_minutes * 60);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load practical test.",
          variant: "destructive",
        });
        navigate("/practical-test-landing");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [email, jobId, navigate, toast]);

  // Timer
  useEffect(() => {
    if (!testStarted || testCompleted || testEnded) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (!isEndingTestRef.current) {
            isEndingTestRef.current = true;
            endTest(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [testStarted, testCompleted, testEnded]);

  // Handle browser close
  useEffect(() => {
    if (!testStarted || testCompleted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    const handleUnload = () => {
      if (!isEndingTestRef.current) {
        isEndingTestRef.current = true;
        endTest(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, [testStarted, testCompleted]);

  // Request wake lock
  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        const lock = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current = lock;
      }
    } catch (err) {
      console.log("Wake lock not available");
    }
  };

  const startTest = async () => {
    if (!practicalTask) return;

    try {
      // Mark test as started in database
      await publicApi.startPracticalTest(practicalTask.id);

      // Request wake lock to prevent screen from sleeping
      await requestWakeLock();

      setShowStartConfirm(false);
      setTestStarted(true);

      toast({
        title: "Test Started!",
        description: "Start recording your screen and begin solving the task.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start test. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid File",
        description: "Please select a video file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      toast({
        title: "File Too Large",
        description: "Video must be less than 500MB.",
        variant: "destructive",
      });
      return;
    }

    setVideoFile(file);

    toast({
      title: "Video Selected",
      description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
    });
  };

  const endTest = async (isAutoEnd: boolean = false) => {
    if (isEndingTestRef.current) return;
    isEndingTestRef.current = true;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        // Release failed
      }
    }

    if (isAutoEnd) {
      toast({
        title: "Time's Up!",
        description: "Your test time has ended. Please upload your screen recording.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Test Ended",
        description: "You have ended the test early. Please upload your screen recording to submit.",
      });
    }

    setTestEnded(true);

    // If test ends without submission, redirect after 5 minutes to allow upload time
    setTimeout(() => {
      if (!testCompleted) {
        toast({
          title: "Redirecting",
          description: "You are being redirected to the main page.",
        });
        navigate("/practical-test-landing");
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  const submitTest = async () => {
    if (!videoFile) {
      toast({
        title: "Video Required",
        description: "Please upload your screen recording before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!practicalTask) return;

    setIsUploading(true);

    try {
      const fileName = `${practicalTask.candidate_email}_practical_${Date.now()}.${videoFile.name.split(".").pop()}`;

      const { publicUrl } = await publicApi.uploadPracticalTestVideo(
        videoFile,
        "practical-test-videos",
        fileName
      );

      const duration = practicalTask.time_limit_minutes * 60 - timeRemaining;

      await publicApi.submitPracticalTest(practicalTask.id, {
        submission_url: publicUrl,
        submitted_at: new Date().toISOString(),
        video_duration_seconds: Math.round(duration),
        duration_minutes: Math.round(duration / 60),
        status: "submitted",
        screen_recording_saved: true,
      });

      setTestCompleted(true);
      setTestEnded(false); // Reset since they submitted

      toast({
        title: "Test Submitted!",
        description: "Your practical test has been submitted successfully.",
      });

      // Redirect immediately after upload completes
      setTimeout(() => {
        navigate("/practical-test-landing");
      }, 2000);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimePercentage = () => {
    if (!practicalTask) return 100;
    const totalTime = practicalTask.time_limit_minutes * 60;
    return (timeRemaining / totalTime) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground font-medium">Loading practical test...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-6">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Test Submitted!</h1>
                <p className="text-lg text-muted-foreground">
                  Your practical test has been received.
                </p>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Your screen recording will be analyzed by our AI to evaluate your approach, code quality, correctness, and communication. You will receive detailed feedback shortly.
              </p>
              <Button
                onClick={() => navigate("/practical-test-landing")}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Before test starts - show instructions
  if (!testStarted && !testEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="sticky top-0 z-50 border-b-2 border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-lg font-bold">Practical Test</h1>
              <Button
                onClick={() => navigate("/practical-test-landing")}
                variant="outline"
                size="sm"
              >
                Exit
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-8">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
              <CardTitle className="text-2xl">{practicalTask?.task_title}</CardTitle>
              <CardDescription className="mt-2">
                Difficulty: <span className="font-semibold capitalize">{practicalTask?.difficulty}</span> | 
                Time Limit: <span className="font-semibold">{practicalTask?.time_limit_minutes} minutes</span> | 
                Language: <span className="font-semibold">{practicalTask?.programming_language}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <Tabs defaultValue="instructions" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="task">Task</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                </TabsList>

                {/* INSTRUCTIONS TAB */}
                <TabsContent value="instructions" className="space-y-6">
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      <span className="font-bold">Important:</span> Read all instructions carefully before starting the test.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 rounded-lg border-2 border-primary/20">
                      <h3 className="font-bold text-lg mb-4 text-primary">How This Test Works</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">1</div>
                          <div>
                            <p className="font-semibold">Start Recording</p>
                            <p className="text-muted-foreground">When you click "Start Test", you will have {practicalTask?.time_limit_minutes} minutes to complete the task.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">2</div>
                          <div>
                            <p className="font-semibold">Screen Recording</p>
                            <p className="text-muted-foreground">Record your entire screen using OBS, Screenflow, ShareX, or built-in recording tools while solving the task.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">3</div>
                          <div>
                            <p className="font-semibold">Think Aloud</p>
                            <p className="text-muted-foreground">Explain your approach, your thought process, and your decisions while coding. This helps us evaluate your problem-solving skills.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">4</div>
                          <div>
                            <p className="font-semibold">Upload Video</p>
                            <p className="text-muted-foreground">After the test ends or when you're done, upload your screen recording. We'll analyze it using AI.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                      <h3 className="font-bold text-lg mb-4 text-amber-900 dark:text-amber-300">⏱️ Timer Rules</h3>
                      <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-200">
                        <li className="flex gap-2">
                          <span className="font-bold">•</span>
                          <span>You have exactly <span className="font-bold">{practicalTask?.time_limit_minutes} minutes</span> to complete this task.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold">•</span>
                          <span>The timer starts when you click "Start Test".</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold">•</span>
                          <span>A countdown timer will be visible at the top of the page.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold">•</span>
                          <span>When time runs out, the test will automatically end.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold">•</span>
                          <span>You can click "End Test Early" if you finish before time expires.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-6 rounded-lg border-2 border-red-200 dark:border-red-800">
                      <h3 className="font-bold text-lg mb-4 text-red-900 dark:text-red-300">⚠️ Important: Browser Close = Auto End</h3>
                      <ul className="space-y-2 text-sm text-red-900 dark:text-red-200">
                        <li className="flex gap-2">
                          <span className="font-bold">•</span>
                          <span>Do NOT close this browser tab or window during the test.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold">•</span>
                          <span>If you close the browser, the test will end automatically.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold">•</span>
                          <span>You will lose any unsaved work.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold">•</span>
                          <span>Keep this window open throughout your entire test session.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <h3 className="font-bold text-lg mb-4 text-green-900 dark:text-green-300">✓ Before You Start</h3>
                      <ul className="space-y-2 text-sm text-green-900 dark:text-green-200">
                        <li className="flex gap-2">
                          <input type="checkbox" className="mt-0.5" />
                          <span>Have your code editor ({practicalTask?.programming_language}) ready</span>
                        </li>
                        <li className="flex gap-2">
                          <input type="checkbox" className="mt-0.5" />
                          <span>Start your screen recording tool (OBS, ShareX, Screenflow, etc.)</span>
                        </li>
                        <li className="flex gap-2">
                          <input type="checkbox" className="mt-0.5" />
                          <span>Close unnecessary tabs and applications</span>
                        </li>
                        <li className="flex gap-2">
                          <input type="checkbox" className="mt-0.5" />
                          <span>Check your internet connection</span>
                        </li>
                        <li className="flex gap-2">
                          <input type="checkbox" className="mt-0.5" />
                          <span>Test microphone volume is adequate</span>
                        </li>
                        <li className="flex gap-2">
                          <input type="checkbox" className="mt-0.5" />
                          <span>Know where you'll save the screen recording file</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* TASK TAB */}
                <TabsContent value="task" className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {practicalTask?.task_description}
                    </p>
                  </div>

                  {practicalTask?.expected_output_example && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                      <h4 className="font-semibold text-sm mb-2">Expected Output Example</h4>
                      <p className="text-xs text-muted-foreground">{practicalTask.expected_output_example}</p>
                    </div>
                  )}

                  {practicalTask?.starter_code && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">Starter Code</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(practicalTask.starter_code || "");
                            toast({ title: "Copied!", description: "Starter code copied to clipboard." });
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="text-xs overflow-auto max-h-48 bg-background rounded p-2">
                        <code>{practicalTask.starter_code}</code>
                      </pre>
                    </div>
                  )}

                  {practicalTask?.task_notes && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300"><span className="font-bold">Note:</span> {practicalTask.task_notes}</p>
                    </div>
                  )}
                </TabsContent>

                {/* REQUIREMENTS TAB */}
                <TabsContent value="requirements" className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-4">Must-Have Requirements</h3>
                    <div className="space-y-2">
                      {practicalTask?.task_requirements && practicalTask.task_requirements.length > 0 ? (
                        practicalTask.task_requirements.map((req, idx) => (
                          <div key={idx} className="flex gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
                            <span className="font-bold text-primary min-w-fit">{idx + 1}.</span>
                            <span className="text-sm">{req}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No specific requirements listed.</p>
                      )}
                    </div>
                  </div>

                  {practicalTask?.success_criteria && practicalTask.success_criteria.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-bold text-lg mb-4">Success Criteria</h3>
                      <div className="space-y-2">
                        {practicalTask.success_criteria.map((criteria, idx) => (
                          <div key={idx} className="flex gap-3 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-green-700 dark:text-green-300">{criteria}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {practicalTask?.bonus_features && practicalTask.bonus_features.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-bold text-lg mb-4">Bonus Features (Optional)</h3>
                      <div className="space-y-2">
                        {practicalTask.bonus_features.map((bonus, idx) => (
                          <div key={idx} className="flex gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                            <span className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">✨</span>
                            <span className="text-sm text-amber-700 dark:text-amber-300">{bonus}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* EVALUATION TAB */}
                <TabsContent value="evaluation" className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-4">How You'll Be Evaluated</h3>
                    <div className="space-y-3">
                      {practicalTask?.evaluation_focus && (
                        <>
                          {Object.entries(practicalTask.evaluation_focus).map(([key, value]) => (
                            <div key={key} className="p-4 rounded-lg border border-border/60 bg-muted/50">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold capitalize text-sm mb-1">{key.replace(/_/g, " ")}</h4>
                                  <p className="text-xs text-muted-foreground">{String(value)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Start Test Button */}
              {!showStartConfirm ? (
                <Button
                  onClick={() => setShowStartConfirm(true)}
                  size="lg"
                  className="w-full mt-8 bg-primary hover:bg-primary/90 h-12 text-base"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Start Practical Test ({practicalTask?.time_limit_minutes}m)
                </Button>
              ) : (
                <Alert className="mt-8 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-orange-700 dark:text-orange-300">
                    <p className="font-bold mb-2">Ready to start?</p>
                    <p className="text-sm mb-4">Make sure your screen recording tool is open and ready. You cannot pause the timer once you start.</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={startTest}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Yes, Start Now
                      </Button>
                      <Button
                        onClick={() => setShowStartConfirm(false)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // During test or after test ended (before submission) - timer and upload section
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header with Timer */}
      <header className="sticky top-0 z-50 border-b-2 border-border/60 bg-background/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary via-primary/95 to-accent">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{practicalTask?.task_title}</h1>
                <p className="text-xs text-muted-foreground">Started recording? Remember to think aloud!</p>
              </div>
            </div>

            {/* Main Timer Display */}
            <div className="flex flex-col items-end gap-2">
              {testEnded ? (
                <div className="px-6 py-3 rounded-lg font-mono font-bold text-2xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  <Clock className="h-5 w-5 inline mr-2" />
                  Test Ended
                </div>
              ) : (
                <>
                  <div className={`px-6 py-3 rounded-lg font-mono font-bold text-2xl ${
                    timeRemaining < 300
                      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse"
                      : timeRemaining < 600
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                      : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                  }`}>
                    <Clock className="h-5 w-5 inline mr-2" />
                    {formatTime(timeRemaining)}
                  </div>
                  <Progress value={getTimePercentage()} className="w-48 h-2" />
                  <p className="text-xs text-muted-foreground">{Math.round(getTimePercentage())}% time remaining</p>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Task Display */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
                <CardTitle className="text-lg">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="description" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="requirements">Requirements</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="space-y-4">
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {practicalTask?.task_description}
                    </p>
                    {practicalTask?.expected_output_example && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                        <p className="text-xs font-semibold mb-2">Expected Output</p>
                        <p className="text-xs text-muted-foreground">{practicalTask.expected_output_example}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="requirements" className="space-y-3">
                    {practicalTask?.task_requirements && practicalTask.task_requirements.map((req, idx) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
                        <span className="font-bold text-primary min-w-fit text-sm">{idx + 1}.</span>
                        <span className="text-sm">{req}</span>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="resources" className="space-y-4">
                    {practicalTask?.starter_code && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold">Starter Code</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(practicalTask.starter_code || "");
                              toast({ title: "Copied!" });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="text-xs overflow-auto max-h-48 bg-background rounded p-2">
                          <code>{practicalTask.starter_code}</code>
                        </pre>
                      </div>
                    )}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <span className="font-semibold">Tools Allowed:</span> {practicalTask?.tools_allowed?.join(", ")}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="shadow-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-900 dark:text-blue-300">💡 Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                <p>• Explain your approach as you code (helps us evaluate your thinking)</p>
                <p>• Test your solution with the provided examples</p>
                <p>• Add comments to your code for clarity</p>
                <p>• Don't worry about typing speed - quality matters more</p>
                <p>• If you get stuck, explain what you're trying to do</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Video Upload */}
          <div className="space-y-4">
            <Card className="shadow-lg sticky top-28">
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileVideo className="h-4 w-4" />
                  Video Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {!videoFile ? (
                  <div 
                    className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileSelect}
                      className="hidden"
                    />
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs font-semibold">Click to upload video</p>
                    <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-2">Max 500MB</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-green-700 dark:text-green-300">Video Selected</p>
                          <p className="text-xs text-green-600 dark:text-green-400">{videoFile.name}</p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {(videoFile.size / (1024 * 1024)).toFixed(2)}MB
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setVideoFile(null);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Change Video
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Test Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground font-semibold mb-2">Time Used</p>
                  <p className="font-mono font-bold text-primary">
                    {formatTime(practicalTask!.time_limit_minutes * 60 - timeRemaining)}
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-muted-foreground font-semibold mb-2">Checklist</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded border ${videoFile ? "bg-green-500 border-green-600" : "border-muted"}`} />
                      <span>Video uploaded</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!testEnded && (
                <Button
                  onClick={() => endTest(false)}
                  variant="outline"
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/20"
                  disabled={isUploading}
                >
                  End Test Early
                </Button>
              )}

              <Button
                onClick={submitTest}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={!videoFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Test
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticalTestRoom;


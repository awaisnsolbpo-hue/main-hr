import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { publicApi, storageApi } from "@/services/api";
import { generateMCQQuestions, type MCQQuestion } from "@/lib/mcqGenerator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  LogOut,
  Loader2,
  Clock,
  CheckCircle,
  Radio,
  Sparkles,
  Monitor,
} from "lucide-react";

interface UserAnswers {
  [questionId: string]: "A" | "B" | "C" | "D";
}

const MCQRoom = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = searchParams.get("email");
  const candidateIdParam = searchParams.get("candidate_id");

  // State
  const [candidate, setCandidate] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingChunks, setRecordingChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [testConcluded, setTestConcluded] = useState(false);

  // Refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingTestRef = useRef(false);
  const wakeLockRef = useRef<any>(null);

  // Initialize
  useEffect(() => {
    if (!email || !candidateIdParam) {
      navigate("/mcqs-landing");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch candidate from candidates table using email and candidate ID
        const { candidates } = await publicApi.getInterviewCandidate(email, candidateIdParam);
        if (!candidates || candidates.length === 0) {
          throw new Error("Candidate not found");
        }

        // Find candidate matching both email and ID with "Scheduled For MCQS" status
        const candidateData = candidates.find(
          (c: any) => c.id === candidateIdParam.trim() && c.status?.trim() === "Scheduled For MCQS"
        );
        if (!candidateData) {
          throw new Error("MCQ test is not scheduled. Please contact support.");
        }

        // Check if candidate has job_id
        if (!candidateData.job_id) {
          throw new Error("No job associated with your candidate record. Please contact support.");
        }

        setCandidate(candidateData);

        // Fetch job data using job_id from candidate record
        const { job } = await publicApi.getJobDetails(candidateData.job_id);
        setJobData(job);

        // Generate MCQ questions using job data
        const generatedQuestions = await generateMCQQuestions({
          title: job.title,
          description: job.description || "",
          experience_required: job.experience_required || 0,
          skills: job.skills || [],
        });

        setQuestions(generatedQuestions);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load MCQ test.",
          variant: "destructive",
        });
        navigate("/mcqs-landing");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, navigate, toast]);

  // Timer
  useEffect(() => {
    if (!testStarted) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto-end test
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (!isEndingTestRef.current) {
            isEndingTestRef.current = true;
            endTest();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [testStarted]);


  const startScreenRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      } as any);

      setScreenStream(screenStream);

      // Use only screen stream (includes screen video and system audio)
      const recorder = new MediaRecorder(screenStream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          setRecordingChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);

      screenStream.getVideoTracks()[0].onended = () => {
        toast({
          title: "Screen Share Stopped",
          description: "Please restart screen sharing.",
          variant: "destructive",
        });
      };

      return true;
    } catch (error) {
      toast({
        title: "Screen Recording Error",
        description: "Failed to start screen recording.",
        variant: "destructive",
      });
      return false;
    }
  };

  const startTest = async () => {
    if (!candidate || questions.length === 0) return;

    setConnecting(true);

    // Start screen recording only
    const screenRecordingStarted = await startScreenRecording();
    if (!screenRecordingStarted) {
      setConnecting(false);
      return;
    }

    // Request wake lock
    try {
      if ("wakeLock" in navigator) {
        const lock = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current = lock;
      }
    } catch (err) {
      // Wake lock failed - continue anyway
    }

    setConnecting(false);
    setTestStarted(true);
    
    // Save test start time
    try {
      const startData = {
        candidate_id: candidate.id,
        job_id: candidate.job_id,
        candidate_email: candidate.email,
        candidate_name: candidate.name || candidate.full_name,
        job_title: jobData?.title,
        stage_name: candidate.stage_name || null,
        status: "in_progress",
        total_questions: questions.length,
        attempted_questions: 0,
        correct_answers: 0,
        started_at: new Date().toISOString(),
        time_limit_minutes: 15,
        passing_score: 33.3,
      };
      await publicApi.saveMCQTestResults(startData);
    } catch (error) {
      console.error("Failed to save test start:", error);
    }
  };


  const handleAnswerChange = (questionId: string, answer: "A" | "B" | "C" | "D") => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentQuestionIndex === questions.length - 1) {
      // If on last question, end the test
      endTest();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const endTest = async () => {
    if (isEndingTestRef.current) return;
    isEndingTestRef.current = true;
    
    // Prevent editing after concluding
    setTestConcluded(true);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Stop recording and wait for final chunks
    let finalChunks = [...recordingChunks];
    
    if (mediaRecorder && isRecording) {
      // Wait for recorder to stop and collect final chunks
      await new Promise<void>((resolve) => {
        const handleStop = () => {
          // Final data should be available now
          resolve();
        };

        mediaRecorder.onstop = handleStop;
        mediaRecorder.stop();
        setIsRecording(false);
        
        // Fallback timeout in case onstop doesn't fire
        setTimeout(() => {
          resolve();
        }, 2000);
      });
      
      // Get the latest chunks after recorder stopped
      finalChunks = [...recordingChunks];
    }

    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        // Release failed
      }
    }

    setIsUploading(true);

    try {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach((q) => {
        if (userAnswers[q.id] === q.correct_answer) {
          correctAnswers++;
        }
      });

      const score = (correctAnswers / questions.length) * 100;
      setTestScore(Math.round(score));

      // Upload recording using public API
      let recordingUrl = null;
      if (finalChunks.length > 0) {
        const recordingBlob = new Blob(finalChunks, { type: "video/webm" });
        const fileName = `${candidate.email}_mcq_${Date.now()}.webm`;

        console.log(`MCQ Recording: ${finalChunks.length} chunks, ${recordingBlob.size} bytes`);

        try {
          setUploadProgress(50);
          
          const { publicUrl } = await publicApi.uploadMCQRecording(
            new File([recordingBlob], fileName, { type: "video/webm" }),
            candidate.email,
            candidate.id,
            candidate.job_id
          );
          recordingUrl = publicUrl;
          setUploadProgress(75);
          console.log("MCQ recording uploaded successfully:", publicUrl);
        } catch (uploadError: any) {
          console.error("Recording upload error:", uploadError);
          
          // Extract error message and details
          let errorMessage = uploadError.message || "Failed to upload screen recording";
          let errorDetails = "";
          
          if (uploadError.message?.includes('bucket') || uploadError.message?.includes('Bucket')) {
            errorDetails = "The storage bucket may not be configured. Please contact support.";
          } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('Permission')) {
            errorDetails = "Storage permissions issue. Please contact support.";
          } else if (uploadError.message?.includes('buffer') || uploadError.message?.includes('Buffer')) {
            errorDetails = "File upload issue. Please try again.";
          }
          
          toast({
            title: "Upload Warning",
            description: errorDetails ? `${errorMessage}. ${errorDetails}` : `${errorMessage}. Test results will still be saved.`,
            variant: "destructive",
          });
          // Continue even if upload fails - don't block test completion
        }
      } else {
        console.warn("MCQ Recording: No recording chunks available to upload");
      }

      // Calculate attempted questions
      const attemptedQuestions = Object.keys(userAnswers).length;
      
      // Save MCQ test results
      const mcqTestData: any = {
        candidate_id: candidate.id,
        job_id: candidate.job_id,
        candidate_email: candidate.email,
        candidate_name: candidate.name || candidate.full_name,
        job_title: jobData?.title,
        stage_name: candidate.stage_name || null,
        status: "completed",
        total_questions: questions.length,
        attempted_questions: attemptedQuestions,
        correct_answers: correctAnswers,
        questions: questions,
        answers: userAnswers,
        score: correctAnswers,
        percentage: score,
        recording_duration_seconds: (15 * 60) - timeRemaining,
        started_at: testStarted ? new Date().toISOString() : null,
        completed_at: new Date().toISOString(),
        duration_minutes: Math.floor(((15 * 60) - timeRemaining) / 60),
        time_limit_minutes: 15,
        passing_score: 33.3,
        passed: correctAnswers >= 10 || score >= 33.3,
        review_notes: null,
      };

      // Only include screen_recording_url if we have a URL (don't send null)
      // This ensures we don't accidentally overwrite an existing URL with null
      if (recordingUrl) {
        mcqTestData.screen_recording_url = recordingUrl;
      }

      setUploadProgress(90);

      // Save to database via API
      const savedTest = await publicApi.saveMCQTestResults(mcqTestData);
      
      // Verify screen_recording_url was saved, and retry if needed
      if (recordingUrl) {
        console.log("MCQ test saved with screen recording URL:", savedTest?.test?.screen_recording_url);
        
        // If URL wasn't saved, try to update it explicitly
        if (savedTest?.test && !savedTest.test.screen_recording_url) {
          console.log("Screen recording URL missing, attempting to update...");
          try {
            // Update only the screen_recording_url field
            await publicApi.saveMCQTestResults({
              candidate_id: candidate.id,
              job_id: candidate.job_id,
              screen_recording_url: recordingUrl,
            });
            console.log("Screen recording URL updated successfully");
          } catch (updateError) {
            console.error("Failed to update screen recording URL:", updateError);
          }
        }
      } else {
        console.log("No screen recording URL to save (recording may have failed)");
      }

      // Update candidate status
      await publicApi.updateCandidateStatus(candidate.id, "MCQ Completed");

      setTestCompleted(true);
      setUploadProgress(100);

      // Don't show score to candidate - just simple completion message
      toast({
        title: "Test Completed",
        description: "Thank you for completing the test. Your responses have been recorded.",
      });

      // Redirect immediately after upload completes
      setTimeout(() => {
        navigate("/mcqs-landing");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save test results.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground font-medium">Generating MCQ questions...</p>
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
                <h1 className="text-3xl font-bold">Thank You!</h1>
                <p className="text-lg text-muted-foreground">
                  Your test has been completed successfully.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your responses have been recorded and will be reviewed by our team.
                </p>
              </div>
              <Button
                onClick={() => navigate("/mcqs-landing")}
                size="lg"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="sticky top-0 z-50 border-b-2 border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-lg font-bold">MCQ Assessment</h1>
              <Button
                onClick={() => navigate("/mcqs-landing")}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-8">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
              <CardTitle className="text-2xl">MCQ Test Instructions</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Radio className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Test Details</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Total Questions:</span> 30</p>
                      <p><span className="font-semibold">Time Limit:</span> 15 minutes</p>
                      <p><span className="font-semibold">Question Types:</span></p>
                      <ul className="list-disc list-inside ml-2 text-muted-foreground">
                        <li>Technical (18 questions)</li>
                        <li>Behavioral (8 questions)</li>
                        <li>Office Environment (4 questions)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Requirements</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>✓ Webcam will be enabled for monitoring</p>
                      <p>✓ Screen sharing required during test</p>
                      <p>✓ Browser window must remain open</p>
                      <p>✓ Test auto-ends after 15 minutes</p>
                      <p>✓ All answers auto-save</p>
                    </div>
                  </div>
                </div>


                <Button
                  onClick={startTest}
                  size="lg"
                  className="w-full"
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Starting Test...
                    </>
                  ) : (
                    "Start MCQ Test"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Loading Dialog during upload */}
      <Dialog open={isUploading} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uploading Test Results</DialogTitle>
            <DialogDescription>
              Please wait while we upload your screen recording and save your test results...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={uploadProgress} className="w-full" />
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fixed Header */}
      <header className="sticky top-0 z-50 border-b-2 border-border/60 bg-background/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary via-primary/95 to-accent">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">MCQ Assessment</h1>
                <p className="text-xs text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg font-bold text-lg font-mono ${
                timeRemaining < 300
                  ? "bg-red-500 text-white dark:bg-red-600 dark:text-white"
                  : "bg-primary text-white"
              }`}>
                <Clock className="h-4 w-4 inline mr-2" />
                {formatTime(timeRemaining)}
              </div>

              <Button
                onClick={() => !isUploading && endTest()}
                variant="destructive"
                size="sm"
                disabled={isUploading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                End Test
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Screen Recording Status */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Screen Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border-2 border-border/60">
                  {isRecording ? (
                    <>
                      <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Screen recording is active</span>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 bg-muted-foreground rounded-full" />
                      <span className="text-sm text-muted-foreground">Screen recording will start when you begin the test</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Question */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
                <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
                <CardDescription>
                  Category: {currentQuestion.category.replace("_", " ").toUpperCase()} | 
                  Difficulty: {currentQuestion.difficulty.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userAnswers[currentQuestion.id] === key
                        ? "bg-primary/10 border-primary"
                        : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={key}
                      checked={userAnswers[currentQuestion.id] === key}
                      onChange={() => handleAnswerChange(currentQuestion.id, key as "A" | "B" | "C" | "D")}
                      className="w-5 h-5 text-primary"
                      disabled={isUploading || testConcluded}
                    />
                    <span className="font-semibold text-primary">{key}.</span>
                    <span className="text-sm">{value}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex gap-4 justify-between">
              <Button
                onClick={previousQuestion}
                variant="outline"
                disabled={currentQuestionIndex === 0 || isUploading || testConcluded}
                className="border-2"
              >
                ← Previous
              </Button>

              <div className="flex items-center gap-2">
                <Progress value={progressPercent} className="w-48 h-2" />
                <span className="text-sm font-semibold text-muted-foreground min-w-fit">
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </div>

              <Button
                onClick={nextQuestion}
                variant="outline"
                disabled={isUploading || testConcluded}
                className="border-2"
              >
                {currentQuestionIndex === questions.length - 1 ? "Submit Test →" : "Next →"}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Upload Progress */}
            {isUploading && (
              <Card className="shadow-lg bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Uploading...</span>
                      <span className="text-xs font-bold">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Test Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground font-semibold mb-1">Recording</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-muted"}`} />
                    <span>{isRecording ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground font-semibold mb-1">Answered</p>
                  <span className="font-bold text-primary">{answeredCount}/{questions.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Question Map */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Question Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      disabled={isUploading || testConcluded}
                      className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                        idx === currentQuestionIndex
                          ? "bg-primary text-white ring-2 ring-primary/40"
                          : userAnswers[q.id]
                          ? "bg-green-500 text-white dark:bg-green-600 dark:text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCQRoom;


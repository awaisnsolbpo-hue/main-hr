import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { createVapiClient, type VapiSessionContext } from "@/lib/vapiClient";
import { type CandidateRecord } from "@/lib/interviewTypes";
import { useToast } from "@/hooks/use-toast";
import { publicApi } from "@/services/api";
import InterviewBadge from "@/components/InterviewBadge";
import { Video, Mic, VideoOff, MicOff, User, Sparkles, Volume2, LogOut, Loader2 } from "lucide-react";

const InterviewRoom = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = searchParams.get("email");
  const jobId = searchParams.get("job_id");

  // Get Supabase credentials for sync updates on page close
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const [candidate, setCandidate] = useState<CandidateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [interviewActive, setInterviewActive] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [vapiClient, setVapiClient] = useState<any>(null);
  const [vapiInitialized, setVapiInitialized] = useState(false);
  const [vapiReady, setVapiReady] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ text: string; timestamp: string; speaker: 'AI' | 'HUMAN' }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState<{ text: string; speaker: 'AI' | 'HUMAN'; startTime: string } | null>(null);
  const [transcriptTimeout, setTranscriptTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingChunks, setRecordingChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [showConnectingModal, setShowConnectingModal] = useState(false);
  const [aiHasStartedSpeaking, setAiHasStartedSpeaking] = useState(false);

  // Ref for transcript container to enable auto-scroll
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const isEndingInterview = useRef(false);
  const audioMonitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const vapiInitializationRef = useRef(false);
  const callStartedRef = useRef(false);

  // Auto-scroll transcript to bottom when new entries are added or partial transcript updates
  useEffect(() => {
    if (transcriptEndRef.current && transcriptContainerRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (transcriptEndRef.current) {
          transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });
    }
  }, [transcript, partialTranscript]);

  // Hide loading screen when interview becomes active (End Interview button shows up)
  useEffect(() => {
    if (interviewActive && showConnectingModal) {
      console.log("Interview active - hiding loading screen");
      setShowConnectingModal(false);
      setConnecting(false);
    }
  }, [interviewActive, showConnectingModal]);

  // Handle page refresh/close - mark interview as completed if started
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Prevent closing if currently uploading
      if (isUploading) {
        e.preventDefault();
        e.returnValue = 'Recording is being uploaded. Please wait for the upload to complete before leaving.';
        return;
      }

      if (interviewStarted && candidate && !isEndingInterview.current) {
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your interview will be marked as completed.';

        // Use synchronous XHR request for guaranteed delivery on page unload
        if (!supabaseUrl || !supabaseKey) {
          console.error('Supabase credentials not available');
          return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('PATCH', `${supabaseUrl}/rest/v1/qualified_for_final_interview?id=eq.${candidate.id}`, false); // false = synchronous
        xhr.setRequestHeader('apikey', supabaseKey);
        xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Prefer', 'return=minimal');

        try {
          xhr.send(JSON.stringify({ interview_status: 'Completed' }));
          console.log('Interview marked as completed (beforeunload)');
        } catch (error) {
          console.error('Failed to update interview status on beforeunload:', error);
        }
      }
    };

    const handleUnload = () => {
      if (interviewStarted && candidate && !isEndingInterview.current) {
        // Use sendBeacon as last resort (non-blocking, guaranteed to send)
        if (!supabaseUrl || !supabaseKey) {
          console.error('Supabase credentials not available');
          return;
        }

        const url = `${supabaseUrl}/rest/v1/qualified_for_final_interview?id=eq.${candidate.id}`;

        // Create proper request for sendBeacon with headers
        // Note: sendBeacon doesn't support custom headers, so we use FormData approach
        const formData = new FormData();
        formData.append('interview_status', 'Completed');

        try {
          // Fallback to fetch with keepalive
          fetch(url, {
            method: 'PATCH',
            keepalive: true, // Important: ensures request completes even after page closes
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ interview_status: 'Completed' })
          }).catch(err => console.error('Unload update failed:', err));

          console.log('Interview marked as completed (unload - keepalive)');
        } catch (error) {
          console.error('Failed to update interview status on unload:', error);
        }
      }
    };

    // Handle page visibility changes to maintain audio connection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden - maintaining audio connection");
        // Keep audio tracks alive by checking their state (during interview or loading)
        if (mediaStream && (interviewActive || connecting)) {
          const audioTrack = mediaStream.getAudioTracks()[0];
          if (audioTrack && audioTrack.readyState === 'live') {
            // Force track to stay active
            audioTrack.enabled = true;
          }
        }
      } else {
        console.log("Page visible - verifying audio connection");
        // When page becomes visible, verify audio is still working (during interview or loading)
        if (mediaStream && (interviewActive || connecting)) {
          const audioTrack = mediaStream.getAudioTracks()[0];
          if (audioTrack && audioTrack.readyState !== 'live') {
            console.error("Audio track not live after visibility change");
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interviewStarted, candidate, interviewActive, connecting, mediaStream, isUploading]);

  // Helper function to mark interview as completed
  const markInterviewAsCompleted = async (candidateId: string, isRefresh: boolean = false) => {
    try {
      const { error } = await supabase
        .from('qualified_for_final_interview' as any)
        .update({ interview_status: 'Completed' })
        .eq('id', candidateId);

      if (error) {
        console.error("Error marking interview as completed:", error);
      } else {
        console.log("Interview marked as completed", isRefresh ? "(due to refresh/close)" : "");
      }
    } catch (error) {
      console.error("Error in markInterviewAsCompleted:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear audio monitor interval
      if (audioMonitorIntervalRef.current) {
        clearInterval(audioMonitorIntervalRef.current);
      }

      // Cleanup all media streams when component unmounts
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (vapiClient) {
        try {
          vapiClient.stop();
        } catch (error) {
          console.error("Error stopping Vapi client:", error);
        }
        setVapiClient(null);
      }
      if (transcriptTimeout) {
        clearTimeout(transcriptTimeout);
      }
      setVapiInitialized(false);
      setVapiReady(false);
    };
  }, []);

  useEffect(() => {
    if (!email) {
      navigate("/interview-landing");
      return;
    }

    const fetchCandidate = async () => {
      try {
        // Build query - if job_id is provided, filter by both email and job_id
        let query = supabase
          .from("qualified_for_final_interview" as any)
          .select('id, name, email, client_custom_questions, ai_generated_questions, interview_status, created_at, job_id')
          .eq("email", email);

        // If job_id is provided, filter by specific job
        if (jobId) {
          query = query.eq("job_id", jobId);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
          console.error("Error fetching candidate:", error);
          toast({
            title: "Error",
            description: "Failed to load interview details.",
            variant: "destructive",
          });
          navigate("/interview-landing");
          return;
        }

        if (!data || data.length === 0) {
          toast({
            title: "Not Found",
            description: jobId 
              ? "No interview scheduled for this email and job." 
              : "No interview scheduled for this email.",
            variant: "destructive",
          });
          navigate("/interview-landing");
          return;
        }

        // Log all matching records for debugging
        console.log(`Found ${data.length} interview record(s)${jobId ? ` for job_id: ${jobId}` : ''}`);

        // Find the first interview that is "Scheduled" (not completed)
        let candidateData = data.find((record: any) => record.interview_status === "Scheduled");

        // If no scheduled interview found, check if all are completed
        if (!candidateData) {
          const allCompleted = data.every((record: any) => record.interview_status === "Completed");

          if (allCompleted) {
            toast({
              title: "All Interviews Completed",
              description: "All interviews for this email have been completed.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Interview Not Available",
              description: "No scheduled interview found for this email.",
              variant: "destructive",
            });
          }
          navigate("/interview-landing");
          return;
        }

        // Set candidate data
        const candidateDataTyped = candidateData as any;
        setCandidate(candidateDataTyped);
      } catch (err) {
        console.error("Unexpected error:", err);
        navigate("/interview-landing");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [email, jobId, navigate, toast]);

  // Recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const requestMediaAccess = async (isRetry: boolean = false): Promise<MediaStream | null> => {
    try {
      // Stop any existing streams first
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }

      setMediaError(null);

      // Request video only first
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // OPTIMIZED: Request audio with settings optimized for speech recognition
      // Disable browser-level noise processing - let Deepgram's model handle it instead
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,      // Deepgram nova-2 handles this better
          noiseSuppression: false,      // Let the AI model handle noise - it's trained for it
          autoGainControl: false,       // Preserve natural speech patterns for recognition
          sampleRate: { ideal: 16000 }, // Optimal sample rate for speech recognition
          // Don't force mono - stereo provides better audio quality and stability
        }
      });

      // Combine both streams
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      // Monitor audio track and attempt automatic recovery
      const audioTrack = combinedStream.getAudioTracks()[0];
      if (audioTrack) {
        // Keep track settings to prevent unwanted stops
        audioTrack.enabled = true;

        audioTrack.onended = async () => {
          console.warn("Audio track ended unexpectedly - attempting recovery");

          // Recover audio if interview is active OR if we're still connecting (loading screen)
          if ((interviewActive || connecting) && !isEndingInterview.current) {
            // Don't show error immediately, try to recover first
            try {
              // Try to get new audio track with optimized settings
              const newAudioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: false,
                  noiseSuppression: false,
                  autoGainControl: false,
                  sampleRate: { ideal: 16000 }
                }
              });

              const newAudioTrack = newAudioStream.getAudioTracks()[0];

              if (newAudioTrack && mediaStream) {
                // Remove old audio track
                const oldAudioTrack = mediaStream.getAudioTracks()[0];
                if (oldAudioTrack) {
                  mediaStream.removeTrack(oldAudioTrack);
                  oldAudioTrack.stop();
                }

                // Add new audio track
                mediaStream.addTrack(newAudioTrack);
                console.log("Audio track recovered successfully");

                toast({
                  title: "Audio Reconnected",
                  description: "Microphone connection restored.",
                });
              }
            } catch (error) {
              console.error("Failed to recover audio track:", error);
              toast({
                title: "Audio Lost",
                description: "Microphone disconnected. Please check your audio device.",
                variant: "destructive",
              });
            }
          }
        };

        // Prevent audio track from being muted by browser
        Object.defineProperty(audioTrack, 'enabled', {
          get: function () { return this._enabled !== false; },
          set: function (value) { this._enabled = value; }
        });
      }

      // Monitor video track for unexpected ending
      const videoTrack = combinedStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.warn("Video track ended unexpectedly");
          if (interviewActive && !isEndingInterview.current) {
            toast({
              title: "Camera Lost",
              description: "Camera disconnected. Please check your camera device.",
              variant: "destructive",
            });
          }
        };
      }

      setCameraOn(true);
      setMicOn(true);
      setMediaStream(combinedStream);
      setRetryAttempts(0);

      // Display video in preview
      const videoElement = document.getElementById("candidate-video") as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = combinedStream;
        videoElement.play().catch(err => {
          console.error("Video play error:", err);
        });
      }

      return combinedStream;

    } catch (error: any) {
      console.error('Media access error:', error);

      let errorMessage = '';

      // Handle specific errors
      if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application. Please close other apps and try again.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Camera access timed out. Please try again.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Please allow camera and microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera settings not supported. Please try a different camera.';
      } else {
        errorMessage = `Failed to access camera/microphone: ${error.message}`;
      }

      setMediaError(errorMessage);

      // Auto-retry once after 2 seconds (only if not already a retry)
      if (!isRetry && retryAttempts === 0) {
        setRetryAttempts(1);
        toast({
          title: "Retrying...",
          description: "Attempting to access camera and microphone again in 2 seconds.",
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
        return await requestMediaAccess(true);
      }

      // Show error toast
      toast({
        title: "Media Access Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  };

  const retryMediaAccess = async () => {
    setRetryAttempts(0);
    await requestMediaAccess(false);
  };

  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const startScreenRecording = async () => {
    try {
      // Request screen recording permission
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      } as DisplayMediaStreamOptions);

      setScreenStream(screenStream);

      // Check if screen stream has audio tracks
      const hasScreenAudio = screenStream.getAudioTracks().length > 0;
      const hasMicAudio = mediaStream && mediaStream.getAudioTracks().length > 0;

      let combinedStream: MediaStream;

      // Only use AudioContext if we have audio tracks to process
      if (hasScreenAudio || hasMicAudio) {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        // Connect screen audio if available
        if (hasScreenAudio) {
          const screenAudioSource = audioContext.createMediaStreamSource(screenStream);
          screenAudioSource.connect(destination);
        }

        // Connect microphone audio if available
        if (hasMicAudio) {
          const micAudioSource = audioContext.createMediaStreamSource(mediaStream!);
          micAudioSource.connect(destination);
        }

        // Create combined stream with screen video and mixed audio
        combinedStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...destination.stream.getAudioTracks(),
        ]);
      } else {
        // No audio available, use screen video only
        combinedStream = new MediaStream([
          ...screenStream.getVideoTracks(),
        ]);

        toast({
          title: "No Audio Detected",
          description: "Recording will proceed with video only. Make sure your microphone is working.",
          variant: "default",
        });
      }

      // Setup MediaRecorder
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          setRecordingChunks(prev => [...prev, event.data]);
        }
      };

      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      // Handle if user stops sharing screen manually
      screenStream.getVideoTracks()[0].onended = () => {
        toast({
          title: "Screen Sharing Stopped",
          description: "Please keep screen sharing active during the interview.",
          variant: "destructive",
        });
      };

      return true;
    } catch (err: any) {
      console.error("Screen recording error:", err);

      // Only show error if user actually denied/cancelled the screen share
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast({
          title: "Screen Recording Required",
          description: "You must share your screen to start the interview.",
          variant: "destructive",
        });
      } else if (err.name === 'NotFoundError') {
        toast({
          title: "Screen Share Error",
          description: "No screen source available for sharing.",
          variant: "destructive",
        });
      } else if (err.name === 'AbortError') {
        // User closed the dialog without selecting - treat as denial
        toast({
          title: "Screen Recording Required",
          description: "You must share your screen to start the interview.",
          variant: "destructive",
        });
      } else {
        // Other errors
        toast({
          title: "Screen Share Error",
          description: `Failed to start screen recording: ${err.message}`,
          variant: "destructive",
        });
      }

      return false;
    }
  };

  const startInterview = async () => {
    if (!candidate) return;

    // Prevent double initialization
    if (vapiInitialized || interviewActive || connecting) {
      console.warn("Interview already started or Vapi already initialized");
      return;
    }

    // Set connecting state
    setConnecting(true);
    setShowConnectingModal(true);
    setAiHasStartedSpeaking(false);

    // Mark that interview has been started (for refresh detection)
    setInterviewStarted(true);

    // Request wake lock to prevent system sleep/suspension during interview
    try {
      if ('wakeLock' in navigator) {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
        console.log("Wake lock acquired - system won't suspend during interview");

        lock.addEventListener('release', () => {
          console.log("Wake lock released");
        });
      }
    } catch (err) {
      console.warn("Wake lock not supported or failed:", err);
    }

    // Request media access first (camera + mic)
    const stream = await requestMediaAccess();
    if (!stream) {
      setConnecting(false);
      setShowConnectingModal(false);
      setInterviewStarted(false);
      return;
    }

    // Request screen recording permission (MANDATORY)
    const screenRecordingStarted = await startScreenRecording();
    if (!screenRecordingStarted) {
      // Stop media stream if screen recording failed
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setCameraOn(false);
        setMicOn(false);
      }
      setConnecting(false);
      setShowConnectingModal(false);
      setInterviewStarted(false);
      return;
    }

    // Extract questions from the database columns (support both new and legacy column names)
    const clientQuestions = (candidate.client_custom_questions || candidate["Question Ask by Client"])?.trim() || "";
    const aiGeneratedQuestions = (candidate.ai_generated_questions || candidate["AI Generated Question"])?.trim() || "";

    // Validate that at least one set of questions exists
    if (!clientQuestions && !aiGeneratedQuestions) {
      toast({
        title: "No Questions Available",
        description: "No interview questions found. Please contact support.",
        variant: "destructive",
      });
      setConnecting(false);
      setShowConnectingModal(false);
      setInterviewStarted(false);
      return;
    }

    try {
      // Create Vapi client if not exists
      let vapi = vapiClient;

      if (!vapi) {
        try {
          console.log('🔄 Initializing VAPI client...');
          vapi = await createVapiClient();
          
          // Verify VAPI client was created successfully
          if (!vapi) {
            throw new Error('VAPI client is null after initialization');
          }
          
          setVapiClient(vapi);
          console.log('✅ VAPI client initialized successfully');
          console.log('🔑 VAPI client type:', typeof vapi);
          console.log('🔑 VAPI client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(vapi)));
        } catch (vapiError: any) {
          console.error('❌ VAPI initialization error:', vapiError);
          console.error('❌ Error stack:', vapiError.stack);
          toast({
            title: "VAPI Initialization Failed",
            description: vapiError.message || "Failed to initialize VAPI client. Please check your API key configuration.",
            variant: "destructive",
          });
          vapiInitializationRef.current = false;
          setConnecting(false);
          setShowConnectingModal(false);
          setInterviewStarted(false);
          // Cleanup media streams on error
          if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
          }
          if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
          }
          return;
        }
      } else {
        console.log('♻️ Reusing existing VAPI client');
      }
      
      // Final validation that we have a valid VAPI client
      if (!vapi) {
        console.error('❌ VAPI client is null - cannot start interview');
        toast({
          title: "VAPI Error",
          description: "VAPI client is not available. Please refresh the page and try again.",
          variant: "destructive",
        });
        vapiInitializationRef.current = false;
        setConnecting(false);
        setShowConnectingModal(false);
        setInterviewStarted(false);
        return;
      }

      // CRITICAL: Set up all event listeners BEFORE calling start()

      const handleVapiError = (error: any) => {
        console.error('❌ VAPI error occurred:', error);
        console.error('❌ Error details:', {
          message: error?.message,
          errorMsg: error?.errorMsg,
          error: error?.error,
          code: error?.code,
          type: error?.type,
          stack: error?.stack,
        });
        
        // Handle specific error cases
        if (error?.error?.message === 'Meeting has ended' ||
          error?.message === 'Meeting has ended' ||
          error?.errorMsg === 'Meeting has ended') {
          console.log('📞 Meeting ended - cleaning up');
          handleInterviewEnd();
          return;
        }

        if (error?.errorMsg?.includes('Local audio track ended') ||
          error?.message?.includes('Local audio track ended')) {
          // Audio track ended - Vapi will retry automatically
          console.log('🎤 Audio track ended - VAPI will retry automatically');
          return;
        }

        // Handle authentication/API key errors
        if (error?.message?.includes('API key') || 
            error?.message?.includes('authentication') ||
            error?.message?.includes('unauthorized') ||
            error?.errorMsg?.includes('API key')) {
          console.error('🔑 VAPI API key error');
          toast({
            title: "VAPI Configuration Error",
            description: "Invalid or missing VAPI API key. Please check your configuration.",
            variant: "destructive",
          });
          setConnecting(false);
          setShowConnectingModal(false);
          handleInterviewEnd();
          return;
        }

        // Handle connection errors
        if (error?.message?.includes('connection') || 
            error?.errorMsg?.includes('connection') ||
            error?.message?.includes('network')) {
          console.error('🔌 Connection error - attempting recovery');
          toast({
            title: "Connection Error",
            description: "Lost connection to interview. Attempting to reconnect...",
            variant: "destructive",
          });
          // Don't end interview immediately - let VAPI retry
          return;
        }

        setConnecting(false);
        setShowConnectingModal(false);
        handleInterviewEnd();

        const errorMessage = error?.message || error?.errorMsg || error?.error?.message || "An error occurred during the interview.";
        toast({
          title: "Interview Error",
          description: errorMessage,
          variant: "destructive",
        });
      };

      // Register event listeners BEFORE start
      // Remove any existing listeners first to prevent duplicates
      try {
        vapi.off("error");
        vapi.off("call-end");
        vapi.off("call-start");
        vapi.off("message");
        vapi.off("speech-start");
        vapi.off("speech-end");
        vapi.off("function-call");
        vapi.off("assistant-speech-start");
        vapi.off("assistant-speech-end");
      } catch (e) {
        // Ignore errors when removing listeners (may not exist)
      }
      
      // Set up all event listeners
      vapi.on("error", handleVapiError);

      const handleCallEnd = () => {
        console.log('📞 VAPI call ended');
        setInterviewActive(false);
        setConnecting(false);
        setVapiReady(false);
        handleInterviewEnd();
      };

      const handleCallStart = () => {
        console.log('📞 VAPI call started successfully');
        console.log('✅ Call state:', {
          callStarted: callStartedRef.current,
          interviewActive: interviewActive,
          vapiReady: vapiReady,
        });
        callStartedRef.current = true;
        setConnecting(false);
        setInterviewActive(true);
        setShowConnectingModal(false);
        setVapiInitialized(true);
        setVapiReady(true);
        toast({
          title: "Interview Started",
          description: "You are now connected to the AI interviewer. The AI will greet you shortly.",
        });
      };

      const handleMessage = (message: any) => {
        console.log('📨 VAPI message received:', {
          type: message.type,
          role: message.role,
        });
        
        if (message.type === "transcript" && message.transcript) {
          const currentTime = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          const speaker: 'AI' | 'HUMAN' = message.role === "assistant" ? 'AI' : 'HUMAN';
          // Transcript received (not logged for privacy)

          if (showConnectingModal) {
            setShowConnectingModal(false);
          }

          if (transcriptTimeout) {
            clearTimeout(transcriptTimeout);
          }

          setPartialTranscript(prev => {
            if (prev && prev.speaker !== speaker) {
              const finalText = prev.text.trim();
              if (finalText) {
                setTranscript(t => [...t, {
                  text: finalText,
                  timestamp: prev.startTime,
                  speaker: prev.speaker
                }]);
              }
              return { text: message.transcript.trim(), speaker, startTime: currentTime };
            }

            if (prev && prev.speaker === speaker) {
              return { ...prev, text: message.transcript.trim(), startTime: prev.startTime };
            }

            return { text: message.transcript.trim(), speaker, startTime: currentTime };
          });

          const timeout = setTimeout(() => {
            setPartialTranscript(prev => {
              if (prev) {
                const finalText = prev.text.trim();
                if (finalText) {
                  setTranscript(t => [...t, {
                    text: finalText,
                    timestamp: prev.startTime,
                    speaker: prev.speaker
                  }]);
                }
                return null;
              }
              return null;
            });
          }, 2000);

          setTranscriptTimeout(timeout);
        }
      };

      vapi.on("call-end", handleCallEnd);
      vapi.on("call-start", handleCallStart);
      vapi.on("message", handleMessage);

      vapi.on("speech-start", (data: any) => {
        console.log('🗣️ Speech started:', data);
        setIsSpeaking(true);
        if (partialTranscript && partialTranscript.speaker === 'HUMAN') {
          setTranscript(prev => [...prev, {
            text: partialTranscript.text.trim(),
            timestamp: partialTranscript.startTime,
            speaker: 'HUMAN'
          }]);
          setPartialTranscript(null);
        }
      });

      vapi.on("speech-end", (data: any) => {
        console.log('🔇 Speech ended:', data);
        setIsSpeaking(false);
        if (partialTranscript && partialTranscript.speaker === 'AI') {
          setTranscript(prev => [...prev, {
            text: partialTranscript.text.trim(),
            timestamp: partialTranscript.startTime,
            speaker: 'AI'
          }]);
          setPartialTranscript(null);
        }
      });

      // Add function-call event listener to see if AI is responding
      vapi.on("function-call", (data: any) => {
        console.log('🔧 Function call:', data);
      });

      // Add assistant-speech-start to detect when AI starts speaking
      vapi.on("assistant-speech-start", (data: any) => {
        console.log('🤖 AI started speaking:', data);
        setIsSpeaking(true);
      });

      vapi.on("assistant-speech-end", (data: any) => {
        console.log('🤖 AI finished speaking:', data);
        setIsSpeaking(false);
      });

      const sessionContext: VapiSessionContext = {
        candidate_name: candidate.name,
        candidate_email: candidate.email,
        client_questions: clientQuestions,
        ai_generated_questions: aiGeneratedQuestions,
      };

      console.log('🎤 Starting VAPI call with media stream...');
      console.log('🎙️ Media stream state:', {
        hasStream: !!mediaStream,
        audioTracks: mediaStream?.getAudioTracks().length || 0,
        videoTracks: mediaStream?.getVideoTracks().length || 0,
        audioTrackEnabled: mediaStream?.getAudioTracks()[0]?.enabled || false,
        audioTrackReadyState: mediaStream?.getAudioTracks()[0]?.readyState || 'N/A',
      });

      // Format questions for better readability in prompt
      const formattedClientQuestions = clientQuestions 
        ? clientQuestions.split('\n').filter(q => q.trim()).map((q, i) => `${i + 1}. ${q.trim()}`).join('\n')
        : "No client questions provided.";
      
      const formattedAIGeneratedQuestions = aiGeneratedQuestions
        ? aiGeneratedQuestions.split('\n').filter(q => q.trim()).map((q, i) => `${i + 1}. ${q.trim()}`).join('\n')
        : "No AI-generated questions provided.";

      // Create first message for AI to speak immediately
      const firstMessage = `Hello ${sessionContext.candidate_name}, welcome to your interview. I will be asking you a series of questions today. Let's begin.`;

      // Start the call with media stream
      const vapiConfig: any = {
        name: "AI Interview Assistant",
        // CRITICAL: Make AI speak first
        firstMessageMode: "assistant-speaks-first",
        firstMessage: firstMessage,
        // Configure speaking behavior
        startSpeakingPlan: {
          waitSeconds: 0.5,
          smartEndpointingEnabled: true,
        },
        transcriber: {
          provider: "deepgram",
          model: "nova-2-general",
          language: "en-US",
          smartFormat: true,
          endpointing: 300, // Reduced for better responsiveness
        },
        silenceTimeoutSeconds: 60,
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an AI Interview Assistant conducting a professional voice-based interview.

IMPORTANT: You MUST use ONLY the questions provided below from the database. Do not generate any new questions.

=== CANDIDATE INFORMATION ===
- Name: ${sessionContext.candidate_name}
- Email: ${sessionContext.candidate_email}

=== INTERVIEW QUESTIONS ===

${clientQuestions ? `CLIENT QUESTIONS:
${formattedClientQuestions}

` : ''}${aiGeneratedQuestions ? `AI GENERATED QUESTIONS:
${formattedAIGeneratedQuestions}

` : ''}=== INTERVIEW PROTOCOL ===

1. GREETING (START IMMEDIATELY):
   - As soon as the call starts, greet the candidate: "${firstMessage}"
   - You MUST speak first. Do NOT wait for the candidate to speak.
   - Speak clearly and at a normal pace.

2. QUESTION SEQUENCE:
   ${clientQuestions ? `- First, ask ALL questions from "CLIENT QUESTIONS" one by one in order.` : ""}
   ${aiGeneratedQuestions ? `- Then, ask ALL questions from "AI GENERATED QUESTIONS" one by one in order.` : ""}
   - Ask ONE question at a time and wait for the candidate's complete answer.
   - After each answer, acknowledge briefly with: "Thank you" or "I understand" or "Noted."
   - Then proceed to the next question.

3. STRICT RULES:
   - DO NOT create, add, or improvise any questions beyond what is provided above.
   - DO NOT provide feedback, evaluation, or opinions on answers.
   - DO NOT engage in casual conversation beyond the interview structure.
   - If the candidate asks unrelated questions, politely redirect: "Let's focus on the interview questions."
   - Keep your responses brief and professional.

4. CLOSING:
   - After all questions are complete, conclude with: "Thank you ${sessionContext.candidate_name}. This concludes your interview. Have a good day."`
            }
          ]
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer",
          speed: 1.0,
        },
      };

      // Ensure audio track is enabled before starting VAPI
      if (mediaStream) {
        const audioTrack = mediaStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = true;
          console.log('✅ Audio track enabled and ready:', {
            enabled: audioTrack.enabled,
            readyState: audioTrack.readyState,
            muted: audioTrack.muted,
          });
        } else {
          console.error('❌ No audio track found in media stream');
          toast({
            title: "Audio Error",
            description: "No microphone audio detected. Please check your microphone permissions.",
            variant: "destructive",
          });
        }
      } else {
        console.error('❌ Media stream not available when starting VAPI');
        toast({
          title: "Media Error",
          description: "Camera/microphone access not available. Please refresh and try again.",
          variant: "destructive",
        });
      }

      console.log('🚀 Calling vapi.start()...');
      console.log('📋 VAPI Config (sanitized):', {
        name: vapiConfig.name,
        firstMessageMode: vapiConfig.firstMessageMode,
        model: vapiConfig.model.model,
        voiceProvider: vapiConfig.voice.provider,
        voiceId: vapiConfig.voice.voiceId,
        hasSystemMessage: !!vapiConfig.model.messages[0]?.content,
        startSpeakingPlan: vapiConfig.startSpeakingPlan,
        hasClientQuestions: !!clientQuestions,
        hasAIGeneratedQuestions: !!aiGeneratedQuestions,
      });
      
      // Validate questions are present
      if (!clientQuestions && !aiGeneratedQuestions) {
        console.error('❌ No questions available for interview');
        toast({
          title: "Configuration Error",
          description: "No interview questions found. Please ensure questions are set in the database.",
          variant: "destructive",
        });
        vapiInitializationRef.current = false;
        setConnecting(false);
        setShowConnectingModal(false);
        setInterviewStarted(false);
        return;
      }
      
      // Start VAPI call with error handling
      try {
        await vapi.start(vapiConfig);
        console.log('✅ vapi.start() called successfully');
      } catch (startError: any) {
        console.error('❌ Error calling vapi.start():', startError);
        console.error('❌ Start error details:', {
          message: startError?.message,
          error: startError?.error,
          stack: startError?.stack,
        });
        
        toast({
          title: "Failed to Start Interview",
          description: startError?.message || "Could not start the VAPI call. Please check your configuration and try again.",
          variant: "destructive",
        });
        
        vapiInitializationRef.current = false;
        setConnecting(false);
        setShowConnectingModal(false);
        setInterviewStarted(false);
        
        // Cleanup on error
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
        }
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
          setScreenStream(null);
        }
        return;
      }
      
      // VAPI SDK v2.5.0 should automatically use the browser's default audio input
      // But we can try to set it explicitly if the method exists
      if (mediaStream) {
        const audioTrack = mediaStream.getAudioTracks()[0];
        if (audioTrack && audioTrack.readyState === 'live') {
          console.log('✅ Audio track is live and ready for VAPI');
          
          // Try to set local audio stream if method exists (for newer SDK versions)
          if (typeof (vapi as any).setLocalAudioStream === 'function') {
            try {
              (vapi as any).setLocalAudioStream(mediaStream);
              console.log('✅ Local audio stream set on VAPI client');
            } catch (err) {
              console.warn('⚠️ Could not set local audio stream:', err);
            }
          } else {
            console.log('ℹ️ VAPI will use browser default audio input');
          }
        } else {
          console.warn('⚠️ Audio track not ready:', {
            readyState: audioTrack?.readyState,
            enabled: audioTrack?.enabled,
          });
        }
      }

      // Wait for call to actually start (max 10 seconds)
      let callStartWaitTime = 0;
      const callStartInterval = setInterval(() => {
        callStartWaitTime += 100;
        if (callStartedRef.current || callStartWaitTime >= 10000) {
          clearInterval(callStartInterval);
          if (!callStartedRef.current) {
            console.warn('⚠️ Call start timeout - proceeding anyway');
            setInterviewActive(true);
            setConnecting(false);
            setVapiInitialized(true);
            setShowConnectingModal(false);
            // Show a warning toast
            toast({
              title: "Connection Warning",
              description: "Interview started but connection may be delayed. Please wait for the AI to greet you.",
              variant: "default",
            });
          } else {
            console.log('✅ Call started confirmed via event');
          }
        }
      }, 100);

    } catch (error: any) {
      // Failed to start interview
      vapiInitializationRef.current = false;
      setConnecting(false);
      setShowConnectingModal(false);
      setVapiInitialized(false);
      setInterviewStarted(false);
      handleInterviewEnd();

      let errorMessage = "Failed to start the interview. Please try again.";
      if (error?.message?.includes("400")) {
        errorMessage = "Invalid request to Vapi. Please check your API configuration.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Interview Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleInterviewEnd = async () => {
    // Stop recording and wait for final chunks
    if (mediaRecorder && isRecording) {
      try {
        await new Promise<void>((resolve) => {
          const handleStop = () => {
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
      } catch (err) {
        // Error stopping media recorder
        setIsRecording(false);
      }
    }

    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      } catch (err) {
        // Error stopping media stream
      }
    }

    if (screenStream) {
      try {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      } catch (err) {
        // Error stopping screen stream
      }
    }

    setCameraOn(false);
    setMicOn(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExit = () => {
    if (isUploading) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for the recording to finish uploading before exiting.",
        variant: "destructive",
      });
      return;
    }

    if (interviewActive) {
      toast({
        title: "Interview Active",
        description: "Please end the interview before exiting.",
        variant: "destructive",
      });
      return;
    }

    navigate("/interview-landing");
  };

  const endInterview = async () => {
    isEndingInterview.current = true;
  
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        console.log("Wake lock released");
      } catch (error) {
        console.error("Error releasing wake lock:", error);
      }
    }
  
    if (audioMonitorIntervalRef.current) {
      clearInterval(audioMonitorIntervalRef.current);
      audioMonitorIntervalRef.current = null;
    }
  
    if (vapiClient) {
      try {
        vapiClient.stop();
      } catch (error) {
        console.error("Error stopping Vapi:", error);
      }
      setVapiClient(null);
      setVapiInitialized(false);
      setVapiReady(false);
    }
  
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  
    setInterviewActive(false);
    setCameraOn(false);
    setMicOn(false);
    setIsSpeaking(false);
  
    if (candidate) {
      setIsUploading(true);
  
      try {
        let recordingUrl = null;

        // Upload Screen Recording
        if (recordingChunks.length > 0) {
          console.log("Starting screen recording upload...");
          const recordingBlob = new Blob(recordingChunks, { type: "video/webm" });
          const fileName = `${candidate.email}_${Date.now()}.webm`;
  
          const { data, error: uploadError } = await supabase.storage
            .from("interview-recordings")
            .upload(fileName, recordingBlob, {
              contentType: "video/webm",
              upsert: false,
            });
  
          if (uploadError) {
            console.error("Screen recording upload error:", uploadError);
            toast({
              title: "Upload Error",
              description: "Failed to upload screen recording. Please try again.",
              variant: "destructive",
            });
          } else {
            console.log("Screen recording uploaded successfully");
            
            const { data: publicUrlData } = supabase.storage
              .from("interview-recordings")
              .getPublicUrl(fileName);
  
            recordingUrl = publicUrlData.publicUrl;
            console.log("Screen recording uploaded successfully");

            // -------------------------------------------------------------------
            // UPDATE SCREEN RECORDING USING PUBLIC API
            // -------------------------------------------------------------------
            try {
              const response = await publicApi.updateInterviewRecordingPublic(candidate.id, {
                screen_recording_url: recordingUrl,
              });

              if (response) {
                console.log("Screen recording URL saved to database");
                setUploadProgress(100);
              }
            } catch (recordingUpdateError: any) {
              console.error("Error updating screen recording URL:", recordingUpdateError);
              console.error("Error details:", {
                message: recordingUpdateError?.message,
                response: recordingUpdateError?.response,
                data: recordingUpdateError?.data,
              });
            }
          }
        } else {
          console.warn("No recording chunks available to upload");
        }
  
        // Save pending partial transcript
        if (partialTranscript) {
          setTranscript(prev => [
            ...prev,
            {
              text: partialTranscript.text.trim(),
              timestamp: partialTranscript.startTime,
              speaker: partialTranscript.speaker,
            },
          ]);
        }
  
        // Build Final Transcript
        const fullTranscript =
          transcript.length > 0
            ? transcript
                .map(t => `[${t.timestamp}] [${t.speaker}]: ${t.text}`)
                .join("\n")
            : "";

        // -------------------------------------------------------------------
        // FINAL UPDATE: interview_status + Transcript USING PUBLIC API
        // -------------------------------------------------------------------
        try {
          // Update transcript if we have one
          if (fullTranscript) {
            try {
              await publicApi.updateInterviewRecordingPublic(candidate.id, {
                interview_transcript: fullTranscript,
              });
              console.log("Interview transcript saved successfully");
            } catch (transcriptError: any) {
              console.error("Error updating interview transcript:", transcriptError);
            }
          }

          // Update interview status
          const statusResponse = await publicApi.updateInterviewStatusPublic(candidate.id, "Completed");
          
          if (statusResponse) {
            console.log("Interview status updated successfully");
            toast({
              title: "Interview Completed",
              description: recordingUrl
                ? "Recording and transcript saved successfully."
                : "Interview completed. Recording upload may have failed.",
            });
          }
        } catch (updateError: any) {
          console.error("Error updating interview status:", updateError);
          console.error("Error details:", {
            message: updateError?.message,
            response: updateError?.response,
            data: updateError?.data,
            status: updateError?.status,
          });
          toast({
            title: "Warning",
            description: "Interview ended but status could not be updated. Please check the console for details.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error saving interview data:", error);
        toast({
          title: "Warning",
          description: "Interview ended but data could not be saved.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setRecordingChunks([]);
        setShowThankYou(true);
  
        setTimeout(() => {
          navigate("/interview-landing");
        }, 5000);
      }
    }
  };
  
  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading interview details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  // Thank You Screen
  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-full bg-primary/10 p-6">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Thank You!</h1>
                <p className="text-xl text-muted-foreground">
                  Your interview has been completed successfully.
                </p>
              </div>
              <div className="space-y-2 text-center max-w-md">
                <p className="text-muted-foreground">
                  Thank you for taking the time to participate in this interview, {candidate.name}.
                </p>
                <p className="text-muted-foreground">
                  Your responses have been recorded and will be reviewed by our team.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Redirecting you back to the landing page in a few seconds...
                </p>
              </div>
              <Button
                onClick={() => navigate("/interview-landing")}
                size="lg"
                className="mt-4"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-subtle flex flex-col overflow-hidden">
      {/* Header - Compact */}
      <Card className="rounded-none border-x-0 border-t-0 shadow-sm">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="text-lg">Interview Room</CardTitle>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <User className="h-3 w-3" />
                  <span>{candidate.name} ({candidate.email})</span>
                </div>
              </div>
              <InterviewBadge status={interviewActive ? "active" : "scheduled"} />
            </div>
            <Button
              onClick={handleExit}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isUploading}
            >
              <LogOut className="h-4 w-4" />
              Exit
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content - Video and Transcript Side by Side */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Candidate Video - Left */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Camera</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full h-full bg-muted rounded-lg overflow-hidden">
              <video
                id="candidate-video"
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <VideoOff className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transcript - Right (replacing AI Avatar) */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Live Transcript
              </CardTitle>
              {transcript.length > 0 && (
                <span className="text-xs text-muted-foreground font-medium">
                  {transcript.length} {transcript.length === 1 ? 'message' : 'messages'}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-hidden">
            <div
              ref={transcriptContainerRef}
              className="h-full overflow-y-auto pr-2 scroll-smooth"
              style={{ 
                scrollBehavior: 'smooth',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
              }}
            >
              {transcript.length === 0 && !partialTranscript ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-3">
                    <Sparkles className="h-6 w-6 text-primary/60" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Your interview transcript will appear here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All conversation will be displayed here in real-time once the interview begins.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transcript.map((entry, idx) => (
                    <div 
                      key={`${entry.timestamp}-${idx}`}
                      className={`group flex gap-3 p-3 rounded-lg transition-all duration-200 ${
                        entry.speaker === 'AI' 
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500' 
                          : 'bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          entry.speaker === 'AI' 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                            : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        }`}>
                          {entry.speaker === 'AI' ? (
                            <Sparkles className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${
                            entry.speaker === 'AI' ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'
                          }`}>
                            {entry.speaker === 'AI' ? 'Interviewer' : candidate.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {entry.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Show partial transcript as it's being spoken */}
                  {partialTranscript && (
                    <div 
                      className={`group flex gap-3 p-3 rounded-lg border-dashed ${
                        partialTranscript.speaker === 'AI' 
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 border-dashed' 
                          : 'bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 border-dashed'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          partialTranscript.speaker === 'AI' 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                            : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        }`}>
                          {partialTranscript.speaker === 'AI' ? (
                            <Sparkles className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${
                            partialTranscript.speaker === 'AI' ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'
                          }`}>
                            {partialTranscript.speaker === 'AI' ? 'Interviewer' : candidate.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {partialTranscript.startTime}
                          </span>
                          <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                            <span className="inline-block w-1 h-1 bg-current rounded-full animate-pulse" />
                            speaking...
                          </span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {partialTranscript.text}
                          <span className="inline-block w-1.5 h-3 bg-current animate-pulse ml-1 align-middle" />
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls - Fixed at Bottom */}
      <Card className="rounded-none border-x-0 border-b-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-col items-center gap-3">
            {/* Media Error Display */}
            {mediaError && !interviewActive && (
              <div className="w-full max-w-2xl">
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="text-xs font-medium text-destructive mb-2">{mediaError}</div>
                  <div className="flex gap-2">
                    <Button
                      onClick={retryMediaAccess}
                      size="sm"
                      variant="outline"
                    >
                      Retry
                    </Button>
                    <Button
                      onClick={() => setMediaError(null)}
                      size="sm"
                      variant="ghost"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                <span className="text-xs font-medium">Recording</span>
                <span className="text-xs font-mono">{formatDuration(recordingDuration)}</span>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="w-full max-w-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">Uploading recording...</span>
                  <span className="text-xs font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Please do not close this page until upload is complete
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {!interviewActive ? (
                <Button
                  onClick={startInterview}
                  size="lg"
                  className="min-w-40"
                  disabled={isUploading || vapiInitialized}
                >
                  Start Interview
                </Button>
              ) : (
                <>
                  <Button
                    onClick={toggleCamera}
                    size="lg"
                    variant="outline"
                    className="gap-2"
                    disabled={isUploading}
                  >
                    {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    {cameraOn ? "Camera On" : "Camera Off"}
                  </Button>
                  <Button
                    onClick={toggleMic}
                    size="lg"
                    variant="outline"
                    className="gap-2"
                    disabled={isUploading}
                  >
                    {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    {micOn ? "Mic On" : "Mic Off"}
                  </Button>
                  <Button
                    onClick={endInterview}
                    size="lg"
                    variant="destructive"
                    className="min-w-40"
                    disabled={isUploading}
                  >
                    {isUploading ? "Saving..." : "End Interview"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connecting/Loading Modal */}
      <Dialog open={showConnectingModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-center">Connecting to Interview</DialogTitle>
            <DialogDescription className="text-center">
              Please wait while we set up your interview session...
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Initializing interview room...</p>
              <p className="text-xs text-muted-foreground">
                {connecting && !isRecording && "Requesting permissions..."}
                {isRecording && !aiHasStartedSpeaking && "Recording started. Waiting for AI to begin..."}
                {aiHasStartedSpeaking && "AI is connecting..."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewRoom;
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Volume2, VolumeX } from "lucide-react";
import BookDemoDialog from "@/components/BookDemoDialog";

const Hero = () => {
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDemoClick = () => {
    setShowDemoDialog(true);
  };

  // Use the first video as background
  const videoSrc = "/assets/videos/grok-video-12196722-6e18-4f59-9045-2a40aee355b7.mp4";

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay was prevented, which is fine
      });
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-16">
      {/* Video Background with Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80 transition-colors duration-300" />
        <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-40 transition-opacity duration-300" />
      </div>

      {/* Video Controls */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-24 right-4 md:top-20 md:right-8 z-20 p-3 rounded-full bg-background/95 backdrop-blur-sm border-2 border-border/60 hover:bg-background hover:border-primary/40 transition-all hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
        aria-label={isMuted ? "Unmute video" : "Mute video"}
        style={{ willChange: 'transform' }}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-foreground" />
        ) : (
          <Volume2 className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 md:py-0">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground">
              Solve Your Hiring Challenges
            </span>
          </div>

          {/* Main Headline - Mobile Optimized */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight px-2 sm:px-0 drop-shadow-lg">
            Stop Wasting Time on{" "}
            <span className="text-gradient animate-glow-pulse">Unqualified Candidates</span>
            <br />
            Find the Right Talent{" "}
            <span className="text-gradient">Faster</span>
          </h1>

          {/* Subheading - Mobile Optimized */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/90 max-w-2xl mx-auto px-2 sm:px-4 font-medium drop-shadow-md">
            Automatically screen resumes, conduct interviews, and rank candidates. Reduce hiring time by 80% while finding better matches.
          </p>

          {/* CTA Buttons - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-4 sm:px-0">
            <Button 
              variant="default" 
              size="lg" 
              className="w-full sm:w-auto min-h-touch bg-gradient-to-r from-primary to-accent hover:opacity-90 group text-base sm:text-lg px-6 sm:px-8"
              onClick={() => {
                const event = new CustomEvent('showRoleSelection');
                window.dispatchEvent(event);
              }}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto min-h-touch group text-base sm:text-lg px-6 sm:px-8 bg-background/80 backdrop-blur-sm border-2 hover:bg-background shadow-lg"
              onClick={handleDemoClick}
            >
              <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Book a Demo
            </Button>
          </div>

          {/* Trust Indicators - Mobile Optimized */}
          <div className="pt-8 sm:pt-12 space-y-4">
            <p className="text-xs sm:text-sm text-foreground/80 px-4 font-medium">
              Trusted by leading companies worldwide
            </p>
          </div>
          
        </div>
      </div>

      {/* Decorative Elements */}
      
      <div 
      className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-background to-transparent z-10" 
      />
  
      {/* Book Demo Dialog */}

      <BookDemoDialog 
        open={showDemoDialog} 
        onOpenChange={setShowDemoDialog}
        onSuccess={() => {
          // Optional: Handle success (e.g., show thank you message)
        }}
      />
     
    </section>
  );
};

export default Hero;
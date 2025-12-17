import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

const videos = [
  {
    src: "/assets/videos/grok-video-12196722-6e18-4f59-9045-2a40aee355b7.mp4",
    title: "Platform Overview",
    description: "Discover how our AI-powered hiring platform transforms recruitment",
  },
  {
    src: "/assets/videos/grok-video-6320d6bb-d7fa-4c8d-85e5-9bd1b15322f1.mp4",
    title: "Smart Screening",
    description: "Watch how we automatically evaluate and rank candidates",
  },
  {
    src: "/assets/videos/grok-video-721c824a-283f-4c4f-8c17-2740c8eb5588.mp4",
    title: "Interview Automation",
    description: "See our AI interview system in action",
  },
  {
    src: "/assets/videos/grok-video-0396edfa-9b8d-4367-8442-01836d5d31b7.mp4",
    title: "Success Stories",
    description: "Learn how companies are finding better talent faster",
  },
];

const VideoShowcase = () => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<{ [key: number]: boolean }>({
    0: true,
    1: true,
    2: true,
    3: true,
  });
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  const togglePlay = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (playingIndex === index) {
      video.pause();
      setPlayingIndex(null);
    } else {
      Object.values(videoRefs.current).forEach((v) => {
        if (v && v !== video) {
          v.pause();
        }
      });
      video.play();
      setPlayingIndex(index);
    }
  };

  const toggleMute = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted((prev) => ({ ...prev, [index]: newMutedState }));
  };

  const handleFullscreen = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  return (
    <section id="videos" className="py-24 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Watch Our <span className="text-gradient">Platform</span> in Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience the power of AI-driven recruitment through these engaging video demonstrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {videos.map((video, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] transition-all animate-fade-in-up hover-scale"
              style={{ animationDelay: `${index * 100}ms`, willChange: 'transform, box-shadow' }}
            >
              <div className="relative aspect-video bg-black/50">
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={video.src}
                  className="w-full h-full object-cover"
                  loop
                  muted={isMuted[index] ?? true}
                  playsInline
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    variant="default"
                    className="rounded-full w-16 h-16 bg-primary/90 backdrop-blur-sm hover:bg-primary hover:scale-110 transition-all shadow-xl"
                    onClick={() => togglePlay(index)}
                  >
                    {playingIndex === index ? (
                      <Pause className="h-8 w-8 text-primary-foreground" />
                    ) : (
                      <Play className="h-8 w-8 text-primary-foreground ml-1" />
                    )}
                  </Button>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={() => toggleMute(index)}
                    >
                      {isMuted[index] ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={() => handleFullscreen(index)}
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
                <p className="text-muted-foreground">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;


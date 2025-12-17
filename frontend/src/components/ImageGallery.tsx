import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const images = [
  "/assets/images/Whisk_2962335e0e6a7c39b604ba64508b1b22dr.jpeg",
  "/assets/images/Whisk_2e21ab75a1b8b44bd6a4c01ca5895c48dr.jpeg",
  "/assets/images/Whisk_38f1d53eec2f8868acc426bad963b612dr.jpeg",
  "/assets/images/Whisk_579a33e11562e8e91524ff66af317885dr.jpeg",
  "/assets/images/Whisk_5e8549d621b43c48b8f423b6c1f15647dr.jpeg",
  "/assets/images/Whisk_ade3882dbc370938ce54daafa6db481cdr.jpeg",
  "/assets/images/Whisk_bc8b000a7975f2382ee4aac6879412bcdr.jpeg",
  "/assets/images/Whisk_e5e17962bb9e4afa16d4e619e41878aedr.jpeg",
  "/assets/images/Whisk_f416e3b7efee4c2800b4492cc3bda3c5dr.jpeg",
];

const ImageGallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openImage = (index: number) => {
    setSelectedImage(index);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return;
    
    if (direction === "prev") {
      setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
    } else {
      setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1);
    }
  };

  return (
    <section id="gallery" className="py-24 bg-gradient-to-b from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Our <span className="text-gradient">Gallery</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Explore our platform through these beautiful visuals showcasing our features and capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer animate-fade-in-up hover-scale"
              style={{ animationDelay: `${index * 50}ms`, willChange: 'transform' }}
              onClick={() => openImage(index)}
            >
              <img
                src={image}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="font-semibold text-sm">View Full Image</p>
                </div>
              </div>
              <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 transition-all duration-300 rounded-2xl" />
            </div>
          ))}
        </div>

        <Dialog open={selectedImage !== null} onOpenChange={closeImage}>
          <DialogContent className="max-w-7xl w-full p-0 bg-transparent border-none">
            {selectedImage !== null && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={closeImage}
                >
                  <X className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={() => navigateImage("prev")}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={() => navigateImage("next")}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                <img
                  src={images[selectedImage]}
                  alt={`Gallery image ${selectedImage + 1}`}
                  className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                />
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full">
                  <p className="text-sm font-medium">
                    {selectedImage + 1} / {images.length}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default ImageGallery;


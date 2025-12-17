import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import ImageGallery from "@/components/ImageGallery";
import VideoShowcase from "@/components/VideoShowcase";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import PageBackground from "@/components/PageBackground";
import Chatbot from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, User, ArrowRight, Users, Check } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";

const Index = () => {
  const backgroundImage = "/assets/images/Whisk_a8aa9ba5492b1a7b18f4b497cf89778adr.jpeg";
  const navigate = useNavigate();
  const { selectedRole, setSelectedRole } = useRole();
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const handleRoleSelection = (role: 'recruiter' | 'applicant') => {
    setSelectedRole(role);
    // Use navigateToRole from context for consistent navigation
    if (role === 'recruiter') {
      navigate('/recruiter/signup');
    } else {
      navigate('/applicant/signup');
    }
  };

  // Listen for role selection trigger from Hero/Navbar
  useEffect(() => {
    const handleShowRoleSelection = () => setShowRoleSelection(true);
    window.addEventListener('showRoleSelection', handleShowRoleSelection);
    return () => window.removeEventListener('showRoleSelection', handleShowRoleSelection);
  }, []);

  return (
    <div className="min-h-screen relative">
      <PageBackground imagePath={backgroundImage} />
      <div className="relative z-10">
        <Navbar />
        
        {/* Role Selection Overlay - Show by default if no role selected */}
        {showRoleSelection && (
          <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Welcome to AI Hiring
                </h2>
                <p className="text-lg text-muted-foreground">Choose your role to get started</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card 
                  className="cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-xl border-2 hover:border-primary group"
                  onClick={() => handleRoleSelection('recruiter')}
                >
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <Briefcase className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-2xl">For Recruiters</CardTitle>
                    <CardDescription className="text-base">
                      Post jobs, manage candidates, and hire smarter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                      <li className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Post and manage job openings</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>AI-powered candidate screening</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Automated interview scheduling</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Advanced analytics dashboard</span>
                      </li>
                    </ul>
                    <Button 
                      variant="default" 
                      size="lg"
                      className="w-full group-hover:bg-primary/90"
                      onClick={() => handleRoleSelection('recruiter')}
                    >
                      Get Started as Recruiter
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-xl border-2 hover:border-primary group"
                  onClick={() => handleRoleSelection('applicant')}
                >
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-accent to-primary mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-2xl">For Applicants</CardTitle>
                    <CardDescription className="text-base">
                      Find jobs, apply easily, and grow your career
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                      <li className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Browse community job postings</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Easy one-click applications</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Track application status</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>Connect with recruiters</span>
                      </li>
                    </ul>
                    <Button 
                      variant="default" 
                      size="lg"
                      className="w-full group-hover:bg-primary/90"
                      onClick={() => handleRoleSelection('applicant')}
                    >
                      Get Started as Applicant
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {selectedRole && (
                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowRoleSelection(false);
                    }}
                  >
                    Continue Browsing
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Landing Page Content - Always visible by default */}
        <Hero />
        <Features />
        <HowItWorks />
        <ImageGallery />
        <VideoShowcase />
        <Pricing />
        <FAQ />
        <Footer />
      </div>
      <Chatbot />
    </div>
  );
};

export default Index;

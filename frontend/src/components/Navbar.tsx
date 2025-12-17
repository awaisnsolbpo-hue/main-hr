import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Briefcase } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRole } from "@/contexts/RoleContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const isActive = (path: string) => {
    if (path.startsWith("/#")) {
      // For hash links, check if we're on the home page
      return location.pathname === "/";
    }
    // For regular paths, check exact match or starts with
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    if (path.startsWith("/#")) {
      navigate("/");
      setTimeout(() => {
        const id = path.replace("/#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      navigate(path);
    }
  };

  const menuItems = [
    { label: "Features", path: "/#features" },
    { label: "How It Works", path: "/#how-it-works" },
    { label: "Community", path: "/community" },
    { label: "Pricing", path: "/#pricing" },
    { label: "FAQ", path: "/#faq" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-150 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-[var(--shadow-elegant)]"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 z-10 transition-colors duration-150"
            onClick={() => setIsOpen(false)}
          >
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary via-primary/95 to-accent shadow-sm hover:shadow-md transition-shadow duration-150">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              AI Hiring
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`text-sm font-semibold transition-all duration-150 rounded-xl px-4 py-2 ${
                  isActive(item.path) 
                    ? "text-primary bg-gradient-to-r from-primary/10 to-accent/10 shadow-sm font-bold scale-[1.02]" 
                    : "text-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 hover:scale-[1.02]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button 
              variant="hero" 
              size="default"
              onClick={() => navigate('/recruiter/login')}
            >
              Recruiter
            </Button>
            <Button 
              variant="outline" 
              size="default"
              onClick={() => navigate('/applicant/login')}
              className="border-2"
            >
              Applicant
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="min-h-touch min-w-touch"
                aria-label="Toggle menu"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </SheetTrigger>

            <SheetContent 
              side="right" 
              className="w-[85vw] sm:w-[400px] pt-12"
            >
              <SheetHeader className="mb-8">
                <SheetTitle className="text-left">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent">
                      <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      AI Hiring
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Menu Items */}
              <div className="flex flex-col space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`text-left py-4 px-5 rounded-xl text-base font-semibold transition-all duration-150 min-h-touch ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-primary/10 to-accent/10 text-primary shadow-sm font-bold"
                        : "text-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                {/* Mobile CTA Buttons */}
                <div className="flex flex-col space-y-3 pt-8 border-t mt-4">
                  <Button
                    size="lg"
                    variant="hero"
                    onClick={() => handleNavigation("/recruiter/login")}
                    className="w-full min-h-touch text-base"
                  >
                    Recruiter
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNavigation("/applicant/login")}
                    className="w-full min-h-touch text-base border-2"
                  >
                    Applicant
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

    </nav>
  );
};

export default Navbar;
import { FileText, Users, Brain, Award } from "lucide-react";
import { IconContainer } from "@/components/IconContainer";

const steps = [
  {
    number: "01",
    title: "Post Your Job",
    description: "Create detailed job postings or import from LinkedIn. Share public links to reach candidates and expand your talent pool.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Collect Applications",
    description: "Receive applications through multiple channels - direct uploads, email integration, or public links. All resumes are automatically organized.",
    icon: Users,
  },
  {
    number: "03",
    title: "AI Evaluates Candidates",
    description: "Our system analyzes each resume against your requirements, scoring candidates on skills, experience, and qualifications. Top candidates are automatically identified.",
    icon: Brain,
  },
  {
    number: "04",
    title: "Review Top Talent",
    description: "Access a ranked shortlist with detailed analysis, interview transcripts, and performance scores to make informed hiring decisions.",
    icon: Award,
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-foreground/90 font-semibold">
            A streamlined four-step process that transforms how you find and evaluate talent. From job posting to final selection, we handle the heavy lifting.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group animate-fade-in-up hover-scale"
              style={{ animationDelay: `${index * 100}ms`, willChange: 'transform' }}
            >
              <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] transition-all border border-border h-full relative overflow-hidden">
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:via-primary/5 group-hover:to-accent/5 transition-all duration-500"></div>
                
                <div className="relative z-10">
                {/* Step Number */}
                  <div className="text-5xl font-bold text-primary/20 mb-4 group-hover:text-primary/30 transition-colors">
                  {step.number}
                </div>

                {/* Icon */}
                  <div className="mb-6">
                    <IconContainer size="lg" variant="default" className="group-hover:scale-110 transition-transform">
                      <step.icon className="h-7 w-7" />
                    </IconContainer>
                  </div>

                {/* Content */}
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-foreground/90 font-medium leading-relaxed">{step.description}</p>
                </div>

                {/* Connector Line (hidden on mobile and last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 w-8 h-0.5 bg-gradient-to-r from-primary to-accent transform translate-x-full -translate-y-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />
                )}

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-500 rounded-bl-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

import { 
  Brain, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  Clock,
  FileSearch,
  Video,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconContainer } from "@/components/IconContainer";

const features = [
  {
    icon: FileSearch,
    title: "AI-Powered Resume Screening",
    description: "Automatically analyze and score resumes against job requirements. Our AI extracts key information, matches skills, and ranks candidates based on relevance and qualifications.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Video,
    title: "Automated Video Interviews",
    description: "Conduct intelligent video interviews with AI interviewers. Ask tailored questions based on candidate profiles, get real-time transcripts, and evaluate responses automatically.",
    color: "from-primary to-accent"
  },
  {
    icon: Brain,
    title: "Smart Candidate Ranking",
    description: "Get AI-generated candidate scores based on skills, experience, and interview performance. Our algorithm considers multiple factors to help you identify the best matches.",
    color: "from-primary via-primary/90 to-accent"
  },
  {
    icon: Zap,
    title: "Lightning-Fast Processing",
    description: "Process hundreds of applications in minutes, not days. Reduce your time-to-hire by up to 80% while maintaining quality and thoroughness in candidate evaluation.",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Shield,
    title: "Bias-Free Evaluation",
    description: "Our AI focuses on skills, qualifications, and performance - not demographics. Make fair, data-driven hiring decisions that reduce unconscious bias in your process.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track your hiring metrics, success rates, and pipeline health. Get detailed analytics on candidate quality, interview performance, and time-to-fill metrics.",
    color: "from-indigo-500 to-blue-500"
  },
  {
    icon: Users,
    title: "Multi-Channel Candidate Import",
    description: "Import candidates from LinkedIn, Gmail, direct uploads, or public job links. All applications are automatically organized and processed in one unified platform.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Clock,
    title: "Automated Scheduling",
    description: "Schedule interviews automatically with calendar integration. Send meeting links, reminders, and manage your interview pipeline without manual coordination.",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: CheckCircle2,
    title: "Quality Assurance",
    description: "Every candidate is thoroughly evaluated with detailed analysis reports. Review interview transcripts, AI scores, and recommendations before making final decisions.",
    color: "from-amber-500 to-yellow-500"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Everything You Need to <span className="text-gradient">Hire Smarter</span>
          </h2>
          <p className="text-lg text-foreground/90 font-semibold">
            Comprehensive AI-powered tools that transform every aspect of your recruitment process, from initial screening to final selection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border bg-card hover:shadow-md transition-shadow duration-150"
            >
              <CardHeader>
                <div className="mb-4">
                    <IconContainer size="lg" variant="default" className="transition-colors duration-150">
                    <feature.icon className="h-6 w-6" />
                  </IconContainer>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;


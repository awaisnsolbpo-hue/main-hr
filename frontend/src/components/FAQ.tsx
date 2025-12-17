import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconContainer } from "@/components/IconContainer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does AI-powered resume screening work?",
    answer: "Our AI analyzes resumes by extracting key information like skills, experience, education, and qualifications. It then compares each candidate against your job requirements, scoring them based on relevance, experience level, and skill match. The system learns from your preferences and continuously improves its accuracy."
  },
  {
    question: "What happens during an automated video interview?",
    answer: "Candidates receive a link to join a video interview with our AI interviewer. The AI asks tailored questions based on the candidate's resume and the job requirements. The interview is recorded, transcribed in real-time, and analyzed for content quality, communication skills, and answer relevance. You receive a complete transcript and AI-generated evaluation."
  },
  {
    question: "How accurate is the AI candidate ranking?",
    answer: "Our AI ranking system considers multiple factors including resume match, interview performance, skills assessment, and experience relevance. The algorithm is trained on successful hiring patterns and continuously improves. While AI provides valuable insights, we recommend reviewing top candidates to make final decisions based on your specific needs."
  },
  {
    question: "Can I integrate with my existing ATS or HR systems?",
    answer: "Yes! We offer API access for Enterprise customers to integrate with your existing systems. We also support integrations with popular platforms like LinkedIn, Gmail, and calendar systems. Contact our sales team to discuss your specific integration needs."
  },
  {
    question: "How does the system reduce hiring bias?",
    answer: "Our AI focuses exclusively on job-relevant factors like skills, qualifications, and performance. It doesn't consider demographics, names, or other protected characteristics. The system evaluates candidates based on objective criteria, helping you make fair, data-driven hiring decisions while reducing unconscious bias."
  },
  {
    question: "What happens to candidate data and privacy?",
    answer: "We take data privacy seriously. All candidate data is encrypted, stored securely, and complies with GDPR, CCPA, and other privacy regulations. Candidates can request data deletion, and you maintain full control over your hiring data. We never share candidate information with third parties."
  },
  {
    question: "How long does it take to set up and start using the platform?",
    answer: "Getting started is quick! You can create your account and post your first job in under 10 minutes. The AI starts screening candidates immediately. For advanced features like custom integrations, our team can help you set up within 1-2 business days."
  },
  {
    question: "Can I customize the interview questions?",
    answer: "Absolutely! You can create custom interview questions for each job posting. Our AI will ask your specific questions along with intelligent follow-ups based on candidate responses. You can also set question categories, time limits, and evaluation criteria."
  },
  {
    question: "What kind of support do you provide?",
    answer: "We offer email support for all plans, with priority support for Professional and Enterprise customers. Enterprise customers get a dedicated account manager and 24/7 support. We also provide comprehensive documentation, video tutorials, and regular training webinars."
  },
  {
    question: "How much time can I actually save with AI hiring?",
    answer: "Most of our customers report saving 60-80% of their time on initial screening and candidate evaluation. Instead of spending hours reviewing hundreds of resumes, you can focus on interviewing the top-ranked candidates. The exact time savings depends on your hiring volume, but most teams see significant improvements immediately."
  }
];

const FAQ = () => {
  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-4">
            <IconContainer size="sm" variant="default">
              <Sparkles className="h-4 w-4" />
            </IconContainer>
            <span className="text-sm font-medium text-foreground">Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about our AI-powered hiring platform. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border-2 border-border/60 rounded-xl px-6 py-2 hover:border-primary/40 hover:shadow-md transition-all duration-300"
              >
                <AccordionTrigger className="text-left font-bold text-foreground hover:no-underline py-4 text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/90 leading-relaxed pb-4 font-medium">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-16 text-center">
          <p className="text-foreground/90 font-semibold mb-4">
            Still have questions? We're here to help!
          </p>
          <Button variant="outline" size="lg" className="bg-background/80 backdrop-blur-sm">
            Contact Support
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;


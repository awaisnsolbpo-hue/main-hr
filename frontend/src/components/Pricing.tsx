import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 10 job postings",
      "100 candidate evaluations per month",
      "Basic AI screening",
      "Email support",
      "Standard interview features",
      "Basic analytics dashboard"
    ],
    cta: "Start Free",
    popular: false,
    gradient: "from-gray-500 to-gray-600"
  },
  {
    name: "Professional",
    price: "$99",
    period: "per month",
    description: "For growing companies scaling their hiring",
    features: [
      "Unlimited job postings",
      "1,000 candidate evaluations per month",
      "Advanced AI screening & ranking",
      "Priority email support",
      "Full interview automation",
      "Advanced analytics & insights",
      "LinkedIn & Gmail integration",
      "Custom branding"
    ],
    cta: "Get Started",
    popular: true,
    gradient: "from-primary to-accent"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For large organizations with advanced needs",
    features: [
      "Everything in Professional",
      "Unlimited candidate evaluations",
      "Dedicated account manager",
      "24/7 priority support",
      "Custom AI model training",
      "Advanced security & compliance",
      "API access & integrations",
      "White-label solution",
      "Custom reporting & analytics"
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-primary to-accent"
  }
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Choose Your <span className="text-gradient">Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Flexible pricing that scales with your hiring needs. Start free and upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden border-2 transition-all duration-300 animate-fade-in-up hover-scale ${
                plan.popular
                  ? "border-primary shadow-[var(--shadow-glow)] scale-105 md:scale-110"
                  : "border-border hover:border-primary/50"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-accent text-primary-foreground text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <CardHeader className={plan.popular ? "pt-12" : ""}>
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period !== "forever" && (
                    <span className="text-foreground/80 font-medium">/{plan.period}</span>
                  )}
                </div>
                <CardDescription className="text-base">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/90 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/recruiter/signup" className="block w-full">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-foreground/90 font-semibold mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-foreground/90 font-medium">
            Need help choosing? <Link to="/contact" className="text-primary hover:underline font-semibold">Contact our sales team</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;


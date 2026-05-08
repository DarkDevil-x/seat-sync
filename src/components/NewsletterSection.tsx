
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "@/components/ui/sonner";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Thank you for subscribing to our newsletter!");
      setEmail("");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 md:py-28 bg-slate-50/80 dark:bg-muted/30 relative overflow-hidden border-t border-border/50">
      <div className="container max-w-4xl mx-auto px-4 relative z-10">
        <div className="bg-white/70 dark:bg-card/50 border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-14 text-center backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">Stay in the Loop</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Subscribe to our newsletter to get early access to exclusive events, pre-sales, and platform updates.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 h-12 rounded-xl border-slate-300 dark:border-white/20 bg-white/50 dark:bg-background/50 px-4 focus-visible:ring-primary/50"
            />
            <Button type="submit" disabled={isSubmitting} className="h-12 rounded-xl px-8 font-semibold shadow-lg shadow-primary/20">
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-6 font-medium">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>
      </div>
    </section>
  );
}

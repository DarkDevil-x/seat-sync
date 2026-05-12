
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
    <section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden border-t border-border/50">
      <div className="container max-w-4xl mx-auto px-4 relative z-10">
        <div className="bg-card border border-border/50 rounded-2xl p-8 md:p-14 text-center shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Stay updated
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Stay in the Loop</h2>
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
              className="flex-1 h-12 px-4"
            />
            <Button type="submit" disabled={isSubmitting} className="h-12 rounded-full px-8 font-semibold shadow-md shadow-primary/20">
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-6">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>
      </div>
    </section>
  );
}

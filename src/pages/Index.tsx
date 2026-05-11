import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedEvents } from "@/components/FeaturedEvents";
import { FeaturesSection } from "@/components/FeaturesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { NewsletterSection } from "@/components/NewsletterSection";
import { Link } from "react-router-dom";
import { Calendar, Music, Trophy, Mic2, Coffee, Palette } from "lucide-react";

const categories = [
  { label: "Concerts", icon: Music, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10 dark:bg-violet-500/15", text: "text-violet-600 dark:text-violet-400" },
  { label: "Sports", icon: Trophy, color: "from-amber-500 to-orange-600", bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  { label: "Theater", icon: Mic2, color: "from-pink-500 to-rose-600", bg: "bg-pink-500/10 dark:bg-pink-500/15", text: "text-pink-600 dark:text-pink-400" },
  { label: "Conferences", icon: Calendar, color: "from-blue-500 to-cyan-600", bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  { label: "Festivals", icon: Coffee, color: "from-green-500 to-teal-600", bg: "bg-green-500/10 dark:bg-green-500/15", text: "text-green-600 dark:text-green-400" },
  { label: "Exhibitions", icon: Palette, color: "from-indigo-500 to-purple-600", bg: "bg-indigo-500/10 dark:bg-indigo-500/15", text: "text-indigo-600 dark:text-indigo-400" },
];

function CategoryBar() {
  return (
    <section className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-16 z-30">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 py-4 overflow-x-auto scrollbar-none">
          <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap uppercase tracking-wider mr-2">Browse by</p>
          {categories.map(({ label, icon: Icon, bg, text }, i) => (
            <div key={label} className="animate-fadeIn" style={{ animationDelay: `${i * 40}ms` }}>
              <Link
                to={`/events?category=${label.toLowerCase()}`}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full ${bg} ${text} px-5 py-2.5 text-sm font-semibold border border-current/10 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Index = () => {
  return (
    <>
      <HeroSection />
      <CategoryBar />
      <FeaturedEvents />
      <FeaturesSection />
      <TestimonialsSection />
      <NewsletterSection />
      <Footer />
    </>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { EventCard } from "./EventCard";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Event } from "@/types";
import { ArrowRight, Sparkles } from "lucide-react";

export function FeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/events?featured=true');
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {
        console.error("Failed to fetch featured events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const SectionHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5 animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary mb-4">
          <Sparkles className="h-3 w-3" />
          Handpicked for you
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Featured{" "}
          <span className="gradient-text">Events</span>
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm md:text-base">
          Discover the hottest upcoming events near you
        </p>
      </div>
      <Button asChild variant="outline" className="rounded-xl font-semibold group">
        <Link to="/events" className="flex items-center gap-2">
          View All Events
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-background relative overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <SectionHeader />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl overflow-hidden border border-border bg-card"
                style={{ minHeight: "380px" }}
              >
                <div className="shimmer flex-shrink-0" style={{ paddingTop: "56.25%", position: "relative" }}>
                  <div className="absolute inset-0" />
                </div>
                <div className="flex flex-col flex-1 p-4 gap-3">
                  <div className="shimmer h-4 w-3/4 rounded-lg" />
                  <div className="shimmer h-3 w-1/2 rounded-lg" />
                  <div className="shimmer h-3 w-2/3 rounded-lg" />
                  <div className="pt-2 border-t border-border/60 mt-auto">
                    <div className="shimmer h-9 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 relative z-10">

        <SectionHeader />

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
            />
          ))}
        </div>

        {/* View all CTA */}
        <div className="text-center mt-10">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline underline-offset-4 decoration-primary/40 transition-colors"
          >
            Browse all events
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

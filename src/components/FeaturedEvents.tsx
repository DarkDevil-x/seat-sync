import { useQuery } from "@tanstack/react-query";
import { EventCard } from "./EventCard";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Event } from "@/types";
import { ArrowRight, Sparkles } from "lucide-react";

type ApiEvent = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  price?: number;
  is_free?: boolean;
  image_url?: string;
  total_seats?: number;
  sold_seats?: number;
  category?: string;
};

const normalize = (e: ApiEvent): Event => ({
  id: String(e._id ?? e.id),
  title: e.title ?? "",
  description: e.description ?? "",
  date: e.date,
  time: e.time ?? "",
  location: e.location ?? "",
  price: e.is_free ? 0 : (e.price ?? 0),
  imageUrl: e.image_url ?? "",
  totalSeats: e.total_seats ?? 0,
  availableSeats:
    typeof e.total_seats === "number" && typeof e.sold_seats === "number"
      ? e.total_seats - e.sold_seats
      : 0,
  category: e.category ?? "",
});

async function fetchFeatured(): Promise<Event[]> {
  const res = await fetch("/api/events?featured=true&published=true");
  if (!res.ok) throw new Error("Failed to fetch featured events");
  const data: ApiEvent[] = await res.json();
  return data.map(normalize);
}

const SectionHeader = () => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5 animate-fadeIn">
    <div>
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary mb-4">
        <Sparkles className="h-3 w-3" />
        Handpicked for you
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
        Featured <span className="text-primary">Events</span>
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

export function FeaturedEvents() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", "featured"],
    queryFn: fetchFeatured,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-background relative overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <SectionHeader />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
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

  if (events.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        <SectionHeader />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>

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

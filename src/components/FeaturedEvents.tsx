
import { EventCard } from "./EventCard";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Event } from "@/types";
import { mockEvents } from "@/mocks/events";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const events: Event[] = mockEvents.slice(0, 8);

export function FeaturedEvents() {
  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5"
        >
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

          <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}>
            <Button asChild variant="outline" className="rounded-xl font-semibold group">
              <Link to="/events" className="flex items-center gap-2">
                View All Events
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="text-center mt-10"
        >
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline underline-offset-4 decoration-primary/40"
          >
            Browse all events
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

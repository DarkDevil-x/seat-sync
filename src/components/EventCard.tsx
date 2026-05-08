import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Calendar, MapPin, Heart, Zap, ArrowRight } from "lucide-react";
import { Event } from "@/types";

interface EventCardProps {
  event: Event;
  index?: number;
  bookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}

export const EventCard = memo(function EventCard({
  event,
  index = 0,
  bookmarked = false,
  onToggleBookmark,
}: EventCardProps) {
  const {
    id,
    title,
    date,
    location,
    imageUrl,
    price,
    availableSeats,
    totalSeats,
  } = event;

  const formattedDate = formatDistanceToNow(new Date(date), { addSuffix: true });
  const availability = totalSeats ? (availableSeats / totalSeats) * 100 : 0;
  const isSelling = availability > 0 && availability < 20;
  const isSoldOut = availability === 0;
  const isLowStock = availability > 0 && availability < 30;

  const availColor = isSoldOut
    ? "bg-red-500"
    : isLowStock
    ? "bg-orange-400"
    : "bg-emerald-500";

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: `${(index % 4) * 100}ms` }}>
      <div className="group relative flex flex-col h-full min-h-[420px] rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_-12px_rgba(124,58,237,0.28)] hover:border-primary/30"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        {/* ── Image ──────────────────────────────────────────────────── */}
        <Link to={`/events/${id}`} className="block flex-shrink-0">
          <div className="relative w-full overflow-hidden" style={{ paddingTop: "56.25%" }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("hidden");
                }}
              />
            ) : null}
            {/* Fallback placeholder */}
            <div
              className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-blue-500/20 ${imageUrl ? "hidden" : ""}`}
            >
              <div className="text-4xl opacity-30">🎟️</div>
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Price badge */}
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white border border-white/10">
                {typeof price === "number" && price === 0 ? "Free" : `$${typeof price === "number" ? price.toFixed(2) : price}`}
              </span>
            </div>

            {/* Badges (Selling / Sold Out) */}
            {isSelling && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                  <Zap className="h-2.5 w-2.5" />
                  Selling fast
                </span>
              </div>
            )}
            {isSoldOut && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                  Sold Out
                </span>
              </div>
            )}

            {/* Bookmark */}
            {onToggleBookmark && (
              <button
                className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
                onClick={(e) => {
                  e.preventDefault();
                  onToggleBookmark(id);
                }}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark event"}
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-colors ${
                    bookmarked ? "fill-red-500 text-red-500" : "text-foreground"
                  }`}
                />
              </button>
            )}
          </div>
        </Link>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-4 gap-3">

          {/* Title + category */}
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/events/${id}`}
              className="group/title flex-1 min-w-0"
            >
              <h3 className="text-base font-bold leading-snug line-clamp-2 text-foreground group-hover/title:text-primary transition-colors duration-150">
                {title}
              </h3>
            </Link>
          </div>

          {/* Meta */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
              <span className="text-xs font-medium truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
              <span className="text-xs truncate">{location}</span>
            </div>
          </div>

          {/* Availability bar */}
          {totalSeats && totalSeats > 0 ? (
            <div className="mt-auto">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-medium text-muted-foreground">Availability</span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {availableSeats}/{totalSeats}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${availColor}`}
                  style={{ width: `${availability}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-auto" />
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-border/60">
            <Button
              asChild
              className="w-full h-9 rounded-xl font-semibold text-sm group/btn transition-all duration-200 hover:shadow-md hover:shadow-primary/25"
              disabled={isSoldOut}
            >
              <Link to={`/events/${id}`} className="flex items-center justify-center gap-1.5">
                {isSoldOut ? "Sold Out" : "View Details"}
                {!isSoldOut && (
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

EventCard.displayName = "EventCard";

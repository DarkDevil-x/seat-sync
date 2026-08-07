import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Search, Zap, Heart, ArrowRight, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatPrice } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  category: string;
  image_url: string | null;
  is_free: boolean;
  total_seats?: number;
  sold_seats?: number;
};

const PAGE_SIZE = 12;

// Cached Intl.DateTimeFormat is ~10× faster than calling toLocaleDateString
// per row — the latter rebuilds the formatter on every call.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
});
const formatDate = (dateString: string) => dateFormatter.format(new Date(dateString));

// Must return the SAME shape as the home page's category query — both use the
// ["events","categories"] key, and React Query serves one cache to both.
async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  const res = await fetch("/api/events?facets=true");
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

async function fetchEventsList(filter: string): Promise<Event[]> {
  const url = new URL("/api/events", window.location.origin);
  url.searchParams.set("published", "true");
  if (filter !== "all") url.searchParams.set("category", filter);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return (await res.json()) as Event[];
}

// ── Shimmer Skeleton Card ─────────────────────────────────────────────────────
const SkeletonCard = ({ index }: { index: number }) => (
  <div
    className="flex flex-col rounded-2xl overflow-hidden border border-border bg-card animate-fadeIn"
    style={{ minHeight: "420px", animationDelay: `${index * 50}ms` }}
  >
    {/* Image shimmer */}
    <div className="shimmer flex-shrink-0" style={{ paddingTop: "56.25%", position: "relative" }}>
      <div className="absolute inset-0" />
    </div>
    {/* Content shimmer */}
    <div className="flex flex-col flex-1 p-4 gap-3">
      <div className="shimmer h-4 w-3/4 rounded-lg" />
      <div className="shimmer h-3 w-1/2 rounded-lg" />
      <div className="shimmer h-3 w-2/3 rounded-lg" />
      <div className="shimmer h-3 w-full rounded-lg mt-auto" />
      <div className="shimmer h-3 w-full rounded-lg" />
      <div className="pt-2 border-t border-border/60 mt-1">
        <div className="shimmer h-9 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

// ── Memoised Event Card ───────────────────────────────────────────────────────
const EventCard = memo(({ event, index, bookmarked, onToggleBookmark }: {
  event: Event;
  index: number;
  bookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}) => {
  const seatsLeft =
    event.total_seats !== undefined && event.sold_seats !== undefined
      ? event.total_seats - event.sold_seats
      : null;
  const totalSeats = event.total_seats ?? 0;
  const availability = totalSeats > 0 && seatsLeft !== null ? (seatsLeft / totalSeats) * 100 : 100;
  const isSelling = seatsLeft !== null && totalSeats > 0 && seatsLeft / totalSeats < 0.2 && seatsLeft > 0;
  const isSoldOut = seatsLeft === 0;
  const availColor =
    isSoldOut ? "bg-red-500" : availability < 30 ? "bg-orange-400" : "bg-emerald-500";

  return (
    <div className="h-full animate-fadeIn" style={{ animationDelay: `${(index % 8) * 60}ms` }}>
      <div
        className="event-card group relative flex flex-col h-full rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30"
        style={{ minHeight: "420px" }}
      >
        {/* ── Image ──────────────────────────────────────────────── */}
        <Link to={`/events/${event.id}`} className="block flex-shrink-0">
          <div className="relative w-full overflow-hidden" style={{ paddingTop: "56.25%" }}>
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-5xl opacity-20">🎟️</span>
              </div>
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Price */}
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center rounded-lg bg-black/55 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white border border-white/10 shadow-md">
                {event.is_free ? "Free" : formatPrice(event.price)}
              </span>
            </div>

            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
              {isSelling && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                  <Zap className="h-2.5 w-2.5" />
                  Selling fast
                </span>
              )}
              {isSoldOut && (
                <span className="inline-flex items-center rounded-full bg-red-500/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white">
                  Sold Out
                </span>
              )}
            </div>

            {/* Bookmark */}
            <button
              className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-white/15 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleBookmark(event.id);
              }}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark event"}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-colors ${
                  bookmarked ? "fill-red-500 text-red-500" : "text-foreground"
                }`}
              />
            </button>
          </div>
        </Link>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-4 gap-2.5">
          {/* Category badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
              {event.category}
            </span>
          </div>

          {/* Title */}
          <Link to={`/events/${event.id}`} className="group/title">
            <h3 className="text-sm font-bold leading-snug line-clamp-2 text-foreground group-hover/title:text-primary transition-colors duration-150">
              {event.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Meta */}
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0 text-primary/60" />
              <span className="text-[11px] font-medium truncate">{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
              <span className="text-[11px] truncate">{event.location}</span>
            </div>
          </div>

          {/* Availability bar */}
          {totalSeats > 0 && seatsLeft !== null && (
            <div className="mt-auto pt-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-medium text-muted-foreground">Seats left</span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {seatsLeft}/{totalSeats}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${availColor}`}
                  style={{ width: `${availability}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="pt-3 border-t border-border/60 mt-auto">
            <Link
              to={`/events/${event.id}`}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl h-9 text-sm font-semibold transition-all duration-200
                ${isSoldOut
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                  : "bg-primary text-primary-foreground hover:opacity-90 hover:shadow-md hover:shadow-primary/25"
                }`}
            >
              {isSoldOut ? "Sold Out" : "View Details"}
              {!isSoldOut && <ArrowRight className="h-3.5 w-3.5" />}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});
EventCard.displayName = "EventCard";

// ── Filter Pill ───────────────────────────────────────────────────────────────
const FilterPill = memo(({ label, active, onClick, color }: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "primary" | "blue" | "green";
}) => {
  const activeClass =
    color === "blue" ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.45)]"
    : color === "green" ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(5,150,105,0.4)]"
    : "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]";

  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 select-none border active:scale-95
        ${active
          ? `${activeClass} border-transparent scale-105`
          : "bg-secondary text-secondary-foreground border-border hover:border-primary/30 hover:bg-secondary/70"
        }`}
    >
      {label}
    </button>
  );
});
FilterPill.displayName = "FilterPill";

// ── Main Events Page ──────────────────────────────────────────────────────────
export default function Events() {
  // The category lives in the URL so links like /events?category=Concert from
  // the home page land on a filtered list, and so a filtered list stays
  // shareable and survives a reload.
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("category") || "all";
  const setFilter = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === "all") params.delete("category");
          else params.set("category", next);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 280);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "price-asc" | "price-desc">("date");
  const [page, setPage] = useState(1);
  const [bookmarks, setBookmarks] = useLocalStorage<string[]>("ss_bookmarks", []);

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ["events", "list", filter],
    queryFn: () => fetchEventsList(filter),
    staleTime: 60_000,
    // Keep previous data visible while refetching after a filter change —
    // avoids the page flashing back to the skeleton on every pill click.
    placeholderData: (prev) => prev,
  });

  // Categories come from a facet query, not from `events` — deriving them from
  // the filtered result set collapsed the pill bar to the single active
  // category, so there was no way back to a sibling category.
  const { data: facets = [] } = useQuery({
    queryKey: ["events", "categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });
  const categories = useMemo(() => facets.map((f) => f.category), [facets]);

  // A ?category= that matches nothing (a stale link, a renamed category) would
  // otherwise render an empty list with no active pill and no explanation.
  const unknownCategory =
    filter !== "all" &&
    categories.length > 0 &&
    !categories.some((c) => c.toLowerCase() === filter.toLowerCase());

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }, [setBookmarks]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, dateFilter, freeOnly, sortBy, filter]);

  // Memoised filtering + sorting
  const filtered = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        if (search) {
          const q = search.toLowerCase();
          if (
            !e.title.toLowerCase().includes(q) &&
            !e.location.toLowerCase().includes(q) &&
            !(e.description || "").toLowerCase().includes(q)
          )
            return false;
        }
        if (freeOnly && !e.is_free) return false;
        if (dateFilter !== "all") {
          const d = new Date(e.date);
          if (dateFilter === "today") {
            if (d.toDateString() !== now.toDateString()) return false;
          } else if (dateFilter === "week") {
            const week = new Date(now);
            week.setDate(now.getDate() + 7);
            if (d < now || d > week) return false;
          } else if (dateFilter === "month") {
            const month = new Date(now);
            month.setMonth(now.getMonth() + 1);
            if (d < now || d > month) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [events, search, freeOnly, dateFilter, sortBy]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const clearSearch = () => setSearchRaw("");
  const hasActiveFilters = searchRaw || filter !== "all" || dateFilter !== "all" || freeOnly;

  return (
    <div className="page-wrapper">
      <div className="container mx-auto py-10 px-4 max-w-7xl">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Upcoming{" "}
                <span className="text-primary">Events</span>
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm md:text-base">
                Browse and book tickets for the best experiences
              </p>
            </div>
            {!loading && filtered.length > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-muted/80 backdrop-blur-sm border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {filtered.length} event{filtered.length !== 1 ? "s" : ""} available
              </div>
            )}
          </div>
        </div>

        {/* ── Search + Sort ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              className="search-input pl-10 pr-10 h-11"
              placeholder="Search by title, location, or description…"
              value={searchRaw}
              onChange={(e) => setSearchRaw(e.target.value)}
              id="events-search"
            />
            {searchRaw && (
              <button
                onClick={clearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-11 text-sm border border-input rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
            aria-label="Sort events"
          >
            <option value="date">📅 Date (soonest)</option>
            <option value="price-asc">💰 Price (low→high)</option>
            <option value="price-desc">💎 Price (high→low)</option>
          </select>
        </div>

        {/* ── Filter Pills ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-7">
          {["all", ...categories].map((cat) => (
            <FilterPill
              key={cat}
              label={cat === "all" ? "All Events" : cat}
              active={cat === "all" ? filter === "all" : filter.toLowerCase() === cat.toLowerCase()}
              onClick={() => setFilter(cat)}
              color="primary"
            />
          ))}

          {categories.length > 0 && <span className="w-px h-5 bg-border mx-0.5" />}

          {(["all", "today", "week", "month"] as const).map((d) => (
            <FilterPill
              key={d}
              label={
                d === "all" ? "Any Date"
                : d === "today" ? "Today"
                : d === "week" ? "This Week"
                : "This Month"
              }
              active={dateFilter === d}
              onClick={() => setDateFilter(d)}
              color="blue"
            />
          ))}

          <FilterPill
            label="🆓 Free Only"
            active={freeOnly}
            onClick={() => setFreeOnly((v) => !v)}
            color="green"
          />

          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilter("all");
                setDateFilter("all");
                setFreeOnly(false);
                setSearchRaw("");
              }}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 transition-all"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fadeIn">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold mb-2">
              {unknownCategory ? `Nothing in "${filter}"` : "No events yet"}
            </h2>
            <p className="text-muted-foreground max-w-sm">
              {unknownCategory
                ? "That category has no upcoming events. Pick another above."
                : filter !== "all"
                ? "No upcoming events in this category yet. Pick another above."
                : "Check back later for upcoming events"}
            </p>
            {filter !== "all" && (
              <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setFilter("all")}>
                Show all events
              </Button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fadeIn">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">No results found</h2>
            <p className="text-muted-foreground max-w-sm">
              {search
                ? `No events matching "${search}". Try a different search term.`
                : "Try adjusting your filters to find what you're looking for."}
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-xl"
              onClick={() => {
                setFilter("all");
                setDateFilter("all");
                setFreeOnly(false);
                setSearchRaw("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginated.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  bookmarked={bookmarks.includes(event.id)}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex flex-col items-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl px-8 font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                >
                  Load More
                  <span className="ml-2 text-xs opacity-70">
                    ({filtered.length - paginated.length} remaining)
                  </span>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Showing {paginated.length} of {filtered.length} events
                </p>
              </div>
            )}
            {!hasMore && filtered.length > PAGE_SIZE && (
              <p className="text-center text-xs text-muted-foreground mt-8">
                All {filtered.length} events loaded
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

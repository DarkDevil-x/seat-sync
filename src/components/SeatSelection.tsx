import { useState, useEffect, useRef, useMemo, memo } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/providers/AuthProvider";

const HOLD_DURATION_MS = 10 * 60 * 1_000;
const POLL_INTERVAL_MS = 5_000;

type Seat = {
  id: string;
  row: string;
  number: number;
  status: string;
  price: number;
  event_id: string;
  created_at: string;
  updated_at: string;
  booked_by_me?: boolean;
};

type SeatSelectionProps = {
  eventId: string;
  onSeatSelect: (selectedSeats: string[], totalPrice: number) => void;
};

const SeatSelection = ({ eventId, onSeatSelect }: SeatSelectionProps) => {
  const { user } = useAuth();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creatingSeats, setCreatingSeats] = useState(false);
  const [userBookedSeats, setUserBookedSeats] = useState<string[]>([]);
  // seatId → hold-expiry timestamp (ms)
  const [holdExpiries, setHoldExpiries] = useState<Map<string, number>>(new Map());
  const [countdown, setCountdown] = useState<string | null>(null);

  // Stable refs so interval/beforeunload closures always read the latest values
  const selectedSeatIdsRef = useRef<string[]>([]);
  const seatsRef = useRef<Seat[]>([]);
  const onSeatSelectRef = useRef(onSeatSelect);
  const lastServerEtag = useRef<string | null>(null);
  const isVisibleRef = useRef(true);
  const pollAbortRef = useRef<AbortController | null>(null);
  // Leading throttle: ignore seat clicks that arrive within 100 ms of the last one
  const lastSeatClickTime = useRef(0);

  const handleSeatClickThrottled = (seat: Seat) => {
    const now = Date.now();
    if (now - lastSeatClickTime.current < 100) return;
    lastSeatClickTime.current = now;
    handleSeatClick(seat);
  };
  selectedSeatIdsRef.current = selectedSeatIds;
  seatsRef.current = seats;
  // keep onSeatSelectRef current every render
  useEffect(() => { onSeatSelectRef.current = onSeatSelect; });

  // ── auth header helper ────────────────────────────────────────────────────────
  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("auth_token");
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  // ── normalise MongoDB _id → id ────────────────────────────────────────────────
  const applySeats = (raw: any[]) => {
    const list: Seat[] = raw.map((s) => ({ ...s, id: String(s._id ?? s.id) }));
    // Only update React state if something actually changed — avoids full seat-grid re-render
    // on every poll when seats are idle (common case: no bookings happening)
    const prev = seatsRef.current;
    const hasChanges =
      list.length !== prev.length ||
      list.some((s) => {
        const old = prev.find((p) => p.id === s.id);
        return !old || old.status !== s.status;
      });
    if (hasChanges) {
      setSeats(list);
      setRows(Array.from(new Set(list.map((s) => s.row))).sort());
    }
    return list;
  };

  // ── release specific holds via API ────────────────────────────────────────────
  const releaseHolds = async (seatIds: string[]) => {
    if (!seatIds.length) return;
    try {
      await fetch("/api/seats/release", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ seatIds }),
      });
    } catch (err) {
      console.error("Error releasing holds:", err);
    }
  };

  // ── mount effect: initial load, polling, page-unload cleanup ─────────────────
  useEffect(() => {
    fetchSeats();
    if (user) fetchUserBookedSeats();

    const pollId = setInterval(() => {
      if (isVisibleRef.current) pollSeats();
    }, POLL_INTERVAL_MS);

    // Pause polling when tab is hidden (saves requests + battery)
    const handleVis = () => {
      isVisibleRef.current = !document.hidden;
      // When coming back to tab, do an immediate refresh
      if (!document.hidden) pollSeats();
    };
    document.addEventListener("visibilitychange", handleVis);

    // Use keepalive fetch on tab close so the hold is released even if the
    // component unmounts after the page starts unloading
    const handleUnload = () => {
      const ids = selectedSeatIdsRef.current;
      if (!ids.length) return;
      const h = authHeaders();
      fetch("/api/seats/release", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ seatIds: ids }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(pollId);
      pollAbortRef.current?.abort();
      document.removeEventListener("visibilitychange", handleVis);
      window.removeEventListener("beforeunload", handleUnload);
      // Release on SPA navigation away
      releaseHolds(selectedSeatIdsRef.current);
    };
  }, [eventId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── countdown tick + auto-expire held seats ───────────────────────────────────
  useEffect(() => {
    if (holdExpiries.size === 0) {
      setCountdown(null);
      return;
    }
    const tick = () => {
      const earliest = Math.min(...Array.from(holdExpiries.values()));
      const remaining = Math.max(0, earliest - Date.now());
      const mins = Math.floor(remaining / 60_000);
      const secs = Math.floor((remaining % 60_000) / 1_000);
      setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);

      // Auto-remove expired holds from the selection
      const now = Date.now();
      const expired: string[] = [];
      holdExpiries.forEach((exp, id) => { if (exp <= now) expired.push(id); });
      if (expired.length) {
        setSelectedSeatIds((prev) => {
          const kept = prev.filter((id) => !expired.includes(id));
          const total = seatsRef.current
            .filter((s) => kept.includes(s.id))
            .reduce((sum, s) => sum + s.price, 0);
          onSeatSelectRef.current(kept, total);
          return kept;
        });
        setHoldExpiries((prev) => {
          const next = new Map(prev);
          expired.forEach((id) => next.delete(id));
          return next;
        });
        toast({
          title: "Hold expired",
          description: "Your seat hold has expired. Please re-select your seats.",
          variant: "destructive",
        });
      }
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [holdExpiries]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserBookedSeats = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/bookings?userId=${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const bookings: any[] = await res.json();
      const eventBookings = bookings.filter(
        (b) => String(b.event?._id ?? b.event_id ?? "") === eventId
      );
      const seatIds = eventBookings
        .flatMap((b) =>
          (b.booking_seats ?? []).map(
            (bs: any) => String(bs.seat?._id ?? bs.seat?.id ?? "")
          )
        )
        .filter(Boolean);
      setUserBookedSeats(seatIds);
    } catch (err) {
      console.error("Error fetching user booked seats:", err);
    }
  };

  // ── poll every 5 s; detect seats stolen from our hold ────────────────────────
  const pollSeats = async () => {
    // Cancel any previous in-flight poll to prevent response pile-up on slow networks
    pollAbortRef.current?.abort();
    pollAbortRef.current = new AbortController();
    try {
      const res = await fetch(`/api/seats?eventId=${eventId}`, { signal: pollAbortRef.current.signal });
      if (!res.ok) return;
      // Skip state update if server data hasn't changed
      const etag = res.headers.get('x-seats-etag') || res.headers.get('last-modified');
      if (etag && etag === lastServerEtag.current) return;
      if (etag) lastServerEtag.current = etag;

      const normalised = applySeats(await res.json());

      const stolen = selectedSeatIdsRef.current.filter((id) => {
        const s = normalised.find((x) => x.id === id);
        return s && s.status === "booked";
      });
      if (stolen.length) {
        setSelectedSeatIds((prev) => {
          const kept = prev.filter((id) => !stolen.includes(id));
          const total = normalised
            .filter((s) => kept.includes(s.id))
            .reduce((sum, s) => sum + s.price, 0);
          onSeatSelectRef.current(kept, total);
          return kept;
        });
        setHoldExpiries((prev) => {
          const next = new Map(prev);
          stolen.forEach((id) => next.delete(id));
          return next;
        });
        toast({
          title: "Seat taken",
          description: `${stolen.length} seat(s) were booked by someone else and removed from your selection.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return; // expected — previous poll cancelled
      // silent – transient poll failures should not disrupt UX
    }
  };

  const fetchSeats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching seats for event:", eventId);
      const res = await fetch(`/api/seats?eventId=${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch seats");
      const raw: any[] = await res.json();
      console.log("Seats data:", raw.length, "seats loaded");
      if (raw.length === 0) {
        await createDefaultSeats();
        return;
      }
      applySeats(raw);
    } catch (err: any) {
      console.error("Error fetching seats:", err);
      setError(err.message || "Failed to load seats");
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSeats = async () => {
    setCreatingSeats(true);
    setError(null);
    try {
      console.log("Creating default seats for event:", eventId);
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (!eventRes.ok) throw new Error("Failed to fetch event details");
      const eventData = await eventRes.json();
      const basePrice = eventData.price || 10;

      const genRes = await fetch("/api/seats/generate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          eventId,
          seatPrice: String(basePrice),
          customLayout: true,
          numberOfRows: 10,
          numberOfColumns: 9,
        }),
      });
      if (!genRes.ok) {
        const e = await genRes.json().catch(() => ({}));
        throw new Error(e.error || "Failed to create seats");
      }
      const result = await genRes.json();
      console.log(`Created ${result.count} default seats`);
      toast({
        title: "Seats created",
        description: `${result.count} seats have been created for this event.`,
      });
      fetchSeats();
    } catch (err: any) {
      console.error("Error creating default seats:", err);
      setError(err.message || "Failed to create seats");
    } finally {
      setCreatingSeats(false);
    }
  };

  const handleSeatClick = async (seat: Seat) => {
    if (userBookedSeats.includes(seat.id)) {
      toast({ title: "Already booked", description: "You've already booked this seat." });
      return;
    }

    const isSelected = selectedSeatIds.includes(seat.id);

    if (isSelected) {
      // Deselect → release hold immediately
      const newIds = selectedSeatIds.filter((id) => id !== seat.id);
      setSelectedSeatIds(newIds);
      setHoldExpiries((prev) => { const n = new Map(prev); n.delete(seat.id); return n; });
      const total = seats.filter((s) => newIds.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
      onSeatSelect(newIds, total);
      await releaseHolds([seat.id]);
      return;
    }

    if (seat.status !== "available") return;

    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to select seats.", variant: "destructive" });
      return;
    }

    // Attempt to hold the seat atomically before adding to selection
    try {
      const res = await fetch("/api/seats/hold", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ seatIds: [seat.id] }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          toast({ title: "Seat just taken", description: "This seat was just reserved by someone else.", variant: "destructive" });
          // Reflect the new status locally so the seat turns yellow immediately
          setSeats((prev) => prev.map((s) => s.id === seat.id ? { ...s, status: "reserved" } : s));
        } else {
          toast({ title: "Could not hold seat", description: data.error || "Please try again.", variant: "destructive" });
        }
        return;
      }

      // Hold confirmed – add to selection and start countdown
      const expiry = Date.now() + HOLD_DURATION_MS;
      const newIds = [...selectedSeatIds, seat.id];
      setSelectedSeatIds(newIds);
      setHoldExpiries((prev) => new Map(prev).set(seat.id, expiry));
      const total = seats.filter((s) => newIds.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
      onSeatSelect(newIds, total);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to hold seat", variant: "destructive" });
    }
  };

  const getSeatColor = (seat: Seat) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    const isBookedByUser = userBookedSeats.includes(seat.id);
    
    let base = "w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] flex items-center justify-center transition-all duration-200 text-[9px] sm:text-[10px] font-medium border flex-shrink-0 ";
    
    if (isBookedByUser) {
      return base + "border-purple-500 bg-purple-500/20 text-purple-700 dark:text-purple-200 cursor-default shadow-[0_0_8px_rgba(168,85,247,0.3)]";
    }
    if (isSelected) {
      return base + "border-primary bg-primary text-primary-foreground scale-110 shadow-[0_0_12px_var(--primary)]";
    }
    if (seat.status === "booked") {
      return base + "border-muted-foreground/20 bg-muted text-muted-foreground/50 cursor-not-allowed";
    }
    if (seat.status === "reserved" || seat.status === "held") {
      return base + "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-500/50 cursor-not-allowed";
    }
    // Available
    return base + "border-primary/40 bg-transparent text-foreground/80 hover:border-primary hover:bg-primary/10";
  };

  // ── HOOKS MUST COME BEFORE ANY CONDITIONAL RETURNS (Rules of Hooks) ──────────
  const seatsByRow = useMemo(() => {
    const map = new Map<string, Seat[]>();
    for (const seat of seats) {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row)!.push(seat);
    }
    for (const rowSeats of map.values()) {
      rowSeats.sort((a, b) => a.number - b.number);
    }
    return map;
  }, [seats]);

  if (loading) {
    return <div className="flex justify-center py-12">Loading seating plan...</div>;
  }

  if (creatingSeats) {
    return <div className="flex justify-center py-12">Creating seats for this event...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Error: {error}</p>
        <button 
          onClick={fetchSeats}
          className="mt-4 text-sm underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (seats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-2">No seats available for this event yet.</p>
        <button
          onClick={createDefaultSeats}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Create Default Seats
        </button>
      </div>
    );
  }

  // Dynamic grouping into 3 sections: Front, Back, Balcony
  const third = Math.ceil(rows.length / 3);
  const frontRows = rows.slice(0, third);
  const backsideRows = rows.slice(third, third * 2);
  const balconyRows = rows.slice(third * 2);

  const renderSeat = (seat: Seat) => (
    <button
      key={seat.id}
      className={getSeatColor(seat)}
      onClick={() => handleSeatClickThrottled(seat)}
      disabled={(seat.status === "booked" || seat.status === "reserved" || seat.status === "held") && !selectedSeatIds.includes(seat.id)}
      aria-label={`Seat ${seat.row}${seat.number}`}
    >
      <span className="scale-[0.85] transform tracking-tighter">{seat.row}{seat.number}</span>
    </button>
  );

  const renderRow = (row: string, isSplit: boolean) => {
    const sorted = seatsByRow.get(row) || [];
    
    if (isSplit && sorted.length > 4) {
      const mid = Math.ceil(sorted.length / 2);
      const left = sorted.slice(0, mid);
      const right = sorted.slice(mid);

      return (
        <div key={row} className="flex justify-center items-center gap-6 md:gap-12 mb-3">
          <div className="flex gap-1.5 sm:gap-2">
            {left.map(seat => renderSeat(seat))}
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {right.map(seat => renderSeat(seat))}
          </div>
        </div>
      );
    }

    return (
      <div key={row} className="flex justify-center items-center gap-1.5 sm:gap-2 mb-3">
        {sorted.map(seat => renderSeat(seat))}
      </div>
    );
  };

  return (
    <div className="mb-12 w-full max-w-5xl mx-auto rounded-3xl p-6 md:p-10 bg-card border border-border shadow-2xl relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Screen Side Indicator */}
      <div className="flex flex-col items-center mb-16 relative z-10">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8">Select your seat</h2>
        
        {/* Curved Screen Line */}
        <div className="w-full max-w-[600px] px-4 relative flex flex-col items-center">
          <svg width="100%" height="20" viewBox="0 0 600 20" preserveAspectRatio="none" className="w-full drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(225,29,72,0.6)]">
            <path d="M0,20 Q300,0 600,20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-rose-500/60 dark:text-rose-600/80"/>
          </svg>
          <span className="text-[10px] font-semibold text-muted-foreground tracking-[0.3em] mt-4 uppercase">Screen Side</span>
        </div>
      </div>
      
      {/* Seating Area */}
      <div className="w-full overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10">
        <div className="flex flex-col items-center w-max mx-auto px-4 sm:px-6">
          
          {/* Front Section */}
          {frontRows.length > 0 && (
            <div className="mb-10 w-full flex flex-col items-center">
              <div className="mb-6 flex items-center justify-center w-full max-w-sm opacity-50">
                <div className="flex-1 border-b border-border/60"></div>
                <span className="mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em]">Front</span>
                <div className="flex-1 border-b border-border/60"></div>
              </div>
              {frontRows.map(row => renderRow(row, false))}
            </div>
          )}
          
          {/* Backside Section */}
          {backsideRows.length > 0 && (
            <div className="mb-10 w-full flex flex-col items-center">
              <div className="mb-6 flex items-center justify-center w-full max-w-sm opacity-50">
                <div className="flex-1 border-b border-border/60"></div>
                <span className="mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em]">Back</span>
                <div className="flex-1 border-b border-border/60"></div>
              </div>
              {backsideRows.map(row => renderRow(row, true))}
            </div>
          )}
          
          {/* Balcony Section */}
          {balconyRows.length > 0 && (
            <div className="mb-4 w-full flex flex-col items-center">
              <div className="mb-6 flex items-center justify-center w-full max-w-sm opacity-50">
                <div className="flex-1 border-b border-border/60"></div>
                <span className="mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em]">Balcony</span>
                <div className="flex-1 border-b border-border/60"></div>
              </div>
              {balconyRows.map(row => renderRow(row, true))}
            </div>
          )}
          
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-5 justify-center mt-8 pt-8 border-t border-border/50 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[4px] border border-primary/40 bg-transparent"></div>
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[4px] bg-primary shadow-[0_0_8px_var(--primary)]"></div>
          <span className="text-xs text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[4px] border border-amber-500/40 bg-amber-500/10"></div>
          <span className="text-xs text-muted-foreground">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[4px] border border-muted-foreground/20 bg-muted"></div>
          <span className="text-xs text-muted-foreground">Booked</span>
        </div>
        {userBookedSeats.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-[4px] border border-purple-500 bg-purple-500/20"></div>
            <span className="text-xs text-muted-foreground">Your Bookings</span>
          </div>
        )}
      </div>
      
      {/* Selection Summary */}
      {selectedSeatIds.length > 0 && (
        <div className="text-center text-sm mt-6 relative z-10 p-4 rounded-2xl bg-card border border-border max-w-sm mx-auto backdrop-blur-sm shadow-lg">
          <p className="text-foreground/90">
            <span className="font-bold text-foreground text-lg">{selectedSeatIds.length}</span> seat{selectedSeatIds.length > 1 ? 's' : ''} selected
          </p>
          {countdown && (
            <p className="text-amber-600 dark:text-amber-400 font-medium mt-1.5 flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Held for <span className="font-bold text-foreground">{countdown}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(SeatSelection);

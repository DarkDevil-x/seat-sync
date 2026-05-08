
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import TicketDetails from "@/components/TicketDetails";
import { Tickets, Calendar, Share2, XCircle } from "lucide-react";

type Booking = {
  id: string;
  event_id: string;
  total_price: number;
  is_free: boolean;
  status: string;
  created_at: string;
  event: {
    title: string;
    date: string;
    location: string;
  };
  seats: {
    row: string;
    number: number;
  }[];
};

function addToCalendar(booking: Booking) {
  const title = encodeURIComponent(booking.event.title);
  const location = encodeURIComponent(booking.event.location);
  const start = booking.event.date
    ? new Date(booking.event.date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    : "";
  const end = booking.event.date
    ? new Date(new Date(booking.event.date).getTime() + 2 * 60 * 60 * 1000)
        .toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    : "";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${decodeURIComponent(title)}`,
    `LOCATION:${decodeURIComponent(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${booking.event.title.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MyTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/bookings?userId=${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const raw: any[] = await response.json();

      const normalized: Booking[] = raw.map((b) => ({
        id: b._id ?? b.id,
        event_id: String(b.event?._id ?? b.event_id ?? ""),
        total_price: b.total_price,
        is_free: b.event?.is_free ?? false,
        status: b.status,
        created_at: b.created_at,
        event: {
          title: b.event?.title ?? "Unknown Event",
          date: b.event?.date ?? "",
          location: b.event?.location ?? "",
        },
        seats: (b.booking_seats ?? []).map((bs: any) => ({
          row: bs.seat?.row ?? "",
          number: bs.seat?.number ?? 0,
        })),
      }));

      setBookings(normalized);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    setCancellingId(bookingId);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel");
      toast({ title: "Cancelled", description: "Your booking has been cancelled." });
      fetchBookings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCancellingId(null);
    }
  };

  const shareBooking = (booking: Booking) => {
    const url = `${window.location.origin}/events/${booking.event_id}`;
    if (navigator.share) {
      navigator.share({ title: booking.event.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Event link copied to clipboard." });
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.event.date && new Date(b.event.date) >= now
  );
  const past = bookings.filter(
    (b) => !b.event.date || new Date(b.event.date) < now
  );

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tickets className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Tickets</h1>
              <p className="text-sm text-muted-foreground">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
            </div>
          </div>
          <Button className="hover:scale-[1.02] transition-transform" onClick={() => navigate("/events")}>Browse Events</Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="glass">
            <CardContent className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Tickets className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">No tickets yet</p>
              <p className="text-muted-foreground mb-6">You haven't booked any events yet</p>
              <Button className="hover:scale-[1.02] transition-transform" onClick={() => navigate("/events")}>Browse Events</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-green-600">Upcoming · {upcoming.length}</h2>
                </div>
                <div className="relative pl-5 border-l-2 border-green-500/30 space-y-4">
                  {upcoming.map((booking) => (
                    <div key={booking.id} className="relative">
                      <span className="absolute -left-[1.35rem] top-5 h-3 w-3 rounded-full bg-green-500 ring-4 ring-background" />
                      <TicketDetails booking={booking} />
                      <div className="flex flex-wrap gap-2 mt-2 pl-1">
                        <Button size="sm" variant="outline" onClick={() => addToCalendar(booking)}>
                          <Calendar className="h-3.5 w-3.5 mr-1" /> Add to Calendar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => shareBooking(booking)}>
                          <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10"
                          onClick={() => cancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}>
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Past · {past.length}</h2>
                </div>
                <div className="relative pl-5 border-l-2 border-muted space-y-4 opacity-75">
                  {past.map((booking) => (
                    <div key={booking.id} className="relative">
                      <span className="absolute -left-[1.35rem] top-5 h-3 w-3 rounded-full bg-muted-foreground ring-4 ring-background" />
                      <div className={booking.status === "cancelled" ? "opacity-60 grayscale" : ""}>
                        <TicketDetails booking={booking} />
                        {booking.status === "cancelled" && (
                          <div className="mt-1 pl-1">
                            <Badge className="bg-red-100 text-red-700 line-through">Cancelled</Badge>
                          </div>
                        )}
                      </div>
                      {booking.status !== "cancelled" && (
                        <div className="flex flex-wrap gap-2 mt-2 pl-1">
                          <Button size="sm" variant="outline" onClick={() => addToCalendar(booking)}>
                            <Calendar className="h-3.5 w-3.5 mr-1" /> Add to Calendar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => shareBooking(booking)}>
                            <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

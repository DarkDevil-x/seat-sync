
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import SeatSelection from "@/components/SeatSelection";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

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
  max_seats_per_user: number;
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [userBookings, setUserBookings] = useState<number>(0);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [seatRefreshKey, setSeatRefreshKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  // Prevent double-click: ignore repeated calls within 500 ms
  const lastBookingAttempt = useRef(0);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const handleBookingDebounced = () => {
    const now = Date.now();
    if (now - lastBookingAttempt.current < 500) return;
    lastBookingAttempt.current = now;
    handleBooking();
  };

  useEffect(() => {
    if (id) fetchEvent(id);
    return () => { fetchAbortRef.current?.abort(); };
  }, [id]);

  useEffect(() => {
    if (user && id) checkUserBookings(id);
  }, [user, id]);

  const fetchEvent = useCallback(async (eventId: string) => {
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, { signal: fetchAbortRef.current.signal });
      if (!response.ok) { navigate("/events"); return; }
      const data = await response.json();
      if (!data.is_published) { navigate("/events"); return; }
      setEvent(data as Event);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error("Error fetching event:", error);
      navigate("/events");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const checkUserBookings = useCallback(async (eventId: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/bookings?userId=${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return;
      const bookings: any[] = await response.json();
      const seatCount = bookings
        .filter((b) => String(b.event?._id ?? b.event_id ?? "") === eventId)
        .reduce((sum, b) => sum + (b.booking_seats?.length ?? 0), 0);
      setUserBookings(seatCount);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error("Error checking user bookings:", error);
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to book tickets",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (selectedSeats.length === 0) {
      toast({
        title: "No seats selected",
        description: "Please select at least one seat to book",
        variant: "destructive",
      });
      return;
    }

    // Check if user is trying to book more than max_seats_per_user allows
    if (event && userBookings + selectedSeats.length > event.max_seats_per_user) {
      toast({
        title: "Booking limit exceeded",
        description: `You can only book a maximum of ${event.max_seats_per_user} seats for this event. You already have ${userBookings} seats booked.`,
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    setBookingLoading(true);
    try {
      // Step 1: Atomically hold all selected seats for 10 minutes.
      // A single updateMany with $or condition prevents race conditions.
      const holdRes = await fetch("/api/seats/hold", {
        method: "POST",
        headers,
        body: JSON.stringify({ seatIds: selectedSeats }),
      });
      const holdData = await holdRes.json();

      if (!holdRes.ok) {
        if (holdRes.status === 409) {
          // Another user grabbed one or more seats between selection and submission
          setSeatRefreshKey((k) => k + 1);
          setSelectedSeats([]);
          setTotalPrice(0);
          toast({
            title: "Seats no longer available",
            description: "Some seats were just booked by someone else. Please re-select.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(holdData.error || "Failed to reserve seats");
      }

      // Step 2: Create the booking inside a MongoDB transaction.
      // The API verifies the hold is still valid before committing.
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers,
        body: JSON.stringify({ eventId: id, seatIds: selectedSeats, totalPrice }),
      });
      const bookData = await bookRes.json();

      if (!bookRes.ok) {
        // Best-effort release so seats become available again immediately
        await fetch("/api/seats/release", {
          method: "POST",
          headers,
          body: JSON.stringify({ seatIds: selectedSeats }),
        }).catch(() => {});

        if (bookRes.status === 409) {
          setSeatRefreshKey((k) => k + 1);
          setSelectedSeats([]);
          setTotalPrice(0);
          toast({
            title: "Seats no longer available",
            description: bookData.error || "Seat hold expired. Please re-select.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(bookData.error || "Booking failed");
      }

      toast({
        title: "Booking successful!",
        description: "Your tickets have been booked successfully",
      });
      navigate("/tickets");
    } catch (error: any) {
      console.error("Error during booking:", error);
      toast({
        title: "Booking failed",
        description: error.message || "An error occurred during booking",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-6" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Event not found</h2>
        <p className="mb-6 text-muted-foreground">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate("/events")}>Browse Events</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground mb-4">
              <span>{formatDate(event.date)}</span>
              <span>•</span>
              <span>{event.location}</span>
            </div>
            <div className="flex gap-2 mb-4">
              <Badge>{event.category}</Badge>
              {event.is_free && <Badge variant="outline" className="bg-green-100 text-green-800">Free</Badge>}
            </div>
            
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                loading="lazy"
                decoding="async"
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            ) : (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center mb-6">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
            
            <h2 className="text-xl font-bold mb-3">Event Details</h2>
            <p className="whitespace-pre-line">{event.description}</p>
          </div>
          
          <Separator className="my-6" />
          
          <h2 className="text-xl font-bold mb-4">Select Your Seats</h2>
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="text-xs text-muted-foreground mr-1">Zoom</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.6, parseFloat((z - 0.1).toFixed(1))))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs w-8 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(1.5, parseFloat((z + 0.1).toFixed(1))))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(1)}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease",
            }}
          >
            <SeatSelection
              key={seatRefreshKey}
              eventId={event.id}
              onSeatSelect={(seats, price) => {
                setSelectedSeats(seats);
                setTotalPrice(price);
              }}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-8 glass shadow-2xl">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Booking Summary</h3>
              <div className="flex justify-between mb-2">
                <span>Price per ticket</span>
                <span>{event.is_free ? "Free" : `$${event.price.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Selected seats</span>
                <span>{selectedSeats.length}</span>
              </div>
              {userBookings > 0 && (
                <div className="flex justify-between mb-2 text-amber-600">
                  <span>Already booked</span>
                  <span>{userBookings} seats</span>
                </div>
              )}
              <Separator className="my-4" />
              <div className="flex justify-between mb-6 font-bold">
                <span>Total</span>
                <span>{event.is_free ? "Free" : `$${totalPrice.toFixed(2)}`}</span>
              </div>
              {event.max_seats_per_user > 0 && (
                <p className="text-xs mb-4 text-muted-foreground">
                  You can book up to {event.max_seats_per_user} seats for this event.
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                disabled={selectedSeats.length === 0 || bookingLoading}
                onClick={handleBookingDebounced}
              >
                {bookingLoading ? "Processing..." : event.is_free ? "Reserve Now" : "Book Now"}
              </Button>
              {!user && (
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  You need to be signed in to book tickets
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Download, Ticket, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import html2canvas from "html2canvas";

type FetchState = "idle" | "loading" | "success" | "not_found" | "error";

const authHeader = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const TicketGenerator = () => {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [booking, setBooking] = useState<any>(null);

  const [universityName, setUniversityName] = useState("INVERTIS UNIVERSITY");
  const [studentId, setStudentId] = useState("");
  const [course, setCourse] = useState("");

  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to access the ticket generator.", variant: "destructive" });
      navigate("/auth");
    }
  }, [user, navigate]);

  // Auto-fill student_id and course from profile once loaded
  useEffect(() => {
    if (profile) {
      if (profile.student_id) setStudentId(profile.student_id);
      if (profile.course) setCourse(profile.course);
    }
  }, [profile]);

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId || !user) return;

    // Validate MongoDB ObjectId format (24 hex chars) before making the request
    if (!/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      setErrorMsg("Invalid booking ID. Please go back to My Tickets and try again.");
      setFetchState("error");
      return;
    }

    setFetchState("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { headers: authHeader() });

      if (res.status === 401) {
        toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
        navigate("/auth");
        return;
      }

      if (res.status === 404) {
        setFetchState("not_found");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      setBooking(data);
      setFetchState("success");
    } catch (err: any) {
      console.error("[TicketGenerator] fetch error:", err);
      setErrorMsg(err.message || "Unable to load booking details. Please check your connection and try again.");
      setFetchState("error");
    }
  }, [bookingId, user, navigate]);

  // Trigger fetch once user + bookingId are available
  useEffect(() => {
    if (user && bookingId) fetchBookingDetails();
  }, [fetchBookingDetails]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate()} | ${d.getMonth() + 1} | ${d.getFullYear()}`;
  };

  const formatSeatInfo = (): string => {
    const seats = booking?.booking_seats;
    if (!seats?.length) return "N/A";
    return seats
      .map((bs: any) => {
        const seat = bs.seat;
        if (!seat) return null;
        return `${seat.row ?? ""}${seat.number ?? ""}`;
      })
      .filter(Boolean)
      .join(", ");
  };

  const allSeats = (booking?.booking_seats ?? [])
    .map((bs: any) => bs.seat)
    .filter(Boolean);


  const studentName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "N/A";
  const eventTitle  = booking?.event?.title ?? booking?.event_id?.title ?? "";
  const eventDate   = booking?.event?.date  ?? booking?.event_id?.date  ?? "";
  const canGenerate = studentId.trim().length > 0 && course.trim().length > 0;

  const generateTicket = () => {
    if (!canGenerate) {
      toast({ title: "Missing fields", description: "Please fill in Student ID and Course to generate the ticket.", variant: "destructive" });
      return;
    }
    setIsGeneratingTicket(true);
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: null, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${(eventTitle || "ticket").replace(/\s+/g, "-")}-${studentId}.png`;
      link.click();
      toast({ title: "Downloaded!", description: "Ticket saved as PNG." });
    } catch {
      toast({ title: "Download failed", description: "Could not capture ticket image. Please try again.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (fetchState === "loading" || fetchState === "idle") {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Ticket Generator</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div><Skeleton className="h-80 w-full rounded-lg" /></div>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (fetchState === "not_found") {
    return (
      <div className="container mx-auto py-16 px-4 max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-6">Ticket Generator</h1>
        <Alert variant="destructive" className="text-left mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Booking not found</AlertTitle>
          <AlertDescription>
            This booking doesn't exist or doesn't belong to your account. It may have been cancelled.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/tickets")}>← Back to My Tickets</Button>
      </div>
    );
  }

  // ── Fetch error ────────────────────────────────────────────────────────────
  if (fetchState === "error") {
    return (
      <div className="container mx-auto py-16 px-4 max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-6">Ticket Generator</h1>
        <Alert variant="destructive" className="text-left mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load details</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
        <div className="flex justify-center gap-3">
          <Button onClick={fetchBookingDetails} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
          <Button variant="outline" onClick={() => navigate("/tickets")}>← My Tickets</Button>
        </div>
      </div>
    );
  }

  // ── Main UI (fetchState === "success") ─────────────────────────────────────
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Ticket Generator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── Form ── */}
        <div className="space-y-4">

          <div>
            <label htmlFor="universityName" className="block text-sm font-medium mb-1">University Name</label>
            <Input id="universityName" value={universityName} onChange={(e) => setUniversityName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Event Name</label>
            <Input value={eventTitle} readOnly className="bg-muted/50 cursor-default" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Student Name</label>
            <Input value={studentName} readOnly className="bg-muted/50 cursor-default" />
          </div>

          <div>
            <label htmlFor="studentId" className="block text-sm font-medium mb-1">
              Student ID <span className="text-destructive">*</span>
            </label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. BCS2022171"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Seats ({allSeats.length})</label>
              <Input value={formatSeatInfo()} readOnly className="bg-muted/50 cursor-default" title={formatSeatInfo()} />
            </div>
            <div>
              <label htmlFor="course" className="block text-sm font-medium mb-1">
                Course <span className="text-destructive">*</span>
              </label>
              <Input
                id="course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. B.Tech CSE"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Event Date</label>
            <Input value={eventDate ? formatDate(eventDate) : ""} readOnly className="bg-muted/50 cursor-default" />
          </div>

          <Button className="w-full" onClick={generateTicket} disabled={!canGenerate}>
            Generate Ticket
          </Button>
        </div>

        {/* ── Preview ── */}
        <div>
          <h2 className="text-xl font-bold mb-4">Preview</h2>

          {isGeneratingTicket ? (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div ref={ticketRef} className="max-w-md mx-auto">
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-6 px-6 relative">
                      <h2 className="text-2xl font-bold">{universityName}</h2>
                      <div className="absolute top-0 right-0 p-2">
                        <Ticket className="h-8 w-8 text-white opacity-50" />
                      </div>
                    </div>

                    <CardContent className="p-0">
                      <div className="grid grid-cols-4">
                        <div className="col-span-3 bg-white p-6 text-black">
                          <div className="mb-5">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">EVENT</p>
                            <p className="text-lg font-bold text-black">{eventTitle}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-5 mb-5">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">NAME</p>
                              <p className="font-medium text-black">{studentName}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">ID</p>
                              <p className="font-medium text-black">{studentId}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">SEAT(S) · {allSeats.length}</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {allSeats.map((seat: any, i: number) => (
                                  <span key={i} className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-1.5 py-0.5 rounded">
                                    {seat.row}{seat.number}
                                  </span>
                                ))}
                                {allSeats.length === 0 && <p className="font-medium text-black">N/A</p>}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">COURSE</p>
                              <p className="font-medium text-black">{course}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">DATE</p>
                              <p className="font-medium text-black">{eventDate ? formatDate(eventDate) : "—"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-b from-indigo-100 to-purple-100 flex items-center justify-center p-4">
                          <QrCode size={100} className="text-black" />
                        </div>
                      </div>
                      <div className="border-t border-gray-200 py-3 px-6 bg-gray-50 text-center text-xs text-gray-500">
                        Scan QR code at entry • This ticket is non-transferable
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="text-center">
                <Button onClick={downloadTicket} disabled={isDownloading} className="gap-2">
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} />}
                  {isDownloading ? "Downloading…" : "Download Ticket"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted h-80 flex items-center justify-center rounded-lg border border-dashed">
              <div className="text-center px-6">
                <QrCode size={48} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {canGenerate
                    ? 'Click "Generate Ticket" to see your ticket preview'
                    : "Fill in Student ID and Course, then click Generate Ticket"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketGenerator;

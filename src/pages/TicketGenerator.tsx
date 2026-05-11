import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode as QrPlaceholder, Download, Loader2, AlertCircle, RefreshCw, Sparkles, FileDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

type FetchState = "idle" | "loading" | "success" | "not_found" | "error";

const authHeader = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const TicketGenerator = () => {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // ── Original state (unchanged) ─────────────────────────────────────────────
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [booking, setBooking] = useState<any>(null);

  const [universityName, setUniversityName] = useState("INVERTIS UNIVERSITY");
  const [studentId, setStudentId] = useState("");
  const [course, setCourse] = useState("");

  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  // ── New state ──────────────────────────────────────────────────────────────
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  // ── Derived values (computed before effects that depend on them) ───────────
  const allSeats = (booking?.booking_seats ?? []).map((bs: any) => bs.seat).filter(Boolean);
  const studentName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "N/A";
  const eventTitle  = booking?.event?.title ?? booking?.event_id?.title ?? "";
  const eventDate   = booking?.event?.date  ?? booking?.event_id?.date  ?? "";
  const eventVenue  = booking?.event?.location ?? booking?.event_id?.location ?? "—";
  const isFree      = booking?.event?.is_free ?? false;
  const totalPrice  = booking?.total_price ?? 0;
  const canGenerate = studentId.trim().length > 0 && course.trim().length > 0;

  // ── Original effects (unchanged) ───────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to access the ticket generator.", variant: "destructive" });
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      if (profile.student_id) setStudentId(profile.student_id);
      if (profile.course) setCourse(profile.course);
    }
  }, [profile]);

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId || !user) return;

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

  useEffect(() => {
    if (user && bookingId) fetchBookingDetails();
  }, [fetchBookingDetails]);

  // ── QR code generation — reruns whenever any field or ticket visibility changes ──
  useEffect(() => {
    if (!isGeneratingTicket) return;
    const seats = (booking?.booking_seats ?? [])
      .map((bs: any) => bs.seat)
      .filter(Boolean)
      .map((s: any) => `${s.row ?? ""}${s.number ?? ""}`);

    const payload = JSON.stringify({
      app: "SeatSync",
      event: eventTitle,
      student: studentName,
      id: studentId,
      course,
      seats,
      date: eventDate,
      org: universityName,
    });

    QRCode.toDataURL(payload, { width: 400, margin: 2, color: { dark: "#ffffff", light: "#00000000" } })
      .then(setQrDataUrl)
      .catch((err) => console.error("[TicketGenerator] QR gen error:", err));
  }, [isGeneratingTicket, universityName, studentId, course, eventTitle, studentName, eventDate, booking]);

  // ── Helpers (unchanged) ────────────────────────────────────────────────────
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

  // ── Original generateTicket handler (unchanged) ────────────────────────────
  const generateTicket = () => {
    if (!canGenerate) {
      toast({ title: "Missing fields", description: "Please fill in Student ID and Course to generate the ticket.", variant: "destructive" });
      return;
    }
    setIsGeneratingTicket(true);
  };

  // ── Capture helper: always renders at fixed desktop layout (720px) ───────────
  const captureTicketForExport = async (): Promise<HTMLCanvasElement> => {
    const el = ticketRef.current!;

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.zIndex = "-9999";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);

    const clone = el.cloneNode(true) as HTMLElement;

    clone.style.display = "flex";
    clone.style.flexDirection = "row";
    clone.style.width = "720px";
    clone.style.minWidth = "720px";
    clone.style.maxWidth = "720px";
    clone.style.borderRadius = "16px";
    clone.style.overflow = "hidden";
    clone.style.position = "relative";
    clone.style.border = "1px solid rgba(255,255,255,0.08)";

    const stub = clone.querySelector(".ticket-stub") as HTMLElement | null;
    if (stub) {
      stub.style.width = "130px";
      stub.style.minWidth = "130px";
      stub.style.maxWidth = "130px";
      stub.style.flexShrink = "0";
      stub.style.flexDirection = "column";
      stub.style.background = "#1e1b4b";
      stub.style.borderLeft = "2px dashed rgba(255,255,255,0.3)";
      stub.style.borderTop = "none";
      stub.style.borderRadius = "";
      stub.style.padding = "18px 14px";
      stub.style.display = "flex";
      stub.style.alignItems = "center";
      stub.style.justifyContent = "space-between";
      stub.style.color = "white";
    }

    container.appendChild(clone);

    try {
      return await html2canvas(clone, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        windowWidth: 1920,
      });
    } finally {
      document.body.removeChild(container);
    }
  };

  // ── PNG download ───────────────────────────────────────────────────────────
  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await captureTicketForExport();
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `seatsync-ticket-${studentId}.png`;
      link.click();
      toast({ title: "Downloaded!", description: "Ticket saved as PNG." });
    } catch {
      toast({ title: "Download failed", description: "Could not capture ticket image. Please try again.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  // ── PDF download ───────────────────────────────────────────────────────────
  const downloadPdf = async () => {
    if (!ticketRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const canvas = await captureTicketForExport();
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 3, canvas.height / 3] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 3, canvas.height / 3, undefined, "NONE");
      pdf.save(`seatsync-ticket-${studentId}.pdf`);
      toast({ title: "Downloaded!", description: "Ticket saved as PDF." });
    } catch {
      toast({ title: "Download failed", description: "Could not generate PDF. Please try again.", variant: "destructive" });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const anyDownloading = isDownloading || isDownloadingPdf;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (fetchState === "loading" || fetchState === "idle") {
    return (
      <div className="container mx-auto py-10 px-4 max-w-6xl">
        <Skeleton className="h-9 w-56 mb-2" />
        <Skeleton className="h-4 w-72 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <Skeleton className="h-52 w-full rounded-2xl" />
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

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Ticket Generator</h1>
        <p className="text-sm text-muted-foreground">Generate and download your event ticket</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* ── Form panel ────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Ticket Details</h2>
          <div className="space-y-4">

            <div>
              <label htmlFor="universityName" className="block text-sm font-medium text-muted-foreground mb-1.5">
                University Name
              </label>
              <Input id="universityName" value={universityName} onChange={(e) => setUniversityName(e.target.value)} className="rounded-lg" />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Event Name</label>
              <Input value={eventTitle} readOnly className="bg-muted/50 cursor-default rounded-lg" />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Student Name</label>
              <Input value={studentName} readOnly className="bg-muted/50 cursor-default rounded-lg" />
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Student ID <span className="text-destructive text-xs">*</span>
              </label>
              <Input id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. BCS2022171" className="rounded-lg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Seats ({allSeats.length})</label>
                <Input value={formatSeatInfo()} readOnly className="bg-muted/50 cursor-default rounded-lg" title={formatSeatInfo()} />
              </div>
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Course <span className="text-destructive text-xs">*</span>
                </label>
                <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. B.Tech CSE" className="rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Event Date</label>
              <Input value={eventDate ? formatDate(eventDate) : ""} readOnly className="bg-muted/50 cursor-default rounded-lg" />
            </div>

            <Button className="w-full rounded-lg py-3 font-medium gap-2" onClick={generateTicket} disabled={!canGenerate}>
              <Sparkles className="h-4 w-4" />
              Generate Ticket
            </Button>
          </div>
        </div>

        {/* ── Preview panel ─────────────────────────────────────────────────── */}
        <div className="md:sticky md:top-24">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Preview</p>

          {isGeneratingTicket ? (
            <div className="space-y-4">

              {/* ── Ticket card ── */}
              <div ref={ticketRef} className="ticket-wrapper">

                {/* Main section */}
                <div style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 45%, #4338CA 100%)",
                  padding: "24px 22px 20px",
                  color: "white",
                  minWidth: 0,
                }}>

                  {/* Top row: org + event-type badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>
                      {universityName}
                    </span>
                    <span style={{ fontSize: 10, whiteSpace: "nowrap", flexShrink: 0, display: "inline-flex", alignItems: "center", lineHeight: "1", opacity: 0.75 }}>
                      {isFree ? "Free · Event" : "Paid · Event"}
                    </span>
                  </div>

                  {/* Event name */}
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, marginTop: 10, marginBottom: 18 }}>
                    {eventTitle || "Event Name"}
                  </div>

                  {/* Info grid: Name | Student ID | Course */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                    {[
                      { label: "NAME",       value: studentName },
                      { label: "STUDENT ID", value: studentId || "—" },
                      { label: "COURSE",     value: course || "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, display: "block", marginBottom: 3 }}>
                          {label}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Seats */}
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, display: "block", marginBottom: 5 }}>
                      SEAT(S) · {allSeats.length}
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {allSeats.length > 0 ? allSeats.map((seat: any, i: number) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: "1", letterSpacing: "0.04em", paddingRight: "6px" }}>
                          {seat.row}{seat.number}
                        </span>
                      )) : (
                        <span style={{ fontSize: 13, fontWeight: 500 }}>N/A</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom meta: Date | Venue | Price */}
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 12, marginTop: 14 }}>
                    {[
                      { label: "DATE",  value: eventDate ? formatDate(eventDate) : "—" },
                      { label: "VENUE", value: eventVenue },
                      { label: "PRICE", value: isFree ? "Free" : totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, display: "block", marginBottom: 3 }}>
                          {label}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tear stub */}
                <div className="ticket-stub">
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.45, display: "block", marginBottom: 2 }}>EVENT</span>
                    <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, opacity: 0.9, display: "block" }}>
                      {(eventTitle || "Event").split(" ").slice(0, 3).join(" ")}
                    </span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.45, display: "block", marginBottom: 4 }}>SCAN</span>
                    {qrDataUrl ? (
                      <img src={qrDataUrl} width={72} height={72} style={{ borderRadius: 6 }} alt="QR code" />
                    ) : (
                      <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
                        <QrPlaceholder size={48} />
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.45, display: "block", marginBottom: 2 }}>SEATS</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.05em" }}>
                      {formatSeatInfo()}
                    </span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.45, display: "block", marginBottom: 2 }}>DATE</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>
                      {eventDate ? formatDate(eventDate) : "—"}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.4 }}>
                    SEATSYNC
                  </span>
                </div>
              </div>

              {/* Download buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={downloadTicket} disabled={anyDownloading} className="flex-1 gap-2 rounded-lg">
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {isDownloading ? "Generating…" : "Download PNG"}
                </Button>
                <Button variant="outline" onClick={downloadPdf} disabled={anyDownloading} className="flex-1 gap-2 rounded-lg">
                  {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                  {isDownloadingPdf ? "Generating…" : "Download PDF"}
                </Button>
              </div>

            </div>
          ) : (
            <div className="bg-muted h-52 flex items-center justify-center rounded-2xl border border-dashed border-border">
              <div className="text-center px-6">
                <QrPlaceholder size={40} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">
                  {canGenerate
                    ? 'Click "Generate Ticket" to preview your ticket'
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Download, 
  Edit, 
  Eye, 
  Lock, 
  MoreHorizontal, 
  Plus, 
  Ticket, 
  Trash2, 
  TrendingUp, 
  Users, 
  XCircle, 
  Minus 
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  
  // Event form
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("19:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventPrice, setEventPrice] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [publishEvent, setPublishEvent] = useState(false);
  const [isFreeEvent, setIsFreeEvent] = useState(false);
  const [maxSeatsPerUser, setMaxSeatsPerUser] = useState(10);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  
  // Seat management state
  const [showSeatDialog, setShowSeatDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const [rows, setRows] = useState<string[]>(["A", "B", "C"]);
  const [seatsPerRow, setSeatsPerRow] = useState(15);
  const [seatPrice, setSeatPrice] = useState("");
  const [customLayout, setCustomLayout] = useState(true);
  const [numberOfRows, setNumberOfRows] = useState(15);
  const [numberOfColumns, setNumberOfColumns] = useState(15);
  const [sectionNames, setSectionNames] = useState({
    front: "FRONT",
    middle: "BACKSIDE",
    back: "BALCONY"
  });
  const [previewVisible, setPreviewVisible] = useState(true);
  
  // Booking details dialog
  const [showBookingDetailsDialog, setShowBookingDetailsDialog] = useState(false);
  const [selectedEventBookings, setSelectedEventBookings] = useState<any[]>([]);
  const [eventBookingsTitle, setEventBookingsTitle] = useState("");
  
  // User details dialog
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  // Search and action loading
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Analytics ──────────────────────────────────────────────────────────────
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTitle, setAnalyticsTitle] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Seat Control ───────────────────────────────────────────────────────────
  const [showSeatControlDialog, setShowSeatControlDialog] = useState(false);
  const [seatCtrlEventId, setSeatCtrlEventId] = useState<string | null>(null);
  const [seatCtrlEventTitle, setSeatCtrlEventTitle] = useState("");
  const [seatCtrlSeats, setSeatCtrlSeats] = useState<any[]>([]);
  const [seatCtrlSelected, setSeatCtrlSelected] = useState<string[]>([]);
  const [seatCtrlLoading, setSeatCtrlLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSeat, setDragStartSeat] = useState<string | null>(null);
  const [seatCtrlAction, setSeatCtrlAction] = useState<"book" | "vip" | "blocked" | "available">("vip");
  const [seatCtrlUserEmail, setSeatCtrlUserEmail] = useState("");
  const [seatCtrlNote, setSeatCtrlNote] = useState("");

  // ── Check-in ───────────────────────────────────────────────────────────────
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null);

  // ── Booking toggle loading (per event) ────────────────────────────────────
  const [bookingToggleLoading, setBookingToggleLoading] = useState<string | null>(null);

  // ── Export users ───────────────────────────────────────────────────────────
  const [exportUsersLoading, setExportUsersLoading] = useState(false);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
      fetchBookings();
      fetchUsers();
    }
  }, [isAdmin]);

  const checkAdmin = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to verify admin status");
      const data = await response.json();

      if (!data.is_admin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error: any) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      console.log("Fetching events for admin dashboard");
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/events", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        console.error("Error fetching events:", response.status);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
        return;
      }
      const data = await response.json();
      console.log("Events fetched:", data);
      // Normalise _id → id for all JSX references to event.id
      setEvents(data.map((e: any) => ({ ...e, id: e._id ?? e.id })));
    } catch (err) {
      console.error("Exception in fetchEvents:", err);
    }
  };

  const fetchBookings = async (page = 1) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/bookings/admin?page=${page}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        console.error("Error fetching bookings:", response.status);
        return;
      }
      const result = await response.json();
      setBookings(result.data || result);
      if (result.pagination) {
        setBookingsPage(result.pagination.page);
        setBookingsTotalPages(result.pagination.totalPages);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      toast({
        title: "Error",
        description: "Failed to load bookings data",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/auth/users?page=${page}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        console.error("Error fetching users:", response.status);
        return;
      }
      const result = await response.json();
      setUsers(result.data || result);
      if (result.pagination) {
        setUsersPage(result.pagination.page);
        setUsersTotalPages(result.pagination.totalPages);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast({
        title: "Error",
        description: "Failed to load users data",
        variant: "destructive",
      });
    }
  };

  const fetchEventBookings = async (eventId: string, eventTitle: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/bookings/admin?eventId=${eventId}&limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load bookings");
      }
      const result = await response.json();
      // API returns { data: [], pagination: {} } – extract the array
      const bookingsArray = Array.isArray(result) ? result : (result.data ?? []);
      setSelectedEventBookings(bookingsArray);
      setEventBookingsTitle(eventTitle);
      setShowBookingDetailsDialog(true);
    } catch (error: any) {
      console.error("Error fetching event bookings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load bookings",
        variant: "destructive",
      });
    }
  };


  // Function to export bookings as CSV
  const exportBookingsCSV = async (eventId: string, eventTitle: string) => {
    if (!user) return;
    
    setExportLoading(eventId);
    
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/bookings/export?eventId=${eventId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to export bookings");
      }

      // API returns the CSV directly as a blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${eventTitle}-bookings.csv`;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Bookings exported successfully",
      });
    } catch (error: any) {
      console.error("Error exporting bookings:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Could not export bookings",
        variant: "destructive",
      });
    } finally {
      setExportLoading(null);
    }
  };

  const openCreateEventDialog = () => {
    resetEventForm();
    setShowEventDialog(true);
  };

  const openEditEventDialog = (event: any) => {
    setCurrentEventId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description);
    
    // Format date and time
    const eventDateTime = new Date(event.date);
    const dateString = eventDateTime.toISOString().split("T")[0];
    const hours = eventDateTime.getHours().toString().padStart(2, "0");
    const minutes = eventDateTime.getMinutes().toString().padStart(2, "0");
    
    setEventDate(dateString);
    setEventTime(`${hours}:${minutes}`);
    
    setEventLocation(event.location);
    setEventPrice(event.price.toString());
    setEventCategory(event.category);
    setEventImageUrl(event.image_url || "");
    setPublishEvent(event.is_published);
    setIsFreeEvent(event.is_free || false);
    setMaxSeatsPerUser(event.max_seats_per_user || 10);
    
    setShowEventDialog(true);
  };

  const resetEventForm = () => {
    setCurrentEventId(null);
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventTime("19:00");
    setEventLocation("");
    setEventPrice("");
    setEventCategory("");
    setEventImageUrl("");
    setPublishEvent(false);
    setIsFreeEvent(false);
    setMaxSeatsPerUser(10);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create events",
        variant: "destructive",
      });
      return;
    }
    
    // Validate form
    if (!eventTitle || !eventDescription || !eventDate || !eventLocation || (!isFreeEvent && !eventPrice) || !eventCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Combine date and time
      const dateTime = new Date(`${eventDate}T${eventTime}`);
      
      const eventData = {
        title: eventTitle,
        description: eventDescription,
        date: dateTime.toISOString(),
        location: eventLocation,
        price: isFreeEvent ? 0 : parseFloat(eventPrice),
        category: eventCategory,
        image_url: eventImageUrl || null,
        is_published: publishEvent,
        created_by: user.id, // Ensure this is set to the current user's ID
        is_free: isFreeEvent,
        max_seats_per_user: maxSeatsPerUser
      };
      
      console.log("Creating event with data:", eventData);
      
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let response: Response;
      if (currentEventId) {
        // Update existing event
        response = await fetch(`/api/events/${currentEventId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(eventData),
        });
      } else {
        // Create new event
        response = await fetch("/api/events", {
          method: "POST",
          headers,
          body: JSON.stringify(eventData),
        });
      }

      const result = await response.json();
      if (!response.ok) {
        console.error("Error result:", result);
        throw new Error(result.error || "Failed to save event");
      }
      
      toast({
        title: "Success",
        description: currentEventId ? "Event updated successfully" : "Event created successfully",
      });
      
      fetchEvents();
      setShowEventDialog(false);
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This will also delete all bookings and seats for this event.")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete event");
      }
      
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      
      fetchEvents();
      fetchBookings();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const openManageSeatsDialog = (event: any) => {
    setSelectedEventId(event.id);
    setSelectedEventTitle(event.title);
    setCustomLayout(true); // Default to custom layout
    setNumberOfRows(15); // Default to 15 rows
    setNumberOfColumns(15); // Default to 15 columns
    setSeatPrice(event.price.toString());
    setShowSeatDialog(true);
  };

  const generateRowLetters = (count: number) => {
    const letters = [];
    for (let i = 0; i < count; i++) {
      // Generate row letters (A, B, C, ..., Z, AA, AB, ...)
      if (i < 26) {
        letters.push(String.fromCharCode(65 + i));
      } else {
        const first = String.fromCharCode(65 + Math.floor((i - 26) / 26));
        const second = String.fromCharCode(65 + ((i - 26) % 26));
        letters.push(first + second);
      }
    }
    return letters;
  };

  const handleSeatGeneration = async () => {
    if (!selectedEventId || !seatPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // The API handles seat deletion + generation server-side atomically
      const response = await fetch("/api/seats/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId: selectedEventId,
          seatPrice,
          customLayout,
          rows,
          seatsPerRow,
          numberOfRows,
          numberOfColumns,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create seats");

      toast({
        title: "Success",
        description: `${result.count} seats created successfully`,
      });
      setShowSeatDialog(false);
    } catch (error: any) {
      console.error("Error creating seats:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create seats",
        variant: "destructive",
      });
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    setActionLoading(bookingId);
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/bookings/status", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ bookingId, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update booking");
      toast({ title: "Updated", description: `Booking marked as ${status}` });
      fetchBookings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAdminRole = async (userId: string, makeAdmin: boolean) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/auth/update-role", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ userId, is_admin: makeAdmin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update role");
      toast({
        title: "Success",
        description: makeAdmin ? "User promoted to admin" : "Admin role removed",
      });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const duplicateEvent = async (event: any) => {
    setActionLoading(event.id + "-dup");
    try {
      const { id, _id, __v, created_at, updated_at, createdAt, updatedAt, ...eventData } = event;
      const newEvent = {
        ...eventData,
        title: `${event.title} (Copy)`,
        is_published: false,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: user?.id,
      };
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/events", {
        method: "POST",
        headers,
        body: JSON.stringify(newEvent),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to duplicate event");
      toast({ title: "Duplicated", description: "Event copied as draft" });
      fetchEvents();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const resetEventSeats = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Reset ALL seats for "${eventTitle}"? This will cancel all bookings.`)) return;
    setActionLoading(eventId + "-reset");
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/seats/reset", {
        method: "POST",
        headers,
        body: JSON.stringify({ eventId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to reset seats");
      toast({ title: "Reset", description: `${result.seatsReset} seats reset to available` });
      fetchBookings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const fetchEventAnalytics = async (eventId: string, title: string) => {
    setAnalyticsTitle(title);
    setAnalyticsData(null);
    setAnalyticsLoading(true);
    setShowAnalyticsDialog(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/admin/analytics?eventId=${eventId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load analytics");
      setAnalyticsData(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setShowAnalyticsDialog(false);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const openSeatControl = async (event: any) => {
    setSeatCtrlEventId(event.id);
    setSeatCtrlEventTitle(event.title);
    setSeatCtrlSelected([]);
    setSeatCtrlAction("vip");
    setSeatCtrlUserEmail("");
    setSeatCtrlNote("");
    setShowSeatControlDialog(true);
    setSeatCtrlLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/seats?eventId=${event.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load seats");
      setSeatCtrlSeats(Array.isArray(data) ? data : data.seats ?? []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSeatCtrlLoading(false);
    }
  };

  const toggleSeatCtrlSelect = (seatId: string, isDrag = false) => {
    if (isDrag && !isDragging) return;
    setSeatCtrlSelected((prev) => {
      if (isDrag && dragStartSeat) {
        const seatIdx = seatCtrlSeats.findIndex((s) => (s._id ?? s.id) === seatId);
        const startIdx = seatCtrlSeats.findIndex((s) => (s._id ?? s.id) === dragStartSeat);
        if (seatIdx !== -1 && startIdx !== -1) {
          const min = Math.min(seatIdx, startIdx);
          const max = Math.max(seatIdx, startIdx);
          const newSelection = seatCtrlSeats.slice(min, max + 1).map((s) => s._id ?? s.id);
          return [...new Set([...prev, ...newSelection])];
        }
      }
      return prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId];
    });
  };

  const handleSeatMouseDown = (seatId: string) => {
    setIsDragging(true);
    setDragStartSeat(seatId);
    toggleSeatCtrlSelect(seatId);
  };

  const handleSeatMouseEnter = (seatId: string) => {
    if (isDragging && dragStartSeat) {
      toggleSeatCtrlSelect(seatId, true);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStartSeat(null);
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [isDragging, dragStartSeat]);

  const executeSeatCtrlAction = async () => {
    if (!seatCtrlSelected.length || !seatCtrlEventId) return;
    setSeatCtrlLoading(true);
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      if (seatCtrlAction === "book") {
        const res = await fetch("/api/admin/booking", {
          method: "POST",
          headers,
          body: JSON.stringify({
            eventId: seatCtrlEventId,
            seatIds: seatCtrlSelected,
            targetUserEmail: seatCtrlUserEmail || undefined,
            booking_note: seatCtrlNote || "Admin VIP/manual booking",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to book seats");
        toast({ title: "Booked!", description: `${data.seats_booked} seat(s) booked successfully.` });
      } else {
        const seat_type = seatCtrlAction === "available" ? "standard" : seatCtrlAction;
        const res = await fetch("/api/admin/seat-type", {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            seatIds: seatCtrlSelected,
            seat_type,
            forceStatus: seatCtrlAction === "available" ? "available" : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update seats");
        if (seatCtrlAction === "available" && data.cancelledBookings > 0) {
          toast({
            title: "✅ Seats Reset",
            description: `${data.modified} seat(s) freed. ${data.cancelledBookings} booking(s) cancelled and removed from user's tickets.`,
          });
        } else {
          toast({ title: "Updated!", description: `${data.modified} seat(s) marked as ${seatCtrlAction}.` });
        }
      }
      setSeatCtrlSelected([]);
      await openSeatControl({ id: seatCtrlEventId, title: seatCtrlEventTitle });
      fetchBookings();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSeatCtrlLoading(false);
    }
  };

  const toggleCheckIn = async (bookingId: string, currentVal: boolean) => {
    setCheckInLoading(bookingId);
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ bookingId, checked_in: !currentVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update check-in");
      toast({ title: !currentVal ? "Checked In ✓" : "Check-in Removed", description: `Booking ${bookingId.substring(0, 8)} updated.` });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, checked_in: !currentVal } : b))
      );
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCheckInLoading(null);
    }
  };

  const exportUsersCSV = async () => {
    setExportUsersLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/admin/export-users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users-export.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Exported!", description: "User database downloaded as CSV." });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    } finally {
      setExportUsersLoading(false);
    }
  };

  // ── Ban User ───────────────────────────────────────────────────────────────
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banContext, setBanContext] = useState<{ eventId?: string; eventTitle?: string; userId?: string; userEmail?: string }>({});

  const banUserFromEvent = async (eventId: string, userId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/admin/event-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ eventId, action: "ban_user", userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ban user");
      toast({ title: "Banned", description: "User banned from this event" });
      fetchEvents();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const unbanUserFromEvent = async (eventId: string, userId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/admin/event-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ eventId, action: "unban_user", userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unban user");
      toast({ title: "Unbanned", description: "User unbanned from this event" });
      fetchEvents();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPublishStatusBadge = (isPublished: boolean) => {
    return isPublished ? (
      <Badge className="bg-green-100 text-green-800">Published</Badge>
    ) : (
      <Badge variant="outline" className="border-amber-300 text-amber-600">
        Draft
      </Badge>
    );
  };

  const renderSeatPreview = () => {
    if (!previewVisible) return null;
    
    const previewRows = customLayout ? 
      generateRowLetters(Math.min(numberOfRows, 6)) : 
      rows.slice(0, Math.min(rows.length, 6));
      
    const previewColumns = customLayout ?
      Math.min(numberOfColumns, 15) :
      Math.min(seatsPerRow, 15);
      
    return (
      <div className="border p-4 rounded-md bg-gray-50 mt-4">
        <h4 className="text-center font-semibold mb-2">Seating Preview</h4>
        
        {customLayout && (
          <div className="flex flex-col items-center">
            <div className="bg-gray-200 w-3/4 mx-auto text-center py-1 text-xs rounded-t-lg mb-1">
              {sectionNames.back}
            </div>
            
            <div className="flex flex-col items-center gap-1 mb-4">
              {previewRows.slice(0, 2).map((row, i) => (
                <div key={`preview-back-${i}`} className="flex gap-1">
                  <span className="text-xs w-4">{row}</span>
                  {[...Array(previewColumns)].map((_, j) => (
                    <div key={`seat-back-${i}-${j}`} className="w-4 h-4 bg-secondary rounded-sm flex items-center justify-center text-[8px]">
                      {j+1}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="bg-gray-200 w-3/4 mx-auto text-center py-1 text-xs mb-1">
              {sectionNames.middle}
            </div>
            
            <div className="flex flex-col items-center gap-1 mb-4">
              {previewRows.slice(2, 4).map((row, i) => (
                <div key={`preview-middle-${i}`} className="flex gap-1">
                  <span className="text-xs w-4">{row}</span>
                  {[...Array(previewColumns)].map((_, j) => (
                    <div key={`seat-middle-${i}-${j}`} className="w-4 h-4 bg-secondary rounded-sm flex items-center justify-center text-[8px]">
                      {j+1}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="bg-gray-200 w-3/4 mx-auto text-center py-1 text-xs mb-1">
              {sectionNames.front}
            </div>
            
            <div className="flex flex-col items-center gap-1 mb-4">
              {previewRows.slice(4, 6).map((row, i) => (
                <div key={`preview-front-${i}`} className="flex gap-1">
                  <span className="text-xs w-4">{row}</span>
                  {[...Array(previewColumns)].map((_, j) => (
                    <div key={`seat-front-${i}-${j}`} className="w-4 h-4 bg-secondary rounded-sm flex items-center justify-center text-[8px]">
                      {j+1}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="bg-gray-200 w-1/2 mx-auto text-center py-1 text-xs rounded-t-lg mt-2">
              STAGE
            </div>
          </div>
        )}
        
        {!customLayout && (
          <div className="flex flex-col items-center">
            {previewRows.map((row, i) => (
              <div key={`preview-row-${i}`} className="flex gap-1 mb-1">
                <span className="text-xs w-4">{row}</span>
                {[...Array(previewColumns)].map((_, j) => (
                  <div key={`seat-${i}-${j}`} className="w-4 h-4 bg-secondary rounded-sm flex items-center justify-center text-[8px]">
                    {j+1}
                  </div>
                ))}
              </div>
            ))}
            
            <div className="bg-gray-200 w-1/2 mx-auto text-center py-1 text-xs rounded-t-lg mt-4">
              STAGE
            </div>
          </div>
        )}
        
        <p className="text-xs text-center mt-4 text-gray-500">
          This is just a preview. The actual layout will have {customLayout ? numberOfRows : rows.length} rows and {customLayout ? numberOfColumns : seatsPerRow} seats per row.
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  const q = searchQuery.toLowerCase();
  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      (e.location || "").toLowerCase().includes(q) ||
      (e.category || "").toLowerCase().includes(q)
  );
  const filteredBookings = bookings.filter(
    (b) =>
      (b.events?.title || "").toLowerCase().includes(q) ||
      (b.profiles?.first_name || "").toLowerCase().includes(q) ||
      (b.profiles?.last_name || "").toLowerCase().includes(q) ||
      (b.profiles?.email || "").toLowerCase().includes(q)
  );
  const filteredUsers = users.filter(
    (u) =>
      (u.first_name || "").toLowerCase().includes(q) ||
      (u.last_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">Manage events, bookings and seats</p>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{events.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{events.filter(e => e.is_published).length} published</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{bookings.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{bookings.filter((b: any) => b.status === 'confirmed').length} confirmed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{users.filter((u: any) => u.is_admin).length} admins</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">
                  ${bookings.filter((b: any) => b.status === 'confirmed').reduce((sum: number, b: any) => sum + (b.total_price ?? 0), 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">confirmed bookings</p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Booking Trend (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={(() => {
                    const trend: Record<string, number> = {};
                    bookings.forEach((b: any) => {
                      const date = new Date(b.created_at).toLocaleDateString();
                      trend[date] = (trend[date] || 0) + 1;
                    });
                    const last30 = Object.entries(trend).slice(-30).map(([date, count]) => ({ date, count }));
                    return last30;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue by Event</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(() => {
                    const revenue: Record<string, number> = {};
                    bookings.forEach((b: any) => {
                      if (b.status === 'confirmed') {
                        const title = b.events?.title || 'Unknown';
                        revenue[title] = (revenue[title] || 0) + (b.total_price || 0);
                      }
                    });
                    return Object.entries(revenue).map(([title, amount]) => ({ title, amount })).slice(0, 10);
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Booking Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Booking Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {([
                  { label: 'Confirmed', key: 'confirmed', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
                  { label: 'Cancelled', key: 'cancelled', icon: <XCircle className="h-4 w-4 text-red-500" /> },
                  { label: 'Pending',   key: 'pending',   icon: <Clock className="h-4 w-4 text-amber-500" /> },
                ] as const).map(({ label, key, icon }) => {
                  const count = bookings.filter((b: any) => b.status === key).length;
                  const pct = bookings.length ? Math.round((count / bookings.length) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">{icon}<span className="text-sm">{label}</span></div>
                        <span className="text-sm font-medium">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${ key === 'confirmed' ? 'bg-green-500' : key === 'cancelled' ? 'bg-red-500' : 'bg-amber-500' }`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Events by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Events by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const cats: Record<string, number> = {};
                  events.forEach((e: any) => { cats[e.category || 'Uncategorized'] = (cats[e.category || 'Uncategorized'] || 0) + 1; });
                  const total = events.length || 1;
                  return Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([cat, cnt]) => (
                    <div key={cat}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{cat}</span>
                        <span className="text-sm font-medium">{cnt}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((cnt / total) * 100)}%` }} />
                      </div>
                    </div>
                  ));
                })()}
                {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet</p>}
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Bookings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No bookings yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.slice(0, 8).map((b: any) => (
                        <TableRow key={b._id ?? b.id}>
                          <TableCell className="font-medium text-sm">{b.event?.title ?? b.events?.title ?? '—'}</TableCell>
                          <TableCell className="text-sm">{b.user?.email ?? b.profiles?.email ?? '—'}</TableCell>
                          <TableCell className="text-sm">{(b.events?.is_free || b.is_free) ? <span className="text-green-600 font-medium">Free</span> : `$${(b.total_price ?? 0).toFixed(2)}`}</TableCell>
                          <TableCell>
                            <Badge className={b.status === 'confirmed' ? 'bg-green-100 text-green-800' : b.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                              {b.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(b.created_at ?? b.createdAt ?? '')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{events.filter(e => e.is_published).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{events.filter(e => !e.is_published).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Events Management</CardTitle>
                  <CardDescription>Create and manage events</CardDescription>
                </div>
                <Button onClick={openCreateEventDialog}>Create New Event</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg mb-2">No events found</p>
                  <p className="text-muted-foreground mb-6">
                    Start by creating your first event
                  </p>
                  <Button onClick={openCreateEventDialog}>Create Event</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>{formatDate(event.date)}</TableCell>
                          <TableCell>{event.category}</TableCell>
                          <TableCell>{event.is_free ? "Free" : `$${event.price.toFixed(2)}`}</TableCell>
                          <TableCell>{getPublishStatusBadge(event.is_published)}</TableCell>
                          <TableCell>{event.total_seats || 0}</TableCell>
                          <TableCell>{event.sold_seats || 0}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditEventDialog(event)}
                                disabled={!!actionLoading}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={event.is_bookings_open !== false ? "default" : "destructive"}
                                onClick={async () => {
                                  setBookingToggleLoading(event.id);
                                  try {
                                    const token = localStorage.getItem("auth_token");
                                    const res = await fetch("/api/admin/event-control", {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                      body: JSON.stringify({ eventId: event.id, action: "toggle_bookings" }),
                                    });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error || "Failed to toggle bookings");
                                    // Optimistic local update
                                    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_bookings_open: data.is_bookings_open } : e));
                                    toast({ title: data.is_bookings_open ? "✅ Bookings Opened" : "🔒 Bookings Closed", description: data.is_bookings_open ? "Users can now book seats" : "No new bookings allowed" });
                                  } catch (err: any) {
                                    toast({ title: "Error", description: err.message, variant: "destructive" });
                                    fetchEvents(); // Revert on error
                                  } finally {
                                    setBookingToggleLoading(null);
                                  }
                                }}
                                disabled={bookingToggleLoading === event.id}
                                className="min-w-[130px]"
                              >
                                {bookingToggleLoading === event.id
                                  ? "Updating..."
                                  : event.is_bookings_open !== false
                                    ? "Close Bookings"
                                    : "Open Bookings"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openManageSeatsDialog(event)}
                                disabled={!!actionLoading}
                              >
                                Seats
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchEventBookings(event.id, event.title)}
                                disabled={!!actionLoading}
                              >
                                <Ticket className="h-4 w-4 mr-1" /> Bookings
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportBookingsCSV(event.id, event.title)}
                                disabled={exportLoading === event.id || !!actionLoading}
                              >
                                {exportLoading === event.id ? (
                                  <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Exporting...
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <Download className="h-4 w-4 mr-1" /> Export CSV
                                  </span>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchEventAnalytics(event.id, event.title)}
                                disabled={!!actionLoading}
                              >
                                Analytics
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openSeatControl(event)}
                                disabled={!!actionLoading}
                              >
                                Seat Control
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => duplicateEvent(event)}
                                disabled={actionLoading === event.id + "-dup"}
                              >
                                {actionLoading === event.id + "-dup" ? "Copying..." : "Duplicate"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resetEventSeats(event.id, event.title)}
                                disabled={actionLoading === event.id + "-reset"}
                              >
                                {actionLoading === event.id + "-reset" ? "Resetting..." : "Reset Seats"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteEvent(event.id)}
                                disabled={actionLoading === event.id}
                              >
                                {actionLoading === event.id ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'confirmed').length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{bookings.filter(b => b.status === 'cancelled').length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.total_price, 0).toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>View all bookings across events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg mb-2">No bookings found</p>
                  <p className="text-muted-foreground">
                    Bookings will appear here when users make purchases
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.id.substring(0, 8)}</TableCell>
                          <TableCell>{booking.events?.title || "Unknown"}</TableCell>
                          <TableCell>
                            {booking.profiles?.first_name || "Unknown"}{" "}
                            {booking.profiles?.last_name || ""}
                          </TableCell>
                          <TableCell>{formatDate(booking.created_at)}</TableCell>
                          <TableCell>{(booking.events?.is_free || booking.is_free) ? <span className="text-green-600 font-medium">Free</span> : `$${booking.total_price.toFixed(2)}`}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                booking.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : booking.status === "refunded"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={booking.checked_in ? "default" : "outline"}
                              className={booking.checked_in ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                              onClick={() => toggleCheckIn(booking.id, !!booking.checked_in)}
                              disabled={checkInLoading === booking.id || booking.status !== "confirmed"}
                            >
                              {checkInLoading === booking.id ? "…" : booking.checked_in ? "✓ In" : "Check In"}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <select
                              value={booking.status}
                              onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                              disabled={actionLoading === booking.id}
                              className="text-sm border rounded px-2 py-1 bg-background"
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.is_admin).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold">{users.filter(u => new Date(u.created_at || u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage registered users</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportUsersCSV} disabled={exportUsersLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    {exportUsersLoading ? "Exporting…" : "Export CSV"}
                  </Button>
                  <Button variant="outline" onClick={() => fetchUsers()}>
                    <Users className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg mb-2">No users found</p>
                  <p className="text-muted-foreground">
                    Users will appear here when they register
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-xs">{u.id.substring(0, 8)}…</TableCell>
                          <TableCell>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "N/A"}</TableCell>
                          <TableCell className="text-sm">{u.email || "—"}</TableCell>
                          <TableCell className="text-sm font-mono">{u.student_id || "—"}</TableCell>
                          <TableCell className="text-sm">{u.course || "—"}</TableCell>
                          <TableCell className="text-sm">{u.phone_number || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.booking_count ?? 0}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(u.created_at)}</TableCell>
                          <TableCell>
                            {u.is_admin ? (
                              <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                            ) : (
                              <Badge variant="outline">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setBanContext({ userId: u.id, userEmail: u.email }); setShowBanDialog(true); }}
                                disabled={!!actionLoading}
                              >
                                Ban from Event
                              </Button>
                              <Button
                                size="sm"
                                variant={u.is_admin ? "destructive" : "outline"}
                                onClick={() => toggleAdminRole(u.id, !u.is_admin)}
                                disabled={u.id === user?.id || actionLoading === u.id}
                              >
                                {actionLoading === u.id ? "Saving…" : u.is_admin ? "Remove Admin" : "Make Admin"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedUser(u); setShowUserDialog(true); }}
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Form Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleEventSubmit}>
            <DialogHeader>
              <DialogTitle>
                {currentEventId ? "Edit Event" : "Create New Event"}
              </DialogTitle>
              <DialogDescription>
                {currentEventId
                  ? "Make changes to the event details"
                  : "Fill in the details for the new event"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Enter event description"
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Enter event location"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <Switch
                    id="isFreeEvent"
                    checked={isFreeEvent}
                    onCheckedChange={setIsFreeEvent}
                  />
                  <Label htmlFor="isFreeEvent">Free Event</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value)}
                      placeholder="Enter event category"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price {isFreeEvent && "(Free)"}</Label>
                    <Input
                      id="price"
                      type="number"
                      value={isFreeEvent ? "0" : eventPrice}
                      onChange={(e) => setEventPrice(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={isFreeEvent}
                      required={!isFreeEvent}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxSeatsPerUser">Maximum seats per user</Label>
                  <Input
                    id="maxSeatsPerUser"
                    type="number"
                    value={maxSeatsPerUser}
                    onChange={(e) => setMaxSeatsPerUser(parseInt(e.target.value) || 1)}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    value={eventImageUrl}
                    onChange={(e) => setEventImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="publishEvent"
                    checked={publishEvent}
                    onCheckedChange={setPublishEvent}
                  />
                  <Label htmlFor="publishEvent">Publish event</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEventDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Seat Management Dialog */}
      <Dialog open={showSeatDialog} onOpenChange={setShowSeatDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Seats</DialogTitle>
            <DialogDescription>
              Generate seats for event: {selectedEventTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2 mb-3">
              <Switch
                id="customLayout"
                checked={customLayout}
                onCheckedChange={setCustomLayout}
              />
              <Label htmlFor="customLayout">Use theater-style seat layout</Label>
            </div>

            {customLayout ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="numberOfRows">Number of rows</Label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setNumberOfRows(Math.max(3, numberOfRows - 1))}
                          className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <Input
                          id="numberOfRows"
                          type="number"
                          value={numberOfRows}
                          onChange={(e) => setNumberOfRows(parseInt(e.target.value) || 3)}
                          min="3"
                          className="w-16 mx-1 text-center"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setNumberOfRows(numberOfRows + 1)}
                          className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="numberOfColumns">Seats per row</Label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setNumberOfColumns(Math.max(5, numberOfColumns - 1))}
                          className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <Input
                          id="numberOfColumns"
                          type="number"
                          value={numberOfColumns}
                          onChange={(e) => setNumberOfColumns(parseInt(e.target.value) || 5)}
                          min="5"
                          className="w-16 mx-1 text-center"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setNumberOfColumns(numberOfColumns + 1)}
                          className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="seatPrice">Base price per seat ($)</Label>
                  <div className="text-xs text-gray-500 mb-1">
                    Front section: Base price + $5, Middle section: Base price + $2, Back section: Base price
                  </div>
                  <Input
                    id="seatPrice"
                    type="number"
                    value={seatPrice}
                    onChange={(e) => setSeatPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Layout Preview</span>
                  <Switch
                    id="previewVisible"
                    checked={previewVisible}
                    onCheckedChange={setPreviewVisible}
                  />
                </div>

                {renderSeatPreview()}

                <div className="text-center p-2 bg-gray-50 rounded-md">
                  <p className="text-lg font-medium mb-1">Total Seats</p>
                  <p className="mb-1 text-2xl font-bold">
                    {numberOfRows * numberOfColumns}
                  </p>
                  <p className="text-xs text-gray-500">
                    This will create {numberOfRows} rows × {numberOfColumns} columns = {numberOfRows * numberOfColumns} seats
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="rowLetters">Row letters (comma-separated)</Label>
                  <Input
                    id="rowLetters"
                    value={rows.join(",")}
                    onChange={(e) => setRows(e.target.value.split(",").map(r => r.trim()))}
                    placeholder="A,B,C"
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="seatsPerRow">Seats per row</Label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setSeatsPerRow(Math.max(5, seatsPerRow - 1))}
                      className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <Input
                      id="seatsPerRow"
                      type="number"
                      value={seatsPerRow}
                      onChange={(e) => setSeatsPerRow(parseInt(e.target.value) || 5)}
                      min="5"
                      className="w-16 mx-1 text-center"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setSeatsPerRow(seatsPerRow + 1)}
                      className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="seatPrice">Price per seat ($)</Label>
                  <Input
                    id="seatPrice"
                    type="number"
                    value={seatPrice}
                    onChange={(e) => setSeatPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Layout Preview</span>
                  <Switch
                    id="previewVisible"
                    checked={previewVisible}
                    onCheckedChange={setPreviewVisible}
                  />
                </div>

                {renderSeatPreview()}
                
                <div className="text-center p-2 bg-gray-50 rounded-md">
                  <p className="text-lg font-medium mb-1">Total Seats</p>
                  <p className="mb-1 text-2xl font-bold">
                    {rows.length * seatsPerRow}
                  </p>
                  <p className="text-xs text-gray-500">
                    This will create {rows.length} rows × {seatsPerRow} seats = {rows.length * seatsPerRow} seats
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSeatDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSeatGeneration}>Generate Seats</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={showBookingDetailsDialog} onOpenChange={setShowBookingDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bookings for {eventBookingsTitle}</DialogTitle>
            <DialogDescription>
              All bookings for this event
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {selectedEventBookings.length === 0 ? (
              <div className="text-center py-8">
                <p>No bookings found for this event.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEventBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        {booking.profiles?.first_name || "Unknown"}{" "}
                        {booking.profiles?.last_name || ""}
                      </TableCell>
                      <TableCell>{booking.profiles?.email || "Unknown"}</TableCell>
                      <TableCell>{formatDate(booking.created_at)}</TableCell>
                      <TableCell>{(booking.events?.is_free || booking.is_free) ? <span className="text-green-600 font-medium">Free</span> : `$${booking.total_price.toFixed(2)}`}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowBookingDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analytics — {analyticsTitle}</DialogTitle>
            <DialogDescription>Detailed statistics for this event</DialogDescription>
          </DialogHeader>
          {analyticsLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading analytics…</div>
          ) : analyticsData ? (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
              {/* KPI grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Seats",    value: analyticsData.total_seats },
                  { label: "Available",      value: analyticsData.available_seats },
                  { label: "Booked",         value: analyticsData.booked_seats },
                  { label: "Occupancy",      value: `${analyticsData.occupancy_pct}%` },
                  { label: "VIP Seats",      value: analyticsData.vip_seats },
                  { label: "Blocked",        value: analyticsData.blocked_seats },
                  { label: "Checked In",     value: analyticsData.checked_in },
                  { label: "Revenue",        value: `$${analyticsData.revenue?.toFixed(2) ?? "0.00"}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              {/* Booking breakdown */}
              <div>
                <p className="text-sm font-semibold mb-2">Booking Breakdown</p>
                <div className="space-y-2">
                  {[
                    { label: "Confirmed", count: analyticsData.confirmed_bookings, color: "bg-green-500" },
                    { label: "Cancelled", count: analyticsData.cancelled_bookings, color: "bg-red-500" },
                  ].map(({ label, count, color }) => {
                    const pct = analyticsData.total_bookings > 0 ? Math.round((count / analyticsData.total_bookings) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{label}</span>
                          <span className="font-medium">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Booking trend (last 14 days) */}
              {analyticsData.booking_trend?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Booking Trend (Last 14 Days)</p>
                  <div className="flex items-end gap-1 h-20">
                    {analyticsData.booking_trend.map((d: { date: string; count: number }) => {
                      const maxCount = Math.max(...analyticsData.booking_trend.map((x: any) => x.count), 1);
                      const height = Math.round((d.count / maxCount) * 100);
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-primary rounded-sm transition-all"
                            style={{ height: `${height}%`, minHeight: d.count > 0 ? "4px" : "0" }}
                            title={`${d.date}: ${d.count} booking(s)`}
                          />
                          <span className="text-[9px] text-muted-foreground rotate-45 origin-left">{d.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Most active users */}
              {analyticsData.most_active_users?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Most Active Attendees</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Bookings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.most_active_users.map((u: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{u.name}</TableCell>
                          <TableCell className="font-mono text-xs">{u.student_id || "—"}</TableCell>
                          <TableCell className="text-sm">{u.email}</TableCell>
                          <TableCell><Badge variant="outline">{u.bookings}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setShowAnalyticsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seat Control Dialog */}
      <Dialog open={showSeatControlDialog} onOpenChange={setShowSeatControlDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Seat Control — {seatCtrlEventTitle}</DialogTitle>
            <DialogDescription>
              Click seats to select. Use the action panel to book, mark VIP/Blocked, or reset.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Seat grid */}
            <div className="md:col-span-2 max-h-[50vh] overflow-y-auto">
              {seatCtrlLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading seats…</p>
              ) : seatCtrlSeats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No seats found. Generate seats first.</p>
              ) : (
                <div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    {[
                      { label: "Available", cls: "bg-green-100 border-green-400 text-green-800" },
                      { label: "Booked",    cls: "bg-red-100 border-red-400 text-red-700" },
                      { label: "Reserved",  cls: "bg-amber-100 border-amber-400 text-amber-800" },
                      { label: "VIP",       cls: "bg-purple-100 border-purple-400 text-purple-800" },
                      { label: "Blocked",   cls: "bg-gray-200 border-gray-400 text-gray-600" },
                      { label: "Selected",  cls: "bg-blue-500 border-blue-600 text-white" },
                    ].map(({ label, cls }) => (
                      <span key={label} className={`border rounded px-2 py-0.5 font-medium ${cls}`}>{label}</span>
                    ))}
                  </div>
                  {/* Seat buttons grouped by row */}
                  {(() => {
                    const rows: Record<string, any[]> = {};
                    seatCtrlSeats.forEach((s) => { rows[s.row] = [...(rows[s.row] || []), s]; });
                    return Object.entries(rows).sort(([a], [b]) => a.localeCompare(b)).map(([row, seats]) => (
                      <div key={row} className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-bold w-4 shrink-0">{row}</span>
                        <div className="flex flex-wrap gap-1">
                          {seats.sort((a, b) => a.number - b.number).map((s) => {
                            const isSelected = seatCtrlSelected.includes(s._id ?? s.id);
                            let cls = "bg-green-100 border-green-400 text-green-800";
                            if (isSelected) cls = "bg-blue-500 border-blue-600 text-white";
                            else if (s.status === "booked") cls = "bg-red-100 border-red-400 text-red-700";
                            else if (s.seat_type === "vip") cls = "bg-purple-100 border-purple-400 text-purple-800";
                            else if (s.seat_type === "blocked") cls = "bg-gray-200 border-gray-400 text-gray-600";
                            else if (s.status === "reserved") cls = "bg-amber-100 border-amber-400 text-amber-800";
                            return (
                              <button
                                key={s._id ?? s.id}
                                onMouseDown={() => handleSeatMouseDown(s._id ?? s.id)}
                                onMouseEnter={() => handleSeatMouseEnter(s._id ?? s.id)}
                                className={`border rounded text-xs px-1.5 py-0.5 font-medium transition-colors ${cls}`}
                                title={`${s.row}${s.number} — ${s.seat_type} / ${s.status}`}
                              >
                                {s.number}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Action panel */}
            <div className="space-y-3 border rounded-lg p-3">
              <p className="text-sm font-semibold">
                {seatCtrlSelected.length} seat{seatCtrlSelected.length !== 1 ? "s" : ""} selected
              </p>

              <div>
                <label className="block text-xs font-medium mb-1">Action</label>
                <select
                  value={seatCtrlAction}
                  onChange={(e) => setSeatCtrlAction(e.target.value as any)}
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  <option value="book">Book for User</option>
                  <option value="vip">Mark as VIP</option>
                  <option value="blocked">Mark as Blocked</option>
                  <option value="available">Reset to Available</option>
                </select>
              </div>

              {seatCtrlAction === "book" && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">User Email (leave blank = admin)</label>
                    <Input
                      value={seatCtrlUserEmail}
                      onChange={(e) => setSeatCtrlUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Note (optional)</label>
                    <Input
                      value={seatCtrlNote}
                      onChange={(e) => setSeatCtrlNote(e.target.value)}
                      placeholder="VIP guest, speaker, etc."
                      className="text-sm"
                    />
                  </div>
                </>
              )}

              <Button
                className="w-full"
                onClick={executeSeatCtrlAction}
                disabled={!seatCtrlSelected.length || seatCtrlLoading}
              >
                {seatCtrlLoading ? "Processing…" : "Execute Action"}
              </Button>

              {seatCtrlSelected.length > 0 && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setSeatCtrlSelected([])}>
                  Clear Selection
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSeatControlDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User from Event</DialogTitle>
            <DialogDescription>
              {banContext.userEmail ? `Ban ${banContext.userEmail} from an event` : 'Select an event to ban this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-select">Select Event</Label>
              <select
                id="event-select"
                className="w-full border rounded px-3 py-2 mt-1 bg-background"
                value={banContext.eventId || ""}
                onChange={(e) => setBanContext({ ...banContext, eventId: e.target.value, eventTitle: events.find((ev) => ev.id === e.target.value)?.title })}
              >
                <option value="">-- Select an event --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
            {banContext.eventId && (
              <div className="text-sm text-muted-foreground">
                This will ban the user from: <span className="font-medium">{banContext.eventTitle}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!banContext.eventId || !banContext.userId) return;
                await banUserFromEvent(banContext.eventId, banContext.userId);
                setShowBanDialog(false);
              }}
              disabled={!banContext.eventId || !banContext.userId}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p>{selectedUser.first_name} {selectedUser.last_name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <Label>Student ID</Label>
                <p>{selectedUser.student_id || "N/A"}</p>
              </div>
              <div>
                <Label>Phone</Label>
                <p>{selectedUser.phone_number || "N/A"}</p>
              </div>
              <div>
                <Label>Registered</Label>
                <p>{formatDate(selectedUser.created_at)}</p>
              </div>
              <div>
                <Label>Role</Label>
                <Badge className={selectedUser.is_admin ? "bg-blue-100 text-blue-800" : ""}>
                  {selectedUser.is_admin ? "Admin" : "User"}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowUserDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
};

type Booking = {
  id: string;
  event_id: string;
  total_price: number;
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

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [updating, setUpdating] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<"all" | "confirmed" | "cancelled" | "refunded">("all");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchProfile();
    fetchBookings();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      const p: Profile = {
        id: data.id ?? data._id ?? "",
        first_name: data.first_name ?? null,
        last_name: data.last_name ?? null,
        email: data.email ?? null,
        avatar_url: data.avatar_url ?? null,
        is_admin: data.is_admin ?? false,
      };
      setProfile(p);
      setFirstName(p.first_name || "");
      setLastName(p.last_name || "");
      setEmail(p.email || "");
      setAvatarUrl(p.avatar_url || "");
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({ title: "Error", description: "Failed to load profile data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
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
        description: "Failed to load booking history",
        variant: "destructive",
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, avatar_url: avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      window.dispatchEvent(new CustomEvent("auth-change"));
      toast({ title: "Saved", description: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password changed", description: "Your password has been updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid date";
    }
  };

  const formatSeats = (seats: { row: string; number: number }[]) => {
    if (!seats.length) return "No seat information";
    
    return seats
      .sort((a, b) => {
        if (a.row === b.row) {
          return a.number - b.number;
        }
        return a.row.localeCompare(b.row);
      })
      .map((seat) => `${seat.row}${seat.number}`)
      .join(", ");
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-1/4 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = `${(firstName || "?")[0]}${(lastName || "?")[0]}`.toUpperCase();

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        {/* ── Avatar header ─────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center ring-4 ring-background shadow-lg shadow-primary/20">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            {profile?.is_admin && (
              <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">ADMIN</span>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold">{firstName} {lastName}</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
            <TabsTrigger value="bookings" className="flex-1">Bookings</TabsTrigger>
            <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-muted"
                    />
                  </div>

                  {profile?.is_admin && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary">Admin</Badge>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <div className="flex gap-3 items-center">
                    {avatarUrl && (
                      <img src={avatarUrl} alt="Avatar" loading="lazy" className="h-10 w-10 rounded-full object-cover ring-2 ring-border" />
                    )}
                    <Input
                      id="avatarUrl"
                      placeholder="https://example.com/avatar.png"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button onClick={updateProfile} disabled={updating}>
                    {updating ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Security tab ── */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPw">Current Password</Label>
                  <Input id="currentPw" type="password" value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPw">New Password</Label>
                  <Input id="newPw" type="password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPw">Confirm New Password</Label>
                  <Input id="confirmPw" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
                <Button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                  {changingPassword ? "Changing..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Booking History</CardTitle>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(["all", "confirmed", "cancelled", "refunded"] as const).map((f) => (
                    <button key={f}
                      onClick={() => setBookingFilter(f)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        bookingFilter === f
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      {f === "all" ? ` (${bookings.length})` : ` (${bookings.filter(b => b.status === f).length})`}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-1" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-lg mb-2">No bookings found</p>
                    <p className="text-muted-foreground mb-6">You haven't booked any events yet</p>
                    <Button onClick={() => navigate("/events")}>Browse Events</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings
                      .filter((b) => bookingFilter === "all" || b.status === bookingFilter)
                      .map((booking) => (
                      <Card
                        key={booking.id}
                        className={`overflow-hidden border-l-4 transition-all hover:shadow-md ${
                          booking.status === "confirmed"
                            ? "border-l-green-500"
                            : booking.status === "cancelled"
                            ? "border-l-red-400"
                            : "border-l-amber-400"
                        }`}
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-3">
                            <div>
                              <h3 className="text-base font-semibold mb-1">
                                {booking.event?.title || "Unknown Event"}
                              </h3>
                              {booking.event?.date && (
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(booking.event.date)}
                                </p>
                              )}
                              {booking.event?.location && (
                                <p className="text-sm text-muted-foreground">
                                  {booking.event.location}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <Badge
                                className={
                                  booking.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : booking.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </Badge>
                              <p className="text-lg font-bold mt-1">
                                {formatPrice(booking.total_price)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(booking.created_at)}
                              </p>
                            </div>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex items-center justify-between">
                            <p className="text-sm">
                              <span className="font-medium">Seats:</span>{" "}
                              {formatSeats(booking.seats)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => navigate(`/events/${booking.event_id}`)}
                            >
                              View Event
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};


import { supabase } from "./client";
import { toast } from "@/components/ui/use-toast";

// Fetch all events
export const fetchEvents = async ({ featured = false, category = "" } = {}) => {
  try {
    let query = supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("date", { ascending: true });

    if (featured) {
      // For featured events, get upcoming events limited to a few
      query = query.gte("date", new Date().toISOString()).limit(4);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error("Error fetching events:", error.message);
    return [];
  }
};

// Fetch single event by ID
export const fetchEventById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error(`Error fetching event with id ${id}:`, error.message);
    return null;
  }
};

// Book seats for an event
export const bookSeats = async ({
  userId,
  eventId,
  seatIds,
  totalPrice,
}: {
  userId: string;
  eventId: string;
  seatIds: string[];
  totalPrice: number;
}) => {
  try {
    // Start a transaction by using supabase functions
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        event_id: eventId,
        total_price: totalPrice,
      })
      .select()
      .single();

    if (bookingError) {
      throw bookingError;
    }

    // Create booking-seat relationships
    const bookingSeatPromises = seatIds.map((seatId) =>
      supabase.from("booking_seats").insert({
        booking_id: booking.id,
        seat_id: seatId,
      })
    );

    // Update seat status to booked
    const updateSeatPromises = seatIds.map((seatId) =>
      supabase
        .from("seats")
        .update({ status: "booked" })
        .eq("id", seatId)
    );

    // Wait for all operations to complete
    await Promise.all([...bookingSeatPromises, ...updateSeatPromises]);

    toast({
      title: "Booking successful!",
      description: `You have booked ${seatIds.length} seat(s).`,
    });

    return booking;
  } catch (error: any) {
    console.error("Error booking seats:", error.message);
    toast({
      title: "Booking failed",
      description: error.message,
      variant: "destructive",
    });
    return null;
  }
};

// Fetch user bookings
export const fetchUserBookings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        event:events(*),
        booking_seats!inner(
          seat:seats(*)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error("Error fetching user bookings:", error.message);
    return [];
  }
};

// Fetch admin bookings
export const fetchAdminBookings = async () => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        user:profiles!bookings_user_id_fkey(*),
        event:events(*),
        booking_seats(seat:seats(*))
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error("Error fetching admin bookings:", error.message);
    return [];
  }
};

// Update user profile
export const updateProfile = async (userId: string, profile: {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", userId);

    if (error) {
      throw error;
    }

    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });

    return true;
  } catch (error: any) {
    console.error("Error updating profile:", error.message);
    toast({
      title: "Update failed",
      description: error.message,
      variant: "destructive",
    });
    return false;
  }
};

// Format date string to a readable format
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

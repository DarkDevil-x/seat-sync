
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

// Define the CSV format function
function formatBookingsToCSV(bookings: any[]) {
  // Define CSV header with additional fields
  const csvHeader = [
    'Booking ID',
    'Event',
    'User Name',
    'Email',
    'Date',
    'Seats',
    'Status',
    'Amount'
  ].join(',');
  
  // Map bookings to CSV rows
  const csvRows = bookings.map((booking) => {
    // Format user information
    const userName = booking.user_name || 'Unknown';
    const email = booking.user_email || 'Unknown';
    const date = new Date(booking.created_at).toLocaleString();
    const amount = booking.total_price?.toFixed(2) || '0.00';
    const seats = booking.seats || 'None';
    
    return [
      booking.id,
      booking.event_title || 'Unknown Event',
      userName,
      email,
      date,
      seats,
      booking.status,
      amount
    ]
      .map(value => `"${String(value).replace(/"/g, '""')}"`) // Escape quotes in CSV
      .join(',');
  });
  
  // Combine header and rows
  return [csvHeader, ...csvRows].join('\n');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { eventId, adminId } = await req.json();
    
    if (!eventId || !adminId) {
      return new Response(
        JSON.stringify({ error: 'Event ID and Admin ID are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // First verify this user is actually an admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();
    
    if (adminError || !adminData?.is_admin) {
      console.error('Admin verification failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }
    
    console.log(`Fetching bookings for event: ${eventId}`);

    // First get the basic booking information
    const { data: bookingsData, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, total_price, status, created_at, user_id, event_id')
      .eq('event_id', eventId);
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get event title
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();
    
    if (eventError) {
      console.error('Error fetching event details:', eventError);
      // Continue anyway, we'll just use "Unknown Event" as a fallback
    }
    
    // Get user profiles for all bookings
    let userProfiles: Record<string, any> = {};
    
    if (bookingsData && bookingsData.length > 0) {
      const userIds = bookingsData.map(booking => booking.user_id).filter(Boolean);
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        
        if (profilesError) {
          console.error('Error fetching user profiles:', profilesError);
          // Continue anyway, we'll use fallbacks for missing user data
        } else if (profilesData) {
          // Create a map of user profiles by ID for easy lookup
          profilesData.forEach(profile => {
            userProfiles[profile.id] = profile;
          });
        }
      }
    }
    
    // Get seats for each booking
    const bookingIds = bookingsData?.map(booking => booking.id) || [];
    const seatsByBooking: Record<string, string> = {};
    
    if (bookingIds.length > 0) {
      // Get booking_seats mapping first
      const { data: bookingSeatData, error: bookingSeatError } = await supabaseAdmin
        .from('booking_seats')
        .select('booking_id, seat_id')
        .in('booking_id', bookingIds);
      
      if (bookingSeatError) {
        console.error('Error fetching booking seats:', bookingSeatError);
      } else if (bookingSeatData && bookingSeatData.length > 0) {
        // Get all seat details
        const seatIds = bookingSeatData.map(bs => bs.seat_id);
        
        const { data: seatData, error: seatError } = await supabaseAdmin
          .from('seats')
          .select('id, row, number')
          .in('id', seatIds);
        
        if (seatError) {
          console.error('Error fetching seat details:', seatError);
        } else if (seatData) {
          // Create a map of seats by seat ID
          const seatsById: Record<string, any> = {};
          seatData.forEach(seat => {
            seatsById[seat.id] = seat;
          });
          
          // Group seats by booking ID
          const seatsByBookingId: Record<string, any[]> = {};
          bookingSeatData.forEach(bs => {
            if (!seatsByBookingId[bs.booking_id]) {
              seatsByBookingId[bs.booking_id] = [];
            }
            if (seatsById[bs.seat_id]) {
              seatsByBookingId[bs.booking_id].push(seatsById[bs.seat_id]);
            }
          });
          
          // Format seats for each booking
          Object.keys(seatsByBookingId).forEach(bookingId => {
            seatsByBooking[bookingId] = seatsByBookingId[bookingId]
              .map(seat => `${seat.row}${seat.number}`)
              .join(', ');
          });
        }
      }
    }
    
    // Combine the data to create enriched booking records
    const enrichedBookings = (bookingsData || []).map(booking => {
      const profile = userProfiles[booking.user_id] || {};
      const userName = profile.first_name || profile.last_name ? 
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
        'Unknown';
      
      return {
        ...booking,
        event_title: eventData?.title || 'Unknown Event',
        user_name: userName,
        user_email: profile.email || '', 
        seats: seatsByBooking[booking.id] || 'None'
      };
    });
    
    // Convert to CSV
    const csv = formatBookingsToCSV(enrichedBookings);
    
    // Return CSV data
    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bookings-event-${eventId}.csv"`
      }
    });
    
  } catch (err) {
    console.error('Exception in export-bookings function:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

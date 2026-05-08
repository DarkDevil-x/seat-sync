
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  imageUrl: string;
  totalSeats: number;
  availableSeats: number;
  category: string;
}

export interface Seat {
  id: string;
  number: number;
  row: string;
  status: "available" | "reserved" | "booked";
  price: number;
  eventId: string;
}

export interface Booking {
  id: string;
  eventId: string;
  userId: string;
  seatIds: string[];
  totalPrice: number;
  bookingDate: string;
  status: "confirmed" | "pending" | "cancelled";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

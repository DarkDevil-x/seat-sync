import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  price: number;
  category: string;
  image_url: string | null;
  is_free: boolean;
  is_published: boolean;
  created_by: string;
  max_seats_per_user: number;
  is_bookings_open: boolean;
  max_tickets_per_event: number | null;
  banned_users: string[];
  created_at: Date;
  updated_at: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    category: { type: String, required: true },
    image_url: { type: String, default: null },
    is_free: { type: Boolean, default: false },
    is_published: { type: Boolean, default: false },
    created_by: { type: String, required: true },
    max_seats_per_user: { type: Number, default: 10 },
    is_bookings_open: { type: Boolean, default: true },
    max_tickets_per_event: { type: Number, default: null },
    banned_users: { type: [String], default: [] },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

EventSchema.index({ is_published: 1, date: 1 });
EventSchema.index({ category: 1 });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

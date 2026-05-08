import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  event_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  status: 'confirmed' | 'pending' | 'cancelled' | 'refunded';
  total_price: number;
  checked_in: boolean;
  checked_in_at: Date | null;
  booking_note: string | null;
  created_at: Date;
  updated_at: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    event_id: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled', 'refunded'],
      default: 'confirmed',
    },
    total_price: { type: Number, required: true },
    checked_in: { type: Boolean, default: false },
    checked_in_at: { type: Date, default: null },
    booking_note: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

BookingSchema.index({ user_id: 1, created_at: -1 });
BookingSchema.index({ event_id: 1 });

export default (mongoose.models.Booking as mongoose.Model<IBooking>) || mongoose.model<IBooking>("Booking", BookingSchema);

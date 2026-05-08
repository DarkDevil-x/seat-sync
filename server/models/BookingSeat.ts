import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingSeat extends Document {
  booking_id: mongoose.Types.ObjectId;
  seat_id: mongoose.Types.ObjectId;
  created_at: Date;
}

const BookingSeatSchema = new Schema<IBookingSeat>(
  {
    booking_id: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    seat_id: { type: Schema.Types.ObjectId, ref: 'Seat', required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

BookingSeatSchema.index({ booking_id: 1 });
BookingSeatSchema.index({ seat_id: 1 }, { unique: true });

export default (mongoose.models.BookingSeat as mongoose.Model<IBookingSeat>) || mongoose.model<IBookingSeat>("BookingSeat", BookingSeatSchema);

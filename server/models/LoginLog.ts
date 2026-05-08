import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginLog extends Document {
  user_id: mongoose.Types.ObjectId;
  email: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  created_at: Date;
}

const LoginLogSchema = new Schema<ILoginLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    ip_address: { type: String, default: null },
    user_agent: { type: String, default: null },
    success: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

LoginLogSchema.index({ user_id: 1, created_at: -1 });
LoginLogSchema.index({ email: 1, created_at: -1 });

export default (mongoose.models.LoginLog as mongoose.Model<ILoginLog>) || mongoose.model<ILoginLog>("LoginLog", LoginLogSchema);

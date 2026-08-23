import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);

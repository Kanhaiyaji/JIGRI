import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  userId: string;
  name: string;
  language: string;
  code: string;
  stdin: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  language: { type: String, required: true },
  code: { type: String, default: '' },
  stdin: { type: String, default: '' },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

ProjectSchema.index({ userId: 1, updatedAt: -1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);

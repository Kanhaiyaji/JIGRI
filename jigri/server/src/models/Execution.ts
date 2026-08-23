import mongoose, { Document, Schema } from 'mongoose';

export interface IExecution extends Document {
  userId?: string;
  language: string;
  code: string;
  stdin: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  status: 'success' | 'error' | 'timeout' | 'queued';
  createdAt: Date;
}

const ExecutionSchema = new Schema<IExecution>({
  userId: { type: String, index: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  stdin: { type: String, default: '' },
  stdout: { type: String, default: '' },
  stderr: { type: String, default: '' },
  exitCode: { type: Number, default: 0 },
  executionTimeMs: { type: Number, default: 0 },
  status: { type: String, enum: ['success', 'error', 'timeout', 'queued'], default: 'queued' },
}, { timestamps: true });

ExecutionSchema.index({ userId: 1, createdAt: -1 });

export const Execution = mongoose.model<IExecution>('Execution', ExecutionSchema);

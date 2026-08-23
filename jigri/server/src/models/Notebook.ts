import mongoose, { Document, Schema } from 'mongoose';

export interface CellOutput {
  type: 'text' | 'html' | 'image' | 'error';
  data: string;
}

export interface ICell {
  id: string;
  type: 'code' | 'markdown';
  source: string;
  outputs: CellOutput[];
  executionCount?: number;
}

export interface INotebook extends Document {
  userId: string;
  title: string;
  cells: ICell[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CellOutputSchema = new Schema<CellOutput>({
  type: { type: String, enum: ['text', 'html', 'image', 'error'], required: true },
  data: { type: String, required: true },
}, { _id: false });

const CellSchema = new Schema<ICell>({
  id: { type: String, required: true },
  type: { type: String, enum: ['code', 'markdown'], required: true },
  source: { type: String, default: '' },
  outputs: { type: [CellOutputSchema], default: [] },
  executionCount: { type: Number },
}, { _id: false });

const NotebookSchema = new Schema<INotebook>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true, default: 'Untitled Notebook', maxlength: 200 },
  cells: { type: [CellSchema], default: [] },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

NotebookSchema.index({ userId: 1, updatedAt: -1 });

export const Notebook = mongoose.model<INotebook>('Notebook', NotebookSchema);

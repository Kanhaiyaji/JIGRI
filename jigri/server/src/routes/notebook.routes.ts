import mongoose from 'mongoose';
import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest, authenticate } from '../middleware/auth.middleware.js';
import { Notebook } from '../models/Notebook.js';
import {
  startRuntime,
  stopRuntime,
  restartRuntime,
  getRuntimeStatus,
  executeCell,
} from '../notebook/RuntimeManager.js';

const router = Router();

router.use(authenticate);

router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Notebook not found' });
  }
  next();
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const notebooks = await Notebook.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json({ notebooks });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const notebookSchema = z.object({
  title: z.string().min(1).max(200).optional().default('Untitled Notebook'),
  cells: z.array(z.any()).optional().default([]),
  isPublic: z.boolean().optional().default(false),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = notebookSchema.parse(req.body);
    const notebook = new Notebook({ ...data, userId: req.userId });
    await notebook.save();
    res.status(201).json({ notebook });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.userId });
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }
    res.json({ notebook });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = notebookSchema.partial().parse(req.body);
    const notebook = await Notebook.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: data },
      { new: true }
    );
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }
    res.json({ notebook });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const notebook = await Notebook.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }
    await stopRuntime(req.userId!, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/runtime/start', async (req: AuthRequest, res: Response) => {
  try {
    const session = await startRuntime(req.userId!, req.params.id);
    res.json({ status: session.status });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to start runtime', details: error.message });
  }
});

router.post('/:id/runtime/stop', async (req: AuthRequest, res: Response) => {
  try {
    await stopRuntime(req.userId!, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to stop runtime', details: error.message });
  }
});

router.post('/:id/runtime/restart', async (req: AuthRequest, res: Response) => {
  try {
    const session = await restartRuntime(req.userId!, req.params.id);
    res.json({ status: session.status });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to restart runtime', details: error.message });
  }
});

router.get('/:id/runtime/status', async (req: AuthRequest, res: Response) => {
  try {
    const status = getRuntimeStatus(req.userId!, req.params.id);
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const runCellSchema = z.object({
  code: z.string(),
});

router.post('/:id/cells/:cellId/run', async (req: AuthRequest, res: Response) => {
  try {
    const { code } = runCellSchema.parse(req.body);
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.userId });
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const cellIndex = notebook.cells.findIndex((c) => c.id === req.params.cellId);
    if (cellIndex === -1) {
      return res.status(404).json({ error: 'Cell not found' });
    }

    const { stdout, stderr, result } = await executeCell(req.userId!, req.params.id, req.params.cellId, code);

    const outputs = [];
    if (stdout) outputs.push({ type: 'text', data: stdout });
    if (stderr) outputs.push({ type: 'error', data: stderr });
    if (result) outputs.push({ type: result.type, data: result.data });

    notebook.cells[cellIndex].outputs = outputs as any;
    notebook.cells[cellIndex].executionCount = (notebook.cells[cellIndex].executionCount || 0) + 1;
    await notebook.save();

    res.json({ stdout, stderr, result, outputs, executionCount: notebook.cells[cellIndex].executionCount });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to execute cell', details: error.message });
  }
});

router.post('/:id/run-all', async (req: AuthRequest, res: Response) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.userId });
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const results = [];
    for (let i = 0; i < notebook.cells.length; i++) {
      const cell = notebook.cells[i];
      if (cell.type === 'code') {
        try {
          const { stdout, stderr, result } = await executeCell(req.userId!, req.params.id, cell.id, cell.source);
          
          const outputs = [];
          if (stdout) outputs.push({ type: 'text', data: stdout });
          if (stderr) outputs.push({ type: 'error', data: stderr });
          if (result) outputs.push({ type: result.type, data: result.data });

          cell.outputs = outputs as any;
          cell.executionCount = (cell.executionCount || 0) + 1;
          results.push({ cellId: cell.id, success: true, outputs });
        } catch (err: any) {
          cell.outputs = [{ type: 'error', data: err.message }] as any;
          results.push({ cellId: cell.id, success: false, error: err.message });
          break; // Stop on first error
        }
      }
    }

    await notebook.save();
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to run all cells', details: error.message });
  }
});

router.delete('/:id/cells/:cellId/output', async (req: AuthRequest, res: Response) => {
  try {
    const notebook = await Notebook.findOne({ _id: req.params.id, userId: req.userId });
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const cellIndex = notebook.cells.findIndex((c) => c.id === req.params.cellId);
    if (cellIndex === -1) {
      return res.status(404).json({ error: 'Cell not found' });
    }

    notebook.cells[cellIndex].outputs = [];
    notebook.cells[cellIndex].executionCount = undefined;
    await notebook.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

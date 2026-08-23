import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest, authenticate } from '../middleware/auth.middleware.js';
import { Project } from '../models/Project.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const projectSchema = z.object({
  name: z.string().min(1).max(100),
  language: z.string(),
  code: z.string().optional().default(''),
  stdin: z.string().optional().default(''),
  isPublic: z.boolean().optional().default(false),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = projectSchema.parse(req.body);
    const project = new Project({ ...data, userId: req.userId });
    await project.save();
    res.status(201).json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = projectSchema.partial().parse(req.body);
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: data },
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

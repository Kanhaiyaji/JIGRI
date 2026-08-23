import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest, optionalAuth } from '../middleware/auth.middleware.js';
import { getLanguage } from '../execution/languageRegistry.js';
import { enqueueExecution } from '../execution/ExecutionQueue.js';
import { runCode } from '../execution/DockerRunner.js';
import { Execution } from '../models/Execution.js';

const router = Router();

const executeSchema = z.object({
  language: z.string(),
  code: z.string(),
  stdin: z.string().optional().default(''),
});

router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { language, code, stdin } = executeSchema.parse(req.body);
    
    const langConfig = getLanguage(language);
    if (!langConfig) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    if (langConfig.type === 'web') {
      return res.json({
        executionId: null,
        stdout: code,
        stderr: '',
        exitCode: 0,
        executionTimeMs: 0,
        timedOut: false,
        language: langConfig.id
      });
    }

    const userId = req.userId || 'anonymous-' + req.ip;

    // Create execution record
    let execution: any = null;
    try {
      execution = new Execution({
        userId: req.userId || null,
        language,
        code,
        stdin,
        status: 'queued'
      });
      await execution.save();
    } catch (_) {}

    // Enqueue
    try {
      const result = await enqueueExecution(userId, () => runCode(langConfig, code, stdin));
      
      if (execution) {
        try {
          execution.stdout = result.stdout;
          execution.stderr = result.stderr;
          execution.exitCode = result.exitCode;
          execution.executionTimeMs = result.executionTimeMs;
          execution.status = result.timedOut ? 'timeout' : (result.exitCode === 0 ? 'success' : 'error');
          await execution.save();
        } catch (_) {}
      }

      res.json({
        executionId: execution?._id || null,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTimeMs: result.executionTimeMs,
        timedOut: result.timedOut,
        language: langConfig.id
      });
    } catch (execError: any) {
      if (execution) {
        try {
          execution.status = 'error';
          execution.stderr = execError.message || 'Execution failed';
          await execution.save();
        } catch (_) {}
      }
      res.status(500).json({ error: 'Execution failed', details: execError.message });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/execute/history — return last 50 executions for logged-in user
router.get('/history', async (req: AuthRequest, res: Response) => {
  // Inline optional auth check
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.json({ executions: [] });
  }
  try {
    const jwt = await import('jsonwebtoken');
    const { env } = await import('../config/env.js');
    const decoded = jwt.default.verify(authHeader.slice(7), env.JWT_SECRET) as any;
    const userId = decoded.userId;
    const executions = await Execution.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-code -stdin -stdout -stderr');
    res.json({ executions });
  } catch (e) {
    res.json({ executions: [] });
  }
});

export default router;

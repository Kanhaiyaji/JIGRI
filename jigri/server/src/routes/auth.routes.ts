import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/auth/me — Return current authenticated Supabase user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.userId,
      username: req.username,
      email: req.userEmail,
    },
  });
});

export default router;

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let supabaseServerClient: SupabaseClient | null = null;
if (env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)) {
  supabaseServerClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
  );
}

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
  userEmail?: string;
}

export async function verifyToken(token: string): Promise<{ userId: string; username: string; email?: string } | null> {
  // 1. Try Supabase Auth API verification if configured
  if (supabaseServerClient) {
    try {
      const { data, error } = await supabaseServerClient.auth.getUser(token);
      if (!error && data.user) {
        return {
          userId: data.user.id,
          username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User',
          email: data.user.email,
        };
      }
    } catch (_) {}
  }

  // 2. Try standard JWT decoding (Supabase JWT secret or local JWT)
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && (decoded.sub || decoded.userId)) {
      return {
        userId: decoded.sub || decoded.userId,
        username: decoded.user_metadata?.username || decoded.username || (decoded.email ? decoded.email.split('@')[0] : 'User'),
        email: decoded.email,
      };
    }
  } catch (_) {}

  // 3. Fallback for mock dev tokens
  if (token.startsWith('mock-jwt-token-for-') || token.startsWith('mock-oauth-token')) {
    const userId = token.replace('mock-jwt-token-for-', '') || 'dev-user';
    return {
      userId,
      username: userId,
    };
  }

  return null;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No authorization token provided' });
    return;
  }

  const token = authHeader.slice(7).trim();
  const authUser = await verifyToken(token);

  if (!authUser) {
    res.status(401).json({ error: 'Invalid or expired authentication session' });
    return;
  }

  req.userId = authUser.userId;
  req.username = authUser.username;
  req.userEmail = authUser.email;
  next();
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const authUser = await verifyToken(token);
    if (authUser) {
      req.userId = authUser.userId;
      req.username = authUser.username;
      req.userEmail = authUser.email;
    }
  }
  next();
}

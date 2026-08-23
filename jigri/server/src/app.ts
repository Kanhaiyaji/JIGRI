import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { executionLimiter, authLimiter } from './middleware/rateLimit.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import languageRoutes from './routes/language.routes.js';
import executeRoutes from './routes/execute.routes.js';
import projectRoutes from './routes/project.routes.js';
import notebookRoutes from './routes/notebook.routes.js';

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Health check
  app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Routes
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/languages', languageRoutes);
  app.use('/api/execute', executionLimiter, executeRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/notebooks', notebookRoutes);

  // Socket.IO for real-time updates
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join:execution', (executionId: string) => {
      socket.join(`exec:${executionId}`);
    });

    socket.on('join:notebook', (notebookId: string) => {
      socket.join(`notebook:${notebookId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Make io available to routes
  app.set('io', io);

  return { app, httpServer, io };
}

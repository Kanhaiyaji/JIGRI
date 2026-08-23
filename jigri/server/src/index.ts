import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  const { httpServer } = createApp();

  // Try to connect to MongoDB in background without blocking startup
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[MongoDB] Connected successfully');
  } catch (mongoError: any) {
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB (${mongoError.message}).`);
    console.warn('[MongoDB] Running in ephemeral mode (guest code execution works; auth & persistence require MongoDB).');
  }

  httpServer.listen(env.PORT, () => {
    console.log(`[Server] 🚀 JIGRI API running on http://localhost:${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
  });
}

main();

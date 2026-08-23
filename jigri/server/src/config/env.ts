import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000'),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/jigri',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  MAX_CONCURRENT_EXECUTIONS: parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '10'),
  MAX_EXECUTIONS_PER_USER: parseInt(process.env.MAX_EXECUTIONS_PER_USER || '2'),
  EXECUTION_TIMEOUT_MS: parseInt(process.env.EXECUTION_TIMEOUT_MS || '15000'),
  NOTEBOOK_IDLE_TIMEOUT_MS: parseInt(process.env.NOTEBOOK_IDLE_TIMEOUT_MS || '1800000'),
  DOCKER_NETWORK: process.env.DOCKER_NETWORK || 'none',
};

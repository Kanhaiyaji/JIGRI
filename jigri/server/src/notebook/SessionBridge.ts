/**
 * SessionBridge.ts
 * 
 * Provides utilities for bridging between the HTTP API layer and the
 * RuntimeManager's per-user container sessions. Acts as a thin adapter
 * layer that routes notebook cell execution through the RuntimeManager.
 */
import {
  executeCell,
  startRuntime,
  stopRuntime,
  restartRuntime,
  getRuntimeStatus,
  getSession,
  RuntimeSession,
} from './RuntimeManager.js';

export interface CellExecutionResult {
  stdout: string;
  stderr: string;
  result: { type: string; data: string } | null;
}

/**
 * Execute a single cell in the user's persistent runtime container.
 */
export async function runCellInSession(
  userId: string,
  notebookId: string,
  cellId: string,
  code: string
): Promise<CellExecutionResult> {
  return executeCell(userId, notebookId, cellId, code);
}

/**
 * Start the Python runtime for a given user + notebook combination.
 */
export async function ensureRuntimeRunning(
  userId: string,
  notebookId: string
): Promise<RuntimeSession> {
  const status = getRuntimeStatus(userId, notebookId);
  if (status === 'ready' || status === 'running') {
    return getSession(userId, notebookId)!;
  }
  return startRuntime(userId, notebookId);
}

export { startRuntime, stopRuntime, restartRuntime, getRuntimeStatus, getSession };

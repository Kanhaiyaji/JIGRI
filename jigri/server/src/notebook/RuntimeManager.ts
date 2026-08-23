import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { checkDockerAvailability } from '../execution/DockerRunner.js';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const replScriptPath = path.resolve(__dirname, '../../../docker/notebook-python/repl_bridge.py');

let dockerInstance: Docker | null = null;
function getDocker(): Docker {
  if (!dockerInstance) dockerInstance = new Docker();
  return dockerInstance;
}

export interface RuntimeSession {
  containerId?: string;
  containerName?: string;
  process?: ChildProcessWithoutNullStreams;
  userId: string;
  notebookId: string;
  status: 'starting' | 'ready' | 'running' | 'stopped';
  lastActivityAt: Date;
  executionCount: number;
  isLocalProcess?: boolean;
}

const sessions = new Map<string, RuntimeSession>();

function sessionKey(userId: string, notebookId: string): string {
  return `${userId}:${notebookId}`;
}

export async function startRuntime(userId: string, notebookId: string): Promise<RuntimeSession> {
  const key = sessionKey(userId, notebookId);

  // Stop existing session if any
  if (sessions.has(key)) {
    await stopRuntime(userId, notebookId);
  }

  const hasDocker = await checkDockerAvailability();

  if (!hasDocker) {
    return startLocalPythonRuntime(userId, notebookId);
  }

  try {
    const docker = getDocker();
    const containerName = `jigri-nb-${userId.slice(-8)}-${notebookId.slice(-8)}-${uuidv4().slice(0, 8)}`;

    const container = await docker.createContainer({
      Image: 'jigri-notebook-python:latest',
      name: containerName,
      Cmd: ['python3', '/repl_bridge.py'],
      HostConfig: {
        Memory: 512 * 1024 * 1024,
        MemorySwap: 512 * 1024 * 1024,
        CpuQuota: 100000,
        CpuPeriod: 100000,
        NetworkMode: 'none',
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
        PidsLimit: 128,
      },
      OpenStdin: true,
      StdinOnce: false,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    });

    await container.start();

    const session: RuntimeSession = {
      containerId: container.id,
      containerName,
      userId,
      notebookId,
      status: 'ready',
      lastActivityAt: new Date(),
      executionCount: 0,
      isLocalProcess: false,
    };

    sessions.set(key, session);
    return session;
  } catch (err: any) {
    console.warn(`[RuntimeManager] Docker container start failed (${err.message}). Starting local Python session...`);
    return startLocalPythonRuntime(userId, notebookId);
  }
}

async function startLocalPythonRuntime(userId: string, notebookId: string): Promise<RuntimeSession> {
  const key = sessionKey(userId, notebookId);
  const pyCmd = process.platform === 'win32' ? 'python' : 'python3';

  return new Promise((resolve, reject) => {
    try {
      const child = spawn(pyCmd, [replScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const session: RuntimeSession = {
        process: child,
        userId,
        notebookId,
        status: 'starting',
        lastActivityAt: new Date(),
        executionCount: 0,
        isLocalProcess: true,
      };

      sessions.set(key, session);

      const onData = (chunk: Buffer) => {
        const text = chunk.toString();
        if (text.includes('"status": "ready"') || text.includes('"status":"ready"')) {
          session.status = 'ready';
          child.stdout.removeListener('data', onData);
          resolve(session);
        }
      };

      child.stdout.on('data', onData);

      child.on('error', (err) => {
        console.error('[RuntimeManager] Local python spawn error:', err);
        session.status = 'stopped';
        sessions.delete(key);
        reject(err);
      });

      child.on('exit', () => {
        session.status = 'stopped';
        sessions.delete(key);
      });

      // Fallback ready timeout in case banner was missed
      setTimeout(() => {
        if (session.status === 'starting') {
          session.status = 'ready';
          resolve(session);
        }
      }, 2000);
    } catch (e) {
      reject(e);
    }
  });
}

export async function executeCell(
  userId: string,
  notebookId: string,
  cellId: string,
  code: string
): Promise<{ stdout: string; stderr: string; result: { type: string; data: string } | null }> {
  const key = sessionKey(userId, notebookId);
  let session = sessions.get(key);

  if (!session || session.status === 'stopped') {
    session = await startRuntime(userId, notebookId);
  }

  session.status = 'running';
  session.lastActivityAt = new Date();
  session.executionCount++;

  try {
    if (session.isLocalProcess && session.process) {
      const result = await execCellViaLocalProcess(session.process, cellId, code);
      session.status = 'ready';
      return result;
    }

    if (session.containerId) {
      const docker = getDocker();
      const container = docker.getContainer(session.containerId);
      const result = await execCellViaStdin(container, cellId, code);
      session.status = 'ready';
      return result;
    }

    throw new Error('No active runtime found');
  } catch (e) {
    session.status = 'ready';
    throw e;
  }
}

async function execCellViaLocalProcess(
  proc: ChildProcessWithoutNullStreams,
  cellId: string,
  code: string
): Promise<{ stdout: string; stderr: string; result: { type: string; data: string } | null }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Cell execution timed out'));
    }, 60000);

    let responseBuffer = '';

    const onData = (chunk: Buffer) => {
      responseBuffer += chunk.toString();
      const lines = responseBuffer.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === cellId) {
            clearTimeout(timeout);
            proc.stdout.removeListener('data', onData);
            resolve({
              stdout: parsed.stdout || '',
              stderr: parsed.stderr || '',
              result: parsed.result || null,
            });
            return;
          }
        } catch (_) {}
      }
    };

    proc.stdout.on('data', onData);

    const cmd = JSON.stringify({ id: cellId, code }) + '\n';
    proc.stdin.write(cmd);
  });
}

async function execCellViaStdin(
  container: Docker.Container,
  cellId: string,
  code: string
): Promise<{ stdout: string; stderr: string; result: { type: string; data: string } | null }> {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Cell execution timed out'));
    }, 60000);

    try {
      const stream = await container.attach({
        stream: true,
        stdin: true,
        stdout: true,
        stderr: false,
      });

      const cmd = JSON.stringify({ id: cellId, code }) + '\n';
      let responseBuffer = '';
      let answered = false;

      stream.on('data', (chunk: Buffer) => {
        if (answered) return;
        let offset = 0;
        while (offset < chunk.length) {
          if (chunk.length - offset < 8) break;
          const size = chunk.readUInt32BE(offset + 4);
          if (chunk.length - offset - 8 < size) break;
          responseBuffer += chunk.slice(offset + 8, offset + 8 + size).toString();
          offset += 8 + size;
        }

        const lines = responseBuffer.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.id === cellId) {
              answered = true;
              clearTimeout(timeout);
              (stream as any).destroy?.();
              resolve({
                stdout: parsed.stdout || '',
                stderr: parsed.stderr || '',
                result: parsed.result || null,
              });
              return;
            }
          } catch (_) {}
        }
      });

      stream.on('error', (e: Error) => {
        clearTimeout(timeout);
        reject(e);
      });

      stream.write(cmd);
    } catch (e) {
      clearTimeout(timeout);
      reject(e);
    }
  });
}

export async function stopRuntime(userId: string, notebookId: string): Promise<void> {
  const key = sessionKey(userId, notebookId);
  const session = sessions.get(key);
  if (!session) return;

  session.status = 'stopped';
  sessions.delete(key);

  if (session.isLocalProcess && session.process) {
    try {
      session.process.kill();
    } catch (_) {}
  } else if (session.containerId) {
    try {
      const docker = getDocker();
      const container = docker.getContainer(session.containerId);
      await container.stop({ t: 2 });
      await container.remove({ force: true });
    } catch (_) {}
  }
}

export async function restartRuntime(userId: string, notebookId: string): Promise<RuntimeSession> {
  await stopRuntime(userId, notebookId);
  return startRuntime(userId, notebookId);
}

export function getRuntimeStatus(userId: string, notebookId: string): string {
  const key = sessionKey(userId, notebookId);
  const session = sessions.get(key);
  if (!session) return 'disconnected';
  return session.status;
}

export function getSession(userId: string, notebookId: string): RuntimeSession | undefined {
  return sessions.get(sessionKey(userId, notebookId));
}

// Auto-cleanup idle runtimes
setInterval(async () => {
  const now = Date.now();
  for (const [key, session] of sessions.entries()) {
    const idleMs = now - session.lastActivityAt.getTime();
    if (idleMs > env.NOTEBOOK_IDLE_TIMEOUT_MS) {
      console.log(`[RuntimeManager] Auto-stopping idle session: ${key}`);
      await stopRuntime(session.userId, session.notebookId);
    }
  }
}, 60000);

import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { LanguageConfig } from './languageRegistry.js';
import { env } from '../config/env.js';

const execAsync = promisify(exec);

let dockerInstance: Docker | null = null;
let isDockerAvailable: boolean | null = null;

function getDocker(): Docker {
  if (!dockerInstance) {
    dockerInstance = new Docker();
  }
  return dockerInstance;
}

export async function checkDockerAvailability(): Promise<boolean> {
  if (isDockerAvailable !== null) return isDockerAvailable;
  try {
    const docker = getDocker();
    await docker.ping();
    isDockerAvailable = true;
    console.log('[DockerRunner] Docker daemon detected and ready.');
  } catch (e) {
    isDockerAvailable = false;
    console.log('[DockerRunner] Docker not reachable. Using local process execution engine.');
  }
  return isDockerAvailable;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  timedOut: boolean;
}

const MAX_OUTPUT_BYTES = 1024 * 1024; // 1MB

async function runCodeViaPiston(
  lang: LanguageConfig,
  code: string,
  stdin: string,
  onStdout?: (chunk: string) => void,
  onStderr?: (chunk: string) => void
): Promise<ExecutionResult | null> {
  const pistonLanguageMap: Record<string, { language: string; version: string; file: string }> = {
    java: { language: 'java', version: '*', file: 'Main.java' },
    php: { language: 'php', version: '*', file: 'main.php' },
    cpp: { language: 'cpp', version: '*', file: 'main.cpp' },
    c: { language: 'c', version: '*', file: 'main.c' },
    go: { language: 'go', version: '*', file: 'main.go' },
    rust: { language: 'rust', version: '*', file: 'main.rs' },
    ruby: { language: 'ruby', version: '*', file: 'main.rb' },
    python: { language: 'python', version: '*', file: 'main.py' },
    javascript: { language: 'javascript', version: '*', file: 'main.js' },
    typescript: { language: 'typescript', version: '*', file: 'main.ts' },
    bash: { language: 'bash', version: '*', file: 'main.sh' },
  };

  const mapping = pistonLanguageMap[lang.id];
  if (!mapping) return null;

  const startTime = Date.now();
  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: mapping.language,
        version: mapping.version,
        files: [{ name: mapping.file, content: code }],
        stdin: stdin || '',
      }),
    });

    if (!res.ok) return null;
    const data: any = await res.json();

    let stdout = data.run?.stdout || '';
    let stderr = data.run?.stderr || '';
    let exitCode = data.run?.code ?? 0;

    if (data.compile && data.compile.code !== 0) {
      stderr = data.compile.stderr || data.compile.output || stderr;
      exitCode = data.compile.code;
    }

    if (onStdout && stdout) onStdout(stdout);
    if (onStderr && stderr) onStderr(stderr);

    return {
      stdout: stdout.slice(0, MAX_OUTPUT_BYTES),
      stderr: stderr.slice(0, MAX_OUTPUT_BYTES),
      exitCode,
      executionTimeMs: Date.now() - startTime,
      timedOut: false,
    };
  } catch (err) {
    console.warn('[DockerRunner] Piston execution fallback failed:', err);
    return null;
  }
}

export async function runCode(
  lang: LanguageConfig,
  code: string,
  stdin: string,
  onStdout?: (chunk: string) => void,
  onStderr?: (chunk: string) => void
): Promise<ExecutionResult> {
  const hasDocker = await checkDockerAvailability();

  if (!hasDocker) {
    return runCodeLocallyOrPiston(lang, code, stdin, onStdout, onStderr);
  }

  try {
    return await runCodeViaDocker(lang, code, stdin, onStdout, onStderr);
  } catch (err: any) {
    console.warn(`[DockerRunner] Docker execution failed (${err.message}). Falling back to process/cloud runner...`);
    return runCodeLocallyOrPiston(lang, code, stdin, onStdout, onStderr);
  }
}

async function runCodeLocallyOrPiston(
  lang: LanguageConfig,
  code: string,
  stdin: string,
  onStdout?: (chunk: string) => void,
  onStderr?: (chunk: string) => void
): Promise<ExecutionResult> {
  // If language typically requires installed compilers not on cloud hosting (Java, PHP, C++, Go, Rust, Ruby),
  // try Piston first for instantaneous execution
  const cloudLanguages = ['java', 'php', 'cpp', 'c', 'go', 'rust', 'ruby'];
  if (cloudLanguages.includes(lang.id)) {
    const pistonRes = await runCodeViaPiston(lang, code, stdin, onStdout, onStderr);
    if (pistonRes) return pistonRes;
  }

  // Otherwise run locally
  const localRes = await runCodeLocally(lang, code, stdin, onStdout, onStderr);

  // If local execution failed due to binary missing (e.g. exit code 127 or not found), fallback to Piston
  if (localRes.exitCode === 127 || localRes.stderr.includes('not found')) {
    const pistonFallback = await runCodeViaPiston(lang, code, stdin, onStdout, onStderr);
    if (pistonFallback) return pistonFallback;
  }

  return localRes;
}

async function runCodeLocally(
  lang: LanguageConfig,
  code: string,
  stdin: string,
  onStdout?: (chunk: string) => void,
  onStderr?: (chunk: string) => void
): Promise<ExecutionResult> {
  const execId = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `jigri-local-${execId}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const startTime = Date.now();

  try {
    let filename = `main${lang.extension}`;
    if (lang.id === 'java') filename = 'Main.java';

    const filePath = path.join(tmpDir, filename);
    await fs.writeFile(filePath, code, 'utf-8');

    let command = '';
    const isWindows = process.platform === 'win32';

    if (lang.id === 'python') {
      const py = isWindows ? 'python' : 'python3';
      command = `"${py}" "${filePath}"`;
    } else if (lang.id === 'javascript') {
      command = `node "${filePath}"`;
    } else if (lang.id === 'typescript') {
      command = `npx ts-node "${filePath}"`;
    } else if (lang.id === 'cpp') {
      const outExe = path.join(tmpDir, isWindows ? 'main.exe' : 'main');
      command = `g++ -std=c++17 "${filePath}" -o "${outExe}" && "${outExe}"`;
    } else if (lang.id === 'c') {
      const outExe = path.join(tmpDir, isWindows ? 'main.exe' : 'main');
      command = `gcc "${filePath}" -o "${outExe}" && "${outExe}"`;
    } else if (lang.id === 'java') {
      command = `javac "${filePath}" && java -cp "${tmpDir}" Main`;
    } else if (lang.id === 'go') {
      command = `go run "${filePath}"`;
    } else if (lang.id === 'ruby') {
      command = `ruby "${filePath}"`;
    } else if (lang.id === 'php') {
      command = `php "${filePath}"`;
    } else if (lang.id === 'rust') {
      const outExe = path.join(tmpDir, isWindows ? 'main.exe' : 'main');
      command = `rustc "${filePath}" -o "${outExe}" && "${outExe}"`;
    } else if (lang.id === 'bash') {
      command = `bash "${filePath}"`;
    } else {
      command = `node "${filePath}"`;
    }

    return await new Promise<ExecutionResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const child = exec(command, {
        cwd: tmpDir,
        timeout: lang.timeout || 15000,
        maxBuffer: MAX_OUTPUT_BYTES,
      }, (error, out, err) => {
        if (error && error.killed) {
          timedOut = true;
        }
        stdout = out || '';
        stderr = err || (error && !timedOut ? error.message : '');

        if (onStdout && stdout) onStdout(stdout);
        if (onStderr && stderr) onStderr(stderr);

        resolve({
          stdout: stdout.slice(0, MAX_OUTPUT_BYTES),
          stderr: stderr.slice(0, MAX_OUTPUT_BYTES),
          exitCode: timedOut ? 124 : (error ? (error.code ?? 1) : 0),
          executionTimeMs: Date.now() - startTime,
          timedOut,
        });
      });

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });
  } catch (error: any) {
    return {
      stdout: '',
      stderr: error.message || 'Execution failed',
      exitCode: 1,
      executionTimeMs: Date.now() - startTime,
      timedOut: false,
    };
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

async function runCodeViaDocker(
  lang: LanguageConfig,
  code: string,
  stdin: string,
  onStdout?: (chunk: string) => void,
  onStderr?: (chunk: string) => void
): Promise<ExecutionResult> {
  const docker = getDocker();
  const execId = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `jigri-${execId}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const startTime = Date.now();
  let container: Docker.Container | null = null;

  try {
    let filename = `main${lang.extension}`;
    if (lang.id === 'java') filename = 'Main.java';

    await fs.writeFile(path.join(tmpDir, filename), code, 'utf-8');
    if (stdin) await fs.writeFile(path.join(tmpDir, 'stdin.txt'), stdin, 'utf-8');

    let shellCmd = '';
    if (lang.compileCommand) {
      const compileStr = lang.compileCommand.join(' ');
      const runStr = lang.runCommand.join(' ');
      shellCmd = stdin
        ? `${compileStr} 2>&1 && ${runStr} < /code/stdin.txt`
        : `${compileStr} 2>&1 && ${runStr}`;
    } else {
      const runStr = lang.runCommand.join(' ');
      shellCmd = stdin ? `${runStr} < /code/stdin.txt` : runStr;
    }

    container = await docker.createContainer({
      Image: lang.dockerImage,
      Cmd: ['sh', '-c', shellCmd],
      WorkingDir: '/code',
      HostConfig: {
        Binds: [`${tmpDir}:/code:rw`],
        Memory: parseMemory(lang.memoryLimit),
        MemorySwap: parseMemory(lang.memoryLimit),
        CpuQuota: lang.cpuQuota,
        CpuPeriod: 100000,
        NetworkMode: env.DOCKER_NETWORK as string,
        AutoRemove: false,
        ReadonlyRootfs: false,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
        PidsLimit: 64,
      },
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
    });

    await container.start();

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    const outputPromise = new Promise<void>((resolve) => {
      let buffer = Buffer.alloc(0);

      stream.on('data', (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);
        if (buffer.length > MAX_OUTPUT_BYTES) {
          stderr += '\n[Output limit exceeded]';
          (stream as any).destroy?.();
          resolve();
          return;
        }

        let offset = 0;
        while (offset < buffer.length) {
          if (buffer.length - offset < 8) break;
          const streamType = buffer[offset];
          const size = buffer.readUInt32BE(offset + 4);
          if (buffer.length - offset - 8 < size) break;
          const payload = buffer.slice(offset + 8, offset + 8 + size).toString('utf-8');
          if (streamType === 1) {
            stdout += payload;
            onStdout?.(payload);
          } else if (streamType === 2) {
            stderr += payload;
            onStderr?.(payload);
          }
          offset += 8 + size;
        }
        buffer = buffer.slice(offset);
      });

      stream.on('end', resolve);
      stream.on('error', resolve);
    });

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(async () => {
        timedOut = true;
        try {
          await container!.stop({ t: 0 });
        } catch (_) {}
        resolve();
      }, lang.timeout);
    });

    await Promise.race([outputPromise, timeoutPromise]);

    let exitCode = 0;
    try {
      const inspect = await container.inspect();
      exitCode = inspect.State.ExitCode ?? 0;
    } catch (_) {}

    return {
      stdout: stdout.slice(0, MAX_OUTPUT_BYTES),
      stderr: stderr.slice(0, MAX_OUTPUT_BYTES),
      exitCode,
      executionTimeMs: Date.now() - startTime,
      timedOut,
    };
  } finally {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (_) {}
    }
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

function parseMemory(mem: string): number {
  if (mem === '0') return 0;
  const match = mem.match(/(\d+)([kmg]?)/i);
  if (!match) return 128 * 1024 * 1024;
  const val = parseInt(match[1]);
  const unit = (match[2] || '').toLowerCase();
  if (unit === 'k') return val * 1024;
  if (unit === 'm') return val * 1024 * 1024;
  if (unit === 'g') return val * 1024 * 1024 * 1024;
  return val;
}

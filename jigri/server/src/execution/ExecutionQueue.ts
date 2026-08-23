import { env } from '../config/env.js';

class SimpleQueue {
  private concurrency: number;
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        this.running++;
        try {
          const result = await task();
          resolve(result);
        } catch (e) {
          reject(e);
        } finally {
          this.running--;
          if (this.queue.length > 0) {
            const next = this.queue.shift()!;
            next();
          }
        }
      };

      if (this.running < this.concurrency) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }

  get size() { return this.queue.length; }
  get pending() { return this.running; }
}

const globalQueue = new SimpleQueue(env.MAX_CONCURRENT_EXECUTIONS);
const userQueues = new Map<string, SimpleQueue>();

function getUserQueue(userId: string): SimpleQueue {
  if (!userQueues.has(userId)) {
    userQueues.set(userId, new SimpleQueue(env.MAX_EXECUTIONS_PER_USER));
  }
  return userQueues.get(userId)!;
}

export async function enqueueExecution<T>(
  userId: string,
  task: () => Promise<T>
): Promise<T> {
  const userQueue = getUserQueue(userId);
  return userQueue.add(() => globalQueue.add(task));
}

export function getQueueStats() {
  return {
    globalSize: globalQueue.size,
    globalPending: globalQueue.pending,
    userCount: userQueues.size,
  };
}

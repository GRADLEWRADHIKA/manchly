import { randomUUID } from "crypto";

export type UploadJobStatus =
  | "queued"
  | "probing"
  | "normalizing"
  | "uploading"
  | "done"
  | "failed";

export interface UploadJob {
  id: string;
  userId: string;
  status: UploadJobStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  muxUploadId?: string;
  muxAssetId?: string;
  durationSeconds?: number;
  originalFilename?: string;
  reencoded?: boolean;
  reasons?: string[];
}

const jobs = new Map<string, UploadJob>();
const userLocks = new Set<string>();

// Jobs older than this are eligible for eviction.
const JOB_TTL_MS = 24 * 60 * 60 * 1000;

export function acquireUserLock(userId: string): boolean {
  if (userLocks.has(userId)) return false;
  userLocks.add(userId);
  return true;
}

export function releaseUserLock(userId: string): void {
  userLocks.delete(userId);
}

export function createJob(userId: string, originalFilename?: string): UploadJob {
  evictOldJobs();
  const job: UploadJob = {
    id: randomUUID(),
    userId,
    status: "queued",
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    originalFilename,
  };
  jobs.set(job.id, job);
  return job;
}

export function updateJob(id: string, patch: Partial<UploadJob>): UploadJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  Object.assign(job, patch, { updatedAt: new Date() });
  return job;
}

export function getJob(id: string): UploadJob | undefined {
  return jobs.get(id);
}

function evictOldJobs() {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.updatedAt.getTime() < cutoff) jobs.delete(id);
  }
}

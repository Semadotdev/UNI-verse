import { ApiClient } from "@/lib/api-client";

const QUEUE_KEY = "reward-queue:v1";
const MAX_QUEUE_SIZE = 200;

export interface RewardConfirmedDetails {
  providerId: string;
  mangaId: string;
  chapterId: string;
  balance?: number;
}

type RewardConfirmedHandler = (details: RewardConfirmedDetails) => void;

let rewardConfirmedHandler: RewardConfirmedHandler | null = null;

export function onRewardConfirmed(handler: RewardConfirmedHandler | null): void {
  rewardConfirmedHandler = handler;
}

interface RewardResponse {
  rewarded?: boolean;
  alreadyRewarded?: boolean;
  balance?: number;
}

export interface RewardJob {
  key: string;
  providerId: string;
  mangaId: string;
  chapterId: string;
  chapterNum: number;
  title?: string;
  coverUrl?: string;
  progress: number;
  completed: boolean;
}

export interface RewardClaim {
  shown: boolean;
}

function chapterKey(providerId: string, mangaId: string, chapterId: string): string {
  return `${providerId}/${mangaId}/${chapterId}`;
}

function readJobs(): RewardJob[] {
  try {
    const raw = globalThis.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RewardJob[]) : [];
  } catch {
    return [];
  }
}

function persistJobs(jobs: RewardJob[]): boolean {
  try {
    globalThis.localStorage.setItem(QUEUE_KEY, JSON.stringify(jobs));
    return true;
  } catch {
    return false;
  }
}

function removeJob(key: string): void {
  persistJobs(readJobs().filter((j) => j.key !== key));
}

export function pendingJobCount(): number {
  return readJobs().length;
}

let flushing = false;

export async function flushRewardQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    for (const job of readJobs()) {
      try {
        const data = await ApiClient.post<RewardResponse>(
          "/api/history",
          {
            providerId: job.providerId,
            mangaId: job.mangaId,
            chapterId: job.chapterId,
            chapterNum: job.chapterNum,
            title: job.title,
            coverUrl: job.coverUrl,
            progress: job.progress,
            completed: job.completed,
          },
          { keepalive: true }
        );
        if (data.rewarded === true) {
          removeJob(job.key);
          rewardConfirmedHandler?.({
            providerId: job.providerId,
            mangaId: job.mangaId,
            chapterId: job.chapterId,
            balance: data.balance,
          });
        } else if (data.alreadyRewarded === true) {
          removeJob(job.key);
        } else {
          // indeterminate outcome — keep the job queued for a later flush
        }
      } catch {
        // transient failure — keep the job queued for a later flush
      }
    }
  } finally {
    flushing = false;
  }
}

function fireAndForget(job: RewardJob): void {
  void ApiClient.post<RewardResponse>(
    "/api/history",
    {
      providerId: job.providerId,
      mangaId: job.mangaId,
      chapterId: job.chapterId,
      chapterNum: job.chapterNum,
      title: job.title,
      coverUrl: job.coverUrl,
      progress: job.progress,
      completed: job.completed,
    },
    { keepalive: true }
  )
    .then((data) => {
      if (data.rewarded === true) {
        rewardConfirmedHandler?.({
          providerId: job.providerId,
          mangaId: job.mangaId,
          chapterId: job.chapterId,
          balance: data.balance,
        });
      }
    })
    .catch(() => {});
}

export function claimChapterReward(details: {
  providerId: string;
  mangaId: string;
  chapterId: string;
  chapterNum: number;
  title?: string;
  coverUrl?: string;
}): RewardClaim {
  const job: RewardJob = {
    ...details,
    key: chapterKey(details.providerId, details.mangaId, details.chapterId),
    progress: 100,
    completed: true,
  };

  const jobs = readJobs();
  if (!jobs.some((j) => j.key === job.key)) {
    jobs.push(job);
    if (!persistJobs(jobs.slice(-MAX_QUEUE_SIZE))) {
      fireAndForget(job);
    }
  }

  void flushRewardQueue();
  return { shown: true };
}

export function registerRewardFlusher(): () => void {
  const flush = () => {
    void flushRewardQueue();
  };
  flush();
  window.addEventListener("online", flush);
  const onVisibility = () => {
    if (document.visibilityState === "visible") flush();
  };
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.removeEventListener("online", flush);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
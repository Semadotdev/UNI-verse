export interface ReaderProgressState {
  progress: number;
  completed: boolean;
}

/**
 * Rewards near-completion reads that stop just short of the last page,
 * e.g. when the final image fails to load or the user swipes off early.
 */
export const COMPLETION_THRESHOLD = 0.95;

export function computeReaderProgress(
  currentPage: number,
  totalPages: number
): ReaderProgressState {
  if (totalPages <= 0) return { progress: 0, completed: false };
  const ratio = (currentPage + 1) / totalPages;
  return {
    progress: Math.min(100, ratio * 100),
    completed: ratio >= COMPLETION_THRESHOLD,
  };
}
export interface ReaderProgressState {
  progress: number;
  completed: boolean;
}

export function computeReaderProgress(
  currentPage: number,
  totalPages: number
): ReaderProgressState {
  if (totalPages <= 0) return { progress: 0, completed: false };
  return {
    progress: Math.min(100, ((currentPage + 1) / totalPages) * 100),
    completed: currentPage >= totalPages - 1,
  };
}

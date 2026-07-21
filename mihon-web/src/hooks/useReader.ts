"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseReaderOptions {
  sourceId: string;
  chapterId: string;
  mangaId: string;
  totalSteps: number;
  onProgress?: (step: number, total: number) => void;
}

export function useReader({
  sourceId,
  chapterId,
  mangaId,
  totalSteps,
  onProgress,
}: UseReaderOptions) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preloadRange] = useState(3);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track progress and save to history (debounced)
  useEffect(() => {
    if (currentStep === 0) return;

    onProgress?.(currentStep, totalSteps);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaId,
          sourceId,
          chapterId,
          progress: totalSteps > 1 ? currentStep / (totalSteps - 1) : 1,
        }),
      }).catch(console.error);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentStep, totalSteps, mangaId, sourceId, chapterId, onProgress]);

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(Math.max(0, Math.min(totalSteps - 1, step)));
    },
    [totalSteps]
  );

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  // Calculate which pages to preload
  const getPreloadIndices = useCallback(() => {
    const indices: number[] = [];
    for (let i = 1; i <= preloadRange; i++) {
      const nextIdx = currentStep + i;
      if (nextIdx < totalSteps) {
        indices.push(nextIdx);
      }
    }
    return indices;
  }, [currentStep, totalSteps, preloadRange]);

  return {
    currentStep,
    goToStep,
    goNext,
    goPrev,
    getPreloadIndices,
    progress: totalSteps > 1 ? currentStep / (totalSteps - 1) : 0,
  };
}

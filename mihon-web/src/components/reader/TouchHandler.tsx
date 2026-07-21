"use client";

import { useRef, useCallback, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TouchHandlerProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  enabled?: boolean;
  className?: string;
}

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

export function TouchHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  enabled = true,
  className,
}: TouchHandlerProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastDeltaRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setIsSwiping(false);
      setSwipeOffset(0);
      lastDeltaRef.current = { x: 0, y: 0 };
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      lastDeltaRef.current = { x: deltaX, y: deltaY };

      // Only track horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        setIsSwiping(true);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(() => {
          setSwipeOffset(deltaX);
        });
      }
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !touchStartRef.current) return;

    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const startTime = touchStartRef.current.time;

    touchStartRef.current = null;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const deltaX = lastDeltaRef.current.x;
    const deltaY = lastDeltaRef.current.y;
    const elapsed = Date.now() - startTime;
    const velocity = Math.abs(deltaX) / elapsed;

    setIsSwiping(false);
    setSwipeOffset(0);

    // Check for vertical swipe up first
    if (deltaY < -SWIPE_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
      onSwipeUp?.();
      return;
    }

    // Check horizontal swipe
    if (Math.abs(deltaX) < SWIPE_THRESHOLD && velocity < SWIPE_VELOCITY_THRESHOLD) {
      return;
    }

    if (deltaX < -SWIPE_THRESHOLD || (deltaX < 0 && velocity >= SWIPE_VELOCITY_THRESHOLD)) {
      onSwipeLeft?.();
    } else if (deltaX > SWIPE_THRESHOLD || (deltaX > 0 && velocity >= SWIPE_VELOCITY_THRESHOLD)) {
      onSwipeRight?.();
    }
  }, [enabled, onSwipeLeft, onSwipeRight, onSwipeUp]);

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = null;
    setIsSwiping(false);
    setSwipeOffset(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  return (
    <div
      className={cn("touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div
        className={cn(
          "transition-transform",
          isSwiping ? "duration-0" : "duration-200 ease-out"
        )}
        style={{
          transform: isSwiping ? `translateX(${swipeOffset * 0.4}px)` : "translateX(0)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

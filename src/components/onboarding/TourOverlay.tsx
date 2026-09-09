"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTour } from "./TourContext";

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getVisibleElement(selector: string): Element | null {
  const elements = document.querySelectorAll(selector);
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return el;
    }
  }
  return null;
}

function isFullyVisible(rect: DOMRect): boolean {
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

function rectsOverlap(a: HighlightRect, b: HighlightRect): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

function mergeRects(rects: HighlightRect[]): HighlightRect[] {
  const out: HighlightRect[] = [];
  for (const r of rects) {
    let current = r;
    let didMerge = false;
    for (let i = 0; i < out.length; ) {
      if (rectsOverlap(out[i], current)) {
        const left = Math.min(out[i].left, current.left);
        const top = Math.min(out[i].top, current.top);
        const right = Math.max(out[i].left + out[i].width, current.left + current.width);
        const bottom = Math.max(out[i].top + out[i].height, current.top + current.height);
        current = { left, top, width: right - left, height: bottom - top };
        out.splice(i, 1);
        didMerge = true;
      } else {
        i++;
      }
    }
    out.push(didMerge ? current : r);
  }
  return out;
}

function buildClipPolygon(rects: HighlightRect[]): string {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const points: string[] = [
    "0 0",
    `${vw}px 0`,
    `${vw}px ${vh}px`,
    `0 ${vh}px`,
    "0 0",
  ];
  for (const r of rects) {
    const right = r.left + r.width;
    const bottom = r.top + r.height;
    points.push(
      `${r.left}px ${r.top}px`,
      `${right}px ${r.top}px`,
      `${right}px ${bottom}px`,
      `${r.left}px ${bottom}px`,
      `${r.left}px ${r.top}px`
    );
  }
  return `polygon(evenodd, ${points.join(", ")})`;
}

export function TourOverlay() {
  const {
    phase,
    currentStepIndex,
    steps,
    currentStep,
    isStepOnCurrentPage,
    advanceStep,
    prevStep,
    skipTour,
  } = useTour();

  const [rect, setRect] = useState<HighlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [resolvedPlacement, setResolvedPlacement] = useState<"top" | "bottom" | "left" | "right">("bottom");
  const [waitingForElement, setWaitingForElement] = useState(false);
  const [clickRects, setClickRects] = useState<HighlightRect[]>([]);
  const rafRef = useRef<number>(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wasVisibleRef = useRef(false);
  const advancedFromDisappearRef = useRef(false);
  const clickRectsRef = useRef<HighlightRect[]>([]);

  const isInteractive = phase === "interactive";
  const isActive = phase === "interactive" || phase === "tooltip";

  const tooltipStartIndex = isActive
    ? steps.findIndex((s) => s.phase === "tooltip")
    : -1;
  const stepCounter = isInteractive
    ? `${currentStepIndex + 1} of ${tooltipStartIndex}`
    : `${currentStepIndex - tooltipStartIndex + 1} of ${steps.length - tooltipStartIndex}`;

  const updatePosition = useCallback(() => {
    if (!currentStep) return;

    const collectHoles = (base: HighlightRect | null): HighlightRect[] => {
      if (!isInteractive) return [];
      const holes: HighlightRect[] = [];
      if (base) holes.push(base);

      if (currentStep.allowSelectors) {
        for (const sel of currentStep.allowSelectors) {
          const allowedEl = getVisibleElement(sel);
          if (allowedEl) {
            const ar = allowedEl.getBoundingClientRect();
            holes.push({ top: ar.top, left: ar.left, width: ar.width, height: ar.height });
          }
        }
      }

      document
        .querySelectorAll("input, textarea, select, [contenteditable]")
        .forEach((el) => {
          const fr = el.getBoundingClientRect();
          if (fr.width > 0 && fr.height > 0) {
            holes.push({ top: fr.top, left: fr.left, width: fr.width, height: fr.height });
          }
        });

      return holes;
    };

    const el = getVisibleElement(currentStep.selector);
    if (!el) {
      if (
        currentStep.advanceOn === "disappear" &&
        wasVisibleRef.current &&
        !advancedFromDisappearRef.current
      ) {
        advancedFromDisappearRef.current = true;
        clickRectsRef.current = [];
        setClickRects([]);
        advanceStep();
        return;
      }
      const holes = mergeRects(collectHoles(null));
      clickRectsRef.current = holes;
      setClickRects(holes);
      setRect(null);
      setWaitingForElement(true);
      return;
    }

    wasVisibleRef.current = true;
    setWaitingForElement(false);
    const r = el.getBoundingClientRect();
    const padding = 8;
    const newRect = {
      top: r.top - padding,
      left: r.left - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2,
    };
    setRect(newRect);

    const holes = mergeRects(collectHoles(newRect));
    clickRectsRef.current = holes;
    setClickRects(holes);

    const preferred = currentStep.placement ?? "bottom";
    const gap = 12;
    const tooltipWidth = tooltipRef.current?.offsetWidth ?? 288;
    const tooltipHeight = tooltipRef.current?.offsetHeight ?? 160;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 768;

    const elementCenterY = newRect.top + newRect.height / 2;
    const isNearBottom = elementCenterY > vh * 0.75;
    const isNearTop = elementCenterY < vh * 0.25;

    let placement = preferred;
    if (isMobile) {
      if (isNearBottom && placement === "bottom") {
        placement = "top";
      } else if (isNearTop && placement === "top") {
        placement = "bottom";
      }
    }

    let top = 0;
    let left = 0;

    const calcPosition = (p: "top" | "bottom" | "left" | "right") => {
      switch (p) {
        case "top":
          return {
            top: newRect.top - gap - tooltipHeight,
            left: newRect.left + newRect.width / 2,
            flipX: true,
          };
        case "bottom":
          return {
            top: newRect.top + newRect.height + gap,
            left: newRect.left + newRect.width / 2,
            flipX: true,
          };
        case "left":
          return {
            top: newRect.top + newRect.height / 2,
            left: newRect.left - gap - tooltipWidth,
            flipX: false,
          };
        case "right":
          return {
            top: newRect.top + newRect.height / 2,
            left: newRect.left + newRect.width + gap,
            flipX: false,
          };
      }
    };

    let pos = calcPosition(placement);

    if (pos.flipX) {
      if (pos.left - tooltipWidth / 2 < 8) {
        pos = { ...pos, left: tooltipWidth / 2 + 8 };
      } else if (pos.left + tooltipWidth / 2 > vw - 8) {
        pos = { ...pos, left: vw - tooltipWidth / 2 - 8 };
      }
    }

    if (placement === "top" && pos.top < 8) {
      placement = "bottom";
      pos = calcPosition("bottom");
    } else if (placement === "bottom" && pos.top + tooltipHeight > vh - 8) {
      placement = "top";
      pos = calcPosition("top");
    } else if (placement === "left" && pos.left < 8) {
      placement = "right";
      pos = calcPosition("right");
    } else if (placement === "right" && pos.left + tooltipWidth > vw - 8) {
      placement = "left";
      pos = calcPosition("left");
    }

    if (pos.flipX) {
      if (pos.left - tooltipWidth / 2 < 8) {
        pos = { ...pos, left: tooltipWidth / 2 + 8 };
      } else if (pos.left + tooltipWidth / 2 > vw - 8) {
        pos = { ...pos, left: vw - tooltipWidth / 2 - 8 };
      }
    }

    top = pos.top;
    left = pos.left;
    setResolvedPlacement(placement);

    setTooltipStyle({
      position: "fixed",
      top,
      left,
      transform:
        placement === "top" || placement === "bottom"
          ? "translateX(-50%)"
          : placement === "left"
            ? "translateX(-100%) translateY(-50%)"
            : "translateY(-50%)",
      zIndex: 10001,
    });
  }, [currentStep, advanceStep, isInteractive]);

  useEffect(() => {
    wasVisibleRef.current = false;
    advancedFromDisappearRef.current = false;
  }, [currentStepIndex, currentStep?.id]);

  useEffect(() => {
    if (!isActive || !isStepOnCurrentPage) return;

    const tick = () => {
      updatePosition();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, isStepOnCurrentPage, updatePosition]);

  useEffect(() => {
    if (!isActive || !currentStep || !isStepOnCurrentPage) return;

    const el = getVisibleElement(currentStep.selector);
    if (el) {
      const r = el.getBoundingClientRect();
      if (!isFullyVisible(r)) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isActive, currentStepIndex, currentStep, isStepOnCurrentPage]);

  useEffect(() => {
    if (!isActive || !isStepOnCurrentPage || !currentStep) return;

    if (isInteractive && currentStep.advanceOn !== "disappear") {
      const handler = (e: Event) => {
        const target = e.target as HTMLElement;
        const el = getVisibleElement(currentStep.selector);
        if (!el || !(el === target || el.contains(target))) return;

        if (currentStep.id === "search-results") {
          const mangaLink = target.closest('a[href^="/manga/"]');
          if (!mangaLink) return;
        }

        advanceStep();
      };
      document.addEventListener("click", handler, true);

      return () => {
        document.removeEventListener("click", handler, true);
      };
    }
  }, [isActive, isStepOnCurrentPage, isInteractive, currentStep, advanceStep]);

  useEffect(() => {
    if (!isActive || !isInteractive || !currentStep || !isStepOnCurrentPage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      if (target.closest('[role="dialog"]')) return;
      const r = target.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const insideHole = clickRectsRef.current.some(
        (hole) =>
          cx >= hole.left &&
          cx <= hole.left + hole.width &&
          cy >= hole.top &&
          cy <= hole.top + hole.height
      );
      if (!insideHole) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isActive, isInteractive, currentStep, isStepOnCurrentPage]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isInteractive) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl?.closest?.('[role="dialog"]')) return;
        skipTour();
      } else if (!isInteractive && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        advanceStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isActive, isInteractive, advanceStep, skipTour]);

  useEffect(() => {
    if (!waitingForElement || !isActive || !currentStep) return;

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 500;
      const el = getVisibleElement(currentStep.selector);
      if (el) {
        clearInterval(interval);
        setWaitingForElement(false);
      } else if (!isInteractive && elapsed >= 10000) {
        clearInterval(interval);
        advanceStep();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [waitingForElement, isActive, currentStep, advanceStep, isInteractive]);

  useEffect(() => {
    if (!isActive || !currentStep || isInteractive) return;
    if (currentStep.desktopOnly && window.innerWidth < 768) {
      advanceStep();
    }
  }, [isActive, currentStep, isInteractive, advanceStep]);

  if (!isActive || !currentStep || !isStepOnCurrentPage) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] pointer-events-none"
        style={{
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
          background: "transparent",
        }}
      />

      {isInteractive && (
        <div
          className="fixed inset-0 z-[10000]"
          style={
            clickRects.length > 0
              ? { clipPath: buildClipPolygon(clickRects) }
              : undefined
          }
        />
      )}

      {rect && (
        <div
          className="fixed z-[10000] pointer-events-none rounded-lg border-2 border-primary"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 12px 2px rgba(168, 85, 247, 0.4)",
            transition: "all 0.2s ease-out",
          }}
        />
      )}

      {waitingForElement && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 shadow-xl">
          <span className="animate-pulse">Waiting for page to load...</span>
        </div>
      )}

      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl pointer-events-auto"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-zinc-100">
              {currentStep.title}
            </h3>
            <span className="text-xs text-zinc-500">
              {isInteractive ? "Step " : ""}
              {stepCounter}
            </span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">{currentStep.content}</p>
          {isInteractive && currentStep.advanceOn !== "disappear" && (
            <p className="text-xs text-primary mt-2 font-medium">
              Tap the highlighted element to continue
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={skipTour}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Skip tutorial
          </button>

          {!isInteractive && (
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={advanceStep}
                className="px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-all"
              >
                {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
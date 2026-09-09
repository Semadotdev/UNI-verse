"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { TourHighlight } from "./TourSteps";

const WELCOME_KEY = "uni-verse-welcome-seen";
const TOUR_KEY = "uni-verse-tour-completed";

export type TourPhase = "welcome" | "interactive" | "tooltip" | "done";

interface TourContextValue {
  showWelcome: boolean;
  phase: TourPhase;
  currentStepIndex: number;
  steps: TourHighlight[];
  currentStep: TourHighlight | null;
  isStepOnCurrentPage: boolean;
  dismissWelcome: () => void;
  startTour: () => void;
  advanceStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

function matchesPage(stepPage: string, currentPath: string): boolean {
  if (stepPage === "*") return true;
  if (stepPage === currentPath) return true;
  const stepParts = stepPage.split("/").filter(Boolean);
  const pathParts = currentPath.split("/").filter(Boolean);
  if (stepParts.length > pathParts.length) return false;
  return stepParts.every(
    (part, i) => part === "*" || part === pathParts[i]
  );
}

export function TourProvider({
  children,
  steps,
}: {
  children: ReactNode;
  steps: TourHighlight[];
}) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [phase, setPhase] = useState<TourPhase>("done");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const navigatingToRef = useRef<string | null>(null);

  const currentStep = steps[currentStepIndex] ?? null;

  const isStepOnCurrentPage = useMemo(() => {
    if (!currentStep) return false;
    return matchesPage(currentStep.page, pathname);
  }, [currentStep, pathname]);

  useEffect(() => {
    if (isAuthPage) return;

    try {
      const welcomeSeen = localStorage.getItem(WELCOME_KEY);
      const tourCompleted = localStorage.getItem(TOUR_KEY);

      if (!welcomeSeen && !tourCompleted) {
        setShowWelcome(true);
      }
    } catch {}
  }, [isAuthPage]);

  useEffect(() => {
    const active = phase === "interactive" || phase === "tooltip";
    if (!active || !currentStep) {
      navigatingToRef.current = null;
      return;
    }

    if (matchesPage(currentStep.page, pathname)) {
      navigatingToRef.current = null;
      return;
    }

    if (currentStep.userNavigates) {
      navigatingToRef.current = null;
      return;
    }

    if (navigatingToRef.current === currentStep.page) return;

    navigatingToRef.current = currentStep.page;
    const timer = setTimeout(() => {
      navigatingToRef.current = null;
      router.push(currentStep.page);
    }, 800);

    return () => clearTimeout(timer);
  }, [currentStepIndex, phase, currentStep, pathname, router]);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {}
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setPhase("interactive");
    setCurrentStepIndex(0);

    const firstStep = steps[0];
    if (firstStep && !matchesPage(firstStep.page, pathname)) {
      navigatingToRef.current = firstStep.page;
      router.push(firstStep.page);
    }
  }, [steps, pathname, router]);

  const advanceStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const current = steps[prev];
      const nextIndex = prev + 1;

      if (nextIndex >= steps.length) {
        setPhase("done");
        try {
          localStorage.setItem(TOUR_KEY, "1");
        } catch {}
        return 0;
      }

      const nextStep = steps[nextIndex];

      if (current && current.phase === "interactive" && nextStep.phase === "tooltip") {
        setPhase("tooltip");
      }

      return nextIndex;
    });
  }, [steps]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    setPhase("done");
    setCurrentStepIndex(0);
    navigatingToRef.current = null;
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {}
  }, []);

  const completeTour = useCallback(() => {
    setPhase("done");
    setCurrentStepIndex(0);
    navigatingToRef.current = null;
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      showWelcome,
      phase,
      currentStepIndex,
      steps,
      currentStep,
      isStepOnCurrentPage,
      dismissWelcome,
      startTour,
      advanceStep,
      prevStep,
      skipTour,
      completeTour,
    }),
    [
      showWelcome,
      phase,
      currentStepIndex,
      steps,
      currentStep,
      isStepOnCurrentPage,
      dismissWelcome,
      startTour,
      advanceStep,
      prevStep,
      skipTour,
      completeTour,
    ]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordRoute } from "@/lib/navigation-history";

export function RouteHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    recordRoute(window.location.pathname + window.location.search);
  }, [pathname]);

  return null;
}

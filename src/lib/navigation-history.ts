const ROUTE_HISTORY_KEY = "uni-verse:route-history";
const MAX_ENTRIES = 30;

function readRouteHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(ROUTE_HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function recordRoute(route: string): void {
  if (typeof window === "undefined" || !route) return;
  const history = readRouteHistory();
  if (history[history.length - 1] === route) return;
  history.push(route);
  if (history.length > MAX_ENTRIES) {
    history.splice(0, history.length - MAX_ENTRIES);
  }
  try {
    window.sessionStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage failures (private mode, quota exceeded).
  }
}

export function getPreviousRoute(currentRoute: string): string | null {
  const history = readRouteHistory();
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  const previous = last === currentRoute ? history[history.length - 2] : last;
  if (!previous || previous === currentRoute) return null;
  return previous;
}

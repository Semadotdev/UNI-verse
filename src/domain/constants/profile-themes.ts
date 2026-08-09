export type ThemeAnimation =
  | { kind: "aurora"; blobs: { color: string; size: string; duration: number }[] }
  | { kind: "stardust"; starCount: number }
  | { kind: "embers"; emberCount: number }
  | { kind: "waves"; layers: { color: string; duration: number }[] }
  | { kind: "neon"; duration: number }
  | { kind: "matrix"; columnCount: number };

export interface ProfileTheme {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: {
    background: [string, string];
    accent: string;
  };
  animation?: ThemeAnimation;
}

export const DEFAULT_THEME_ID = "default";

export const PROFILE_THEMES: ProfileTheme[] = [
  {
    id: "default",
    name: "Default",
    description: "The classic look.",
    price: 0,
    colors: { background: ["#111118", "#111118"], accent: "#7C3AED" },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm dusk gradients for cozy nights.",
    price: 25,
    colors: { background: ["#3d1f3d", "#c96f4a"], accent: "#f2cc8f" },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool waves and deep blue.",
    price: 40,
    colors: { background: ["#0b2a3a", "#1f7a8c"], accent: "#66e0ff" },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Quiet indigo after hours.",
    price: 60,
    colors: { background: ["#0d0d1a", "#1b1b3a"], accent: "#818cf8" },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Electric vibes that pop.",
    price: 100,
    colors: { background: ["#120a2f", "#3f1d78"], accent: "#00ffd1" },
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Slow drifting ribbons of light.",
    price: 150,
    colors: { background: ["#0a0a14", "#141428"], accent: "#a5b4fc" },
    animation: {
      kind: "aurora",
      blobs: [
        { color: "#7C3AED", size: "70%", duration: 14 },
        { color: "#06b6d4", size: "60%", duration: 18 },
        { color: "#ec4899", size: "50%", duration: 22 },
      ],
    },
  },
  {
    id: "stardust",
    name: "Stardust",
    description: "Twinkling stars in deep space.",
    price: 180,
    colors: { background: ["#0b1026", "#141b3a"], accent: "#c7d2fe" },
    animation: { kind: "stardust", starCount: 26 },
  },
  {
    id: "embers",
    name: "Embers",
    description: "Warm sparks floating upward.",
    price: 200,
    colors: { background: ["#150b1e", "#0a0512"], accent: "#ffb347" },
    animation: { kind: "embers", emberCount: 14 },
  },
  {
    id: "waves",
    name: "Ocean Waves",
    description: "Layered rolling waves at dusk.",
    price: 220,
    colors: { background: ["#062b3f", "#0b3d4f"], accent: "#66e0ff" },
    animation: {
      kind: "waves",
      layers: [
        { color: "rgba(102,224,255,0.35)", duration: 9 },
        { color: "rgba(102,224,255,0.2)", duration: 13 },
      ],
    },
  },
  {
    id: "neonpulse",
    name: "Neon Pulse",
    description: "Shifting gradient with a glowing ring.",
    price: 250,
    colors: { background: ["#120a2f", "#3f1d78"], accent: "#00ffd1" },
    animation: { kind: "neon", duration: 8 },
  },
  {
    id: "digitalrain",
    name: "Digital Rain",
    description: "Falling columns of glyphs.",
    price: 300,
    colors: { background: ["#040a04", "#081408"], accent: "#22c55e" },
    animation: { kind: "matrix", columnCount: 4 },
  },
];

export function getProfileTheme(id: string): ProfileTheme | undefined {
  return PROFILE_THEMES.find((t) => t.id === id);
}

export function resolveProfileTheme(id: string | null | undefined): ProfileTheme {
  return getProfileTheme(id ?? DEFAULT_THEME_ID) ?? PROFILE_THEMES[0];
}

export function isDefaultTheme(id: string): boolean {
  return id === DEFAULT_THEME_ID;
}

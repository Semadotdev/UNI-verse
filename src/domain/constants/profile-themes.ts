export interface ProfileTheme {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: {
    background: [string, string];
    accent: string;
  };
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

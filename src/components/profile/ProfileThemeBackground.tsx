"use client";

import type { CSSProperties } from "react";
import type { ProfileTheme, ThemeAnimation } from "@/domain/constants/profile-themes";

interface ProfileThemeBackgroundProps {
  theme: ProfileTheme;
  className?: string;
}

function hash(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const AURORA_POSITIONS = [
  { top: "-20%", left: "-15%" },
  { bottom: "-30%", right: "-20%" },
  { top: "20%", left: "40%" },
] as const;

const MATRIX_GLYPHS = "0123456789カタナザクラ";

function renderLayers(animation: ThemeAnimation, accent: string): React.ReactNode {
  switch (animation.kind) {
    case "aurora":
      return animation.blobs.map((b, i) => {
        const pos = AURORA_POSITIONS[i % AURORA_POSITIONS.length];
        return (
          <div
            key={i}
            className="theme-aurora-blob"
            style={
              {
                background: b.color,
                width: b.size,
                height: b.size,
                ...pos,
                animationDuration: `${b.duration}s`,
              } as CSSProperties
            }
          />
        );
      });

    case "stardust":
      return Array.from({ length: animation.starCount }, (_, i) => {
        const size = 2 + Math.round(hash(i, 3) * 2);
        return (
          <div
            key={i}
            className={"theme-star" + (size >= 3 ? " theme-star-big" : "")}
            style={
              {
                left: `${Math.round(4 + hash(i, 1) * 92)}%`,
                top: `${Math.round(5 + hash(i, 2) * 55)}%`,
                width: size,
                height: size,
                animationDuration: `${(2 + hash(i, 4) * 2).toFixed(2)}s`,
                animationDelay: `${-(hash(i, 5) * 3).toFixed(2)}s`,
              } as CSSProperties
            }
          />
        );
      });

    case "embers":
      return Array.from({ length: animation.emberCount }, (_, i) => (
        <div
          key={i}
          className="theme-ember"
          style={
            {
              left: `${Math.round(4 + hash(i, 1) * 92)}%`,
              animationDuration: `${(4 + hash(i, 2) * 4).toFixed(2)}s`,
              animationDelay: `${-(hash(i, 3) * 6).toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ));

    case "waves":
      return animation.layers.map((l, i) => (
        <div
          key={i}
          className="theme-wave"
          style={{ background: l.color, animationDuration: `${l.duration}s` } as CSSProperties}
        />
      ));

    case "neon":
      return (
        <>
          <div
            className="theme-neon"
            style={{ animationDuration: `${animation.duration}s` } as CSSProperties}
          />
          <div
            className="theme-neon-ring"
            style={{ borderColor: accent } as CSSProperties}
          />
        </>
      );

    case "matrix":
      return Array.from({ length: animation.columnCount }, (_, i) => (
        <div
          key={i}
          className="theme-matrix-col"
          style={
            {
              left: `${Math.round(4 + i * (90 / animation.columnCount))}%`,
              animationDuration: `${(4 + hash(i, 2) * 3).toFixed(2)}s`,
              animationDelay: `${-(hash(i, 3) * 5).toFixed(2)}s`,
            } as CSSProperties
          }
        >
          {MATRIX_GLYPHS}
        </div>
      ));
  }
}

export function ProfileThemeBackground({ theme, className }: ProfileThemeBackgroundProps) {
  if (!theme.animation) return null;
  return (
    <div aria-hidden className={"theme-bg" + (className ? " " + className : "")}>
      <div className="absolute inset-0 bg-black/25" />
      {renderLayers(theme.animation, theme.colors.accent)}
    </div>
  );
}

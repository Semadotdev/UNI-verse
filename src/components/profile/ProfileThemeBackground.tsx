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

const WEBTOON_SPARKS = [
  { left: "22%", top: "28%", duration: 3.2, delay: -1.1 },
  { left: "72%", top: "20%", duration: 2.6, delay: -2.2 },
  { left: "48%", top: "62%", duration: 2.9, delay: -0.4 },
] as const;

function renderLayers(animation: ThemeAnimation, colors: ProfileTheme["colors"]): React.ReactNode {
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
            style={{ borderColor: colors.accent } as CSSProperties}
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

    case "webtoon":
      if (animation.scene === "kingdom") {
        return (
          <>
            <div
              className="theme-kingdom-sky"
              style={{
                background: `linear-gradient(180deg, ${colors.background[0]} 0%, #f7dd9a 52%, ${colors.background[1]} 100%)`,
              }}
            />
            <div className="theme-kingdom-sun" />
            <div className="theme-kingdom-rays" />
            <svg
              className="theme-kingdom-landscape"
              viewBox="0 0 960 146"
              preserveAspectRatio="xMidYMax meet"
            >
              <defs>
                <linearGradient id="gc-hill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#d9b478" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#b98e4e" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="gc-gold1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffe9b8" />
                  <stop offset="1" stopColor="#f0c46a" />
                </linearGradient>
                <linearGradient id="gc-gold2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#e5b55f" />
                  <stop offset="1" stopColor="#c08a34" />
                </linearGradient>
                <linearGradient id="gc-gold3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#b0853a" />
                  <stop offset="1" stopColor="#7e5419" />
                </linearGradient>
                <linearGradient id="gc-gate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff3cf" />
                  <stop offset="1" stopColor="#e8b44a" />
                </linearGradient>
              </defs>
              <g className="theme-kingdom-mountains theme-kingdom-blur">
                <path d="M0 116 L120 92 L210 108 L330 84 L470 100 L610 78 L740 96 L860 86 L960 108 L960 146 L0 146 Z" fill="url(#gc-hill)" />
              </g>
              <g className="theme-kingdom-city">
                <rect x="250" y="138" width="180" height="8" fill="#c08a34" />
                <rect x="566" y="138" width="134" height="8" fill="#c08a34" />
                <path d="M258 138 L262 130 L266 138 Z M282 138 L286 130 L290 138 Z M306 138 L310 130 L314 138 Z M330 138 L334 130 L338 138 Z M354 138 L358 130 L362 138 Z M378 138 L382 130 L386 138 Z M402 138 L406 130 L410 138 Z M426 138 L430 130 L434 138 Z" fill="#f0c46a" />
                <path d="M568 138 L572 130 L576 138 Z M592 138 L596 130 L600 138 Z M616 138 L620 130 L624 138 Z M640 138 L644 130 L648 138 Z M664 138 L668 130 L672 138 Z M688 138 L692 130 L696 138 Z" fill="#f0c46a" />
              </g>
              <g className="theme-kingdom-castle">
                <rect x="236" y="132" width="48" height="14" fill="#7e5419" />
                <path d="M232 132 L260 102 L288 132 Z" fill="#e5b55f" />
                <rect x="252" y="136" width="6" height="6" fill="#ffefc0" opacity="0.8" />
                <rect x="660" y="132" width="48" height="14" fill="#7e5419" />
                <path d="M656 132 L684 102 L712 132 Z" fill="#e5b55f" />
                <rect x="676" y="136" width="6" height="6" fill="#ffefc0" opacity="0.8" />
                <rect x="300" y="126" width="52" height="20" fill="#c08a34" />
                <path d="M296 126 L326 84 L356 126 Z" fill="url(#gc-gold1)" />
                <path d="M326 84 L326 58" stroke="#f0c46a" strokeWidth="2" />
                <circle cx="326" cy="55" r="3" fill="#fff3cf" />
                <path d="M326 58 L326 44 L344 52 Z" fill="#e8b44a" />
                <rect x="312" y="130" width="7" height="6" fill="#ffefc0" />
                <rect x="334" y="130" width="7" height="6" fill="#ffefc0" />
                <rect x="312" y="138" width="7" height="6" fill="#ffefc0" />
                <rect x="334" y="138" width="7" height="6" fill="#ffefc0" />
                <rect x="600" y="126" width="52" height="20" fill="#c08a34" />
                <path d="M596 126 L626 84 L656 126 Z" fill="url(#gc-gold1)" />
                <path d="M626 84 L626 58" stroke="#f0c46a" strokeWidth="2" />
                <circle cx="626" cy="55" r="3" fill="#fff3cf" />
                <path d="M626 58 L626 44 L608 52 Z" fill="#e8b44a" />
                <rect x="612" y="130" width="7" height="6" fill="#ffefc0" />
                <rect x="634" y="130" width="7" height="6" fill="#ffefc0" />
                <rect x="612" y="138" width="7" height="6" fill="#ffefc0" />
                <rect x="634" y="138" width="7" height="6" fill="#ffefc0" />
                <rect x="420" y="108" width="184" height="12" fill="url(#gc-gold1)" />
                <path d="M420 108 Q510 34 600 108 Z" fill="url(#gc-gold1)" />
                <circle cx="510" cy="30" r="5" fill="#fff3cf" />
                <path d="M510 30 L510 14" stroke="#f0c46a" strokeWidth="2" />
                <path d="M510 14 L510 0 L530 9 Z" fill="#e8b44a" />
                <rect x="430" y="118" width="140" height="28" fill="url(#gc-gold2)" />
                <rect x="434" y="118" width="8" height="28" fill="#ffe9b8" />
                <rect x="546" y="118" width="8" height="28" fill="#ffe9b8" />
                <rect x="452" y="122" width="8" height="8" fill="#ffefc0" />
                <rect x="476" y="122" width="8" height="8" fill="#ffefc0" />
                <rect x="500" y="122" width="8" height="8" fill="#ffefc0" />
                <rect x="524" y="122" width="8" height="8" fill="#ffefc0" />
                <rect x="548" y="122" width="8" height="8" fill="#ffefc0" />
                <rect x="452" y="134" width="8" height="8" fill="#ffefc0" />
                <rect x="476" y="134" width="8" height="8" fill="#ffefc0" />
                <rect x="500" y="134" width="8" height="8" fill="#ffefc0" />
                <rect x="524" y="134" width="8" height="8" fill="#ffefc0" />
                <rect x="548" y="134" width="8" height="8" fill="#ffefc0" />
                <path d="M466 146 L466 132 A22 22 0 0 1 510 110 A22 22 0 0 1 554 132 L554 146 Z" fill="url(#gc-gate)" />
                <path d="M484 146 L484 116 M494 146 L494 112 M506 146 L506 111 M518 146 L518 112 M528 146 L528 116 M538 146 L538 120" stroke="#7e5419" strokeWidth="2" opacity="0.55" />
              </g>
              <g className="theme-kingdom-foreground">
                <path d="M0 146 L0 136 L100 136 L100 146 Z M120 146 L120 132 L232 132 L232 138 L248 138 L248 146 Z M712 146 L712 138 L728 138 L728 132 L850 132 L850 136 L960 136 L960 146 Z" fill="url(#gc-gold3)" opacity="0.6" />
              </g>
              <g className="theme-kingdom-mistb">
                <path d="M0 146 Q160 128 340 138 Q520 148 700 134 Q820 124 960 138 L960 146 L0 146 Z" fill="#f7e3c0" opacity="0.4" />
              </g>
            </svg>
            <div
              className="theme-kingdom-moat"
              style={{ left: `${Math.round(36 + hash(7, 31) * 6)}%` }}
            />
            <div className="theme-kingdom-mist" />
            <div className="theme-kingdom-halftone" />
            <div className="theme-kingdom-grain" />
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={"gm" + i}
                className="theme-kingdom-mote"
                style={
                  {
                    left: `${Math.round(4 + hash(i, 11) * 92)}%`,
                    top: `${Math.round(6 + hash(i, 12) * 60)}%`,
                    animationDuration: `${(3 + hash(i, 13) * 4).toFixed(2)}s`,
                    animationDelay: `${-(hash(i, 14) * 6).toFixed(2)}s`,
                  } as CSSProperties
                }
              />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={"cs" + i}
                className="theme-kingdom-spark"
                style={
                  {
                    left: `${Math.round(8 + hash(i, 21) * 84)}%`,
                    top: `${Math.round(10 + hash(i, 22) * 50)}%`,
                    animationDuration: `${(2.6 + hash(i, 23) * 3).toFixed(2)}s`,
                    animationDelay: `${-(hash(i, 24) * 5).toFixed(2)}s`,
                  } as CSSProperties
                }
              />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={"run" + i}
                className="theme-kingdom-rune"
                style={{ left: `${14 + i * 18}%`, top: `${30 + (i % 3) * 16}%` } as CSSProperties}
              >
                {["✦", "❈", "❖", "✧", "❂"][i]}
              </div>
            ))}
            <div className="theme-kingdom-goldline" />
            <div className="theme-kingdom-corner tl" />
            <div className="theme-kingdom-corner tr" />
            <div className="theme-kingdom-corner bl" />
            <div className="theme-kingdom-corner br" />
            <div className="theme-kingdom-platform" />
            <span className="theme-webtoon-annot">{animation.annotation ?? "always ascend"}</span>
          </>
        );
      }
      return (
        <>
          <div
            className="theme-webtoon-sky"
            style={{
              background: `linear-gradient(180deg, ${colors.background[0]} 0%, #eef7fb 55%, ${colors.background[1]} 100%)`,
            }}
          />
          <div className="theme-webtoon-sun" />
          <div className="theme-webtoon-rays" />
          {Array.from({ length: animation.cloudCount }, (_, i) => (
            <div
              key={i}
              className="theme-webtoon-cloud"
              style={
                {
                  "--cx": `${[18, 62, 38][i]}%`,
                  "--ct": `${[20, 48, 8][i]}%`,
                  "--co": `${[0.65, 0.5, 0.4][i]}`,
                  "--cd": `${[26, 34, 40][i]}s`,
                  "--cdd": `${[0, -8, -20][i]}s`,
                } as CSSProperties
              }
            />
          ))}
          <div className="theme-webtoon-halftone" />
          <div className="theme-webtoon-grain" />
          {WEBTOON_SPARKS.map((sp, i) => (
            <div
              key={"s" + i}
              className="theme-webtoon-spark"
              style={
                {
                  left: sp.left,
                  top: sp.top,
                  animationDuration: `${sp.duration}s`,
                  animationDelay: `${sp.delay}s`,
                } as CSSProperties
              }
            />
          ))}
          <div className="theme-webtoon-speed" />
          <span className="theme-webtoon-annot">{animation.annotation ?? "purr~"}</span>
        </>
      );
  }
}

export function ProfileThemeBackground({ theme, className }: ProfileThemeBackgroundProps) {
  if (!theme.animation && !theme.character) return null;
  const lightBg = theme.animation?.kind === "webtoon";
  return (
    <>
      <div aria-hidden className={"theme-bg" + (className ? " " + className : "")}>
        {!lightBg && <div className="absolute inset-0 bg-black/25" />}
        {theme.animation && renderLayers(theme.animation, theme.colors)}
      </div>
      {theme.character && (
        <div
          aria-hidden
          className="theme-sticker"
          style={{ borderColor: theme.colors.accent }}
        >
          <img className="theme-sticker-gif" src={theme.character.src} alt="" draggable={false} />
          <img className="theme-sticker-poster" src={theme.character.poster} alt="" draggable={false} />
        </div>
      )}
    </>
  );
}

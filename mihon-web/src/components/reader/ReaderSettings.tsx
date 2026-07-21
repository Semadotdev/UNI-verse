"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, Sun, Palette, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReaderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "page" | "webtoon";
  direction: "ltr" | "rtl";
  brightness: number;
  bgColor: string;
  padding: number;
  onModeChange: (mode: "page" | "webtoon") => void;
  onDirectionChange: (dir: "ltr" | "rtl") => void;
  onBrightnessChange: (value: number) => void;
  onBgColorChange: (color: string) => void;
  onPaddingChange: (value: number) => void;
}

const BG_COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Light Gray", value: "#e5e5e5" },
  { name: "Dark", value: "#18181b" },
  { name: "Black", value: "#000000" },
  { name: "Sepia", value: "#f5e6d3" },
  { name: "Blue", value: "#1e293b" },
];

export function ReaderSettings({
  isOpen,
  onClose,
  mode,
  direction,
  brightness,
  bgColor,
  padding,
  onModeChange,
  onDirectionChange,
  onBrightnessChange,
  onBgColorChange,
  onPaddingChange,
}: ReaderSettingsProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={handleBackdropClick}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-80 bg-zinc-900 shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h2 className="text-lg font-semibold text-zinc-100">
              Reader Settings
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 p-4">
            {/* Mode Toggle */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Reading Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onModeChange("page")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    mode === "page"
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  Page
                </button>
                <button
                  onClick={() => onModeChange("webtoon")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    mode === "webtoon"
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  Webtoon
                </button>
              </div>
            </div>

            {/* Direction Toggle */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Reading Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onDirectionChange("rtl")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    direction === "rtl"
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  Right to Left
                </button>
                <button
                  onClick={() => onDirectionChange("ltr")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    direction === "ltr"
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  Left to Right
                </button>
              </div>
            </div>

            {/* Brightness */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Sun className="h-4 w-4" />
                Brightness
                <span className="ml-auto text-zinc-500">
                  {Math.round(brightness * 100)}%
                </span>
              </label>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={brightness}
                onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* Background Color */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Palette className="h-4 w-4" />
                Background Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {BG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onBgColorChange(color.value)}
                    title={color.name}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                      bgColor === color.value
                        ? "border-primary scale-110"
                        : "border-zinc-600"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            {/* Padding */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Maximize2 className="h-4 w-4" />
                Padding
                <span className="ml-auto text-zinc-500">{padding}px</span>
              </label>
              <input
                type="range"
                min={0}
                max={48}
                step={4}
                value={padding}
                onChange={(e) => onPaddingChange(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto border-t border-zinc-800 p-4">
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

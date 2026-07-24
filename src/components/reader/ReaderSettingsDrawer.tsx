"use client";

import { useSettings } from "@/contexts/SettingsContext";
import type { Settings } from "@/contexts/SettingsContext";
import { Drawer } from "@/components/ui/Drawer";
import { Toggle } from "@/components/ui/Toggle";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import type { MangaOverrides } from "@/hooks/use-manga-settings";

interface ReaderSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings?: Settings;
  onUpdateOverride?: (updates: Partial<MangaOverrides>) => void;
  onResetOverrides?: () => void;
  hasOverrides?: boolean;
}

const readingModeOptions = [
  { value: "long-strip", label: "Long Strip" },
  { value: "paged-ltr", label: "Paged LTR" },
  { value: "paged-rtl", label: "Paged RTL" },
  { value: "paged-vertical", label: "Vertical" },
];

const scaleTypeOptions = [
  { value: "contain", label: "Fit" },
  { value: "fit-width", label: "Width" },
  { value: "original", label: "Original" },
];

const backgroundOptions = [
  { value: "#000000", label: "Black" },
  { value: "#111118", label: "Dark" },
  { value: "#1a1a24", label: "Gray" },
  { value: "#2d2d2d", label: "Slate" },
  { value: "#ffffff", label: "White" },
];

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-1 divide-y divide-border/50">{children}</div>
    </div>
  );
}

export function ReaderSettingsDrawer({
  open,
  onClose,
  settings: settingsProp,
  onUpdateOverride,
  onResetOverrides,
  hasOverrides,
}: ReaderSettingsDrawerProps) {
  const { settings: globalSettings, updateSettings } = useSettings();
  const settings = settingsProp ?? globalSettings;

  const set = onUpdateOverride
    ? (updates: Partial<MangaOverrides>) => onUpdateOverride(updates)
    : (updates: Partial<Settings>) => updateSettings(updates);

  const readingMode = onUpdateOverride
    ? (settings.readingMode as string)
    : settings.readingMode;

  const isPaged = readingMode !== "long-strip";

  return (
    <Drawer open={open} onClose={onClose} title="Reader Settings">
      <Section title="Reading Mode">
        <SegmentedControl
          options={readingModeOptions}
          value={readingMode}
          onChange={(v) => set({ readingMode: v, readerMode: v === "long-strip" ? "webtoon" : "paged" })}
        />
      </Section>

      <Section title="Display">
        <div className="flex gap-1.5 py-2">
          {backgroundOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set({ backgroundColor: opt.value })}
              className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                settings.backgroundColor === opt.value
                  ? "border-primary scale-110 shadow-glow-sm"
                  : "border-border hover:border-border-hover"
              }`}
              style={{ backgroundColor: opt.value }}
              title={opt.label}
            />
          ))}
        </div>

        <SettingRow label={`Brightness: ${Math.round(settings.brightness * 100)}%`}>
          <Slider
            min={0.5}
            max={1}
            step={0.05}
            value={settings.brightness}
            onChange={(v) => set({ brightness: v })}
            label="Brightness"
            className="w-24"
          />
        </SettingRow>

        <SettingRow label="Scale Type">
          <SegmentedControl
            options={scaleTypeOptions}
            value={settings.scaleType}
            onChange={(v) => set({ scaleType: v })}
            className="w-40"
          />
        </SettingRow>

        <SettingRow label="Crop Borders">
          <Toggle
            checked={settings.cropBorders}
            onChange={(v) => set({ cropBorders: v })}
          />
        </SettingRow>

        <SettingRow label="Split Wide Pages">
          <Toggle
            checked={settings.splitWidePages}
            onChange={(v) => set({ splitWidePages: v })}
          />
        </SettingRow>

        <SettingRow label={`Side Padding: ${settings.sidePadding}px`}>
          <Slider
            min={0}
            max={80}
            step={5}
            value={settings.sidePadding}
            onChange={(v) => set({ sidePadding: v })}
            label="Side Padding"
            className="w-24"
          />
        </SettingRow>
      </Section>

      <Section title="Reading">
        <SettingRow label="Show Page Number">
          <Toggle
            checked={settings.showPageNumber}
            onChange={(v) => set({ showPageNumber: v })}
          />
        </SettingRow>

        <SettingRow label={`Preload: ${settings.pagePreloadCount} pages`}>
          <Slider
            min={0}
            max={5}
            step={1}
            value={settings.pagePreloadCount}
            onChange={(v) => set({ pagePreloadCount: v })}
            label="Preload pages"
            className="w-24"
          />
        </SettingRow>

        <SettingRow label="Double-Tap Zoom">
          <Toggle
            checked={settings.doubleTapZoom}
            onChange={(v) => set({ doubleTapZoom: v })}
          />
        </SettingRow>
      </Section>

      {isPaged && (
        <Section title="Paged Reader">
          <SettingRow label="Tap Zone Layout">
            <SegmentedControl
              options={[
                { value: "disabled", label: "Off" },
                { value: "right-left", label: "R-L" },
                { value: "left-right", label: "L-R" },
              ]}
              value={settings.tapZoneLayout}
              onChange={(v) => set({ tapZoneLayout: v })}
              className="w-36"
            />
          </SettingRow>

          <SettingRow label="Zoom Start Position">
            <SegmentedControl
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
              value={settings.zoomStartPosition}
              onChange={(v) => set({ zoomStartPosition: v })}
              className="w-40"
            />
          </SettingRow>
        </Section>
      )}

      {onResetOverrides && hasOverrides && (
        <div className="pt-3 border-t border-border">
          <button
            onClick={onResetOverrides}
            className="w-full py-2 text-xs text-muted hover:text-zinc-200 border border-border hover:border-border-hover rounded-lg transition-colors"
          >
            Reset to Global Defaults
          </button>
        </div>
      )}
    </Drawer>
  );
}

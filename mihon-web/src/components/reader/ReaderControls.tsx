"use client";

import { Settings, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReaderControlsProps {
  direction: "ltr" | "rtl";
  onDirectionChange: (dir: "ltr" | "rtl") => void;
  onSettingsClick: () => void;
}

export function ReaderControls({
  direction,
  onDirectionChange,
  onSettingsClick,
}: ReaderControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDirectionChange(direction === "ltr" ? "rtl" : "ltr")}
      >
        {direction === "ltr" ? (
          <ArrowRight className="h-4 w-4" />
        ) : (
          <ArrowLeft className="h-4 w-4" />
        )}
      </Button>
      <Button variant="ghost" size="sm" onClick={onSettingsClick}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}

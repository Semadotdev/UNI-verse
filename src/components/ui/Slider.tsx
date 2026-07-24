"use client";

import { useMemo } from "react";

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
}

export function Slider({ min, max, step = 1, value, onChange, label, className = "" }: SliderProps) {
  const percentage = useMemo(() => {
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      aria-label={label}
      className={`slider ${className}`}
      style={{
        background: `linear-gradient(90deg, #7C3AED ${percentage}%, #1a1a24 ${percentage}%)`,
      }}
    />
  );
}

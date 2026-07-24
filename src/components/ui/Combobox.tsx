"use client";

import { cn } from "@/lib/utils";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function Combobox({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }, []);

  const toggle = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [selected, onChange]
  );

  const remove = useCallback(
    (value: string) => {
      onChange(selected.filter((v) => v !== value));
    },
    [selected, onChange]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, close]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          setOpen(true);
          setActiveIndex(0);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          close();
          break;
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < filtered.length) {
            toggle(filtered[activeIndex].value);
          }
          break;
        case "Tab":
          close();
          break;
      }
    },
    [open, activeIndex, filtered, toggle, close]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && menuRef.current) {
      const items =
        menuRef.current.querySelectorAll<HTMLElement>("[data-combo-item]");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((value) => {
            const option = options.find((o) => o.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/20 text-primary-light text-xs"
              >
                {option?.label || value}
                <button
                  type="button"
                  onClick={() => remove(value)}
                  className="hover:text-white transition-colors"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        className={cn(
          "flex h-9 w-full items-center rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm cursor-pointer",
          "text-zinc-100 placeholder:text-zinc-500",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          open && "ring-2 ring-primary border-transparent"
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length > 0 ? "" : searchPlaceholder}
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
        <svg
          className={cn(
            "h-4 w-4 text-zinc-500 transition-transform duration-200",
            open && "rotate-180"
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={menuRef}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl",
            "animate-dropdown"
          )}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-500">
              No results found
            </div>
          ) : (
            filtered.map((option, index) => {
              const isSelected = selected.includes(option.value);
              const isActive = index === activeIndex;
              return (
                <button
                  key={option.value}
                  data-combo-item
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(option.value)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                    isActive
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-zinc-600"
                    )}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  {option.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

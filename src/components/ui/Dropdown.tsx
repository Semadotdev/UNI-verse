"use client";

import { cn } from "@/lib/utils";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export function Dropdown({ trigger, items, align = "left" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filtered items that are not dividers (for keyboard navigation)
  const selectableItems = items.filter((item) => !item.divider);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  // Toggle open on trigger click
  const handleTriggerClick = () => setOpen((prev) => !prev);

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

  // Close on Escape and handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (
          e.key === "ArrowDown" ||
          e.key === "ArrowUp" ||
          e.key === "Enter" ||
          e.key === " "
        ) {
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
          setActiveIndex(
            (prev) => (prev + 1) % selectableItems.length
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex(
            (prev) =>
              (prev - 1 + selectableItems.length) % selectableItems.length
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < selectableItems.length) {
            const item = selectableItems[activeIndex];
            if (!item.disabled && item.onClick) {
              item.onClick();
            }
            close();
          }
          break;
        case "Tab":
          close();
          break;
      }
    },
    [open, activeIndex, selectableItems, close]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && menuRef.current) {
      const items =
        menuRef.current.querySelectorAll<HTMLElement>("[data-dropdown-item]");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger */}
      <div
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger}
      </div>

      {/* Menu */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute z-50 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl",
            "animate-dropdown",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, index) => {
            // For dividers, just render the divider
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-1 border-t border-zinc-800"
                  role="separator"
                />
              );
            }

            // Compute the selectable index for this item
            const selectableIndex = selectableItems.indexOf(item);
            const isActive = selectableIndex === activeIndex;

            return (
              <button
                key={`${item.label}-${index}`}
                data-dropdown-item
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled && item.onClick) {
                    item.onClick();
                  }
                  close();
                }}
                onMouseEnter={() => setActiveIndex(selectableIndex)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                  item.disabled
                    ? "cursor-not-allowed text-zinc-600"
                    : item.active
                      ? "bg-primary/10 text-primary"
                      : isActive
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                )}
              >
                {item.icon && (
                  <span className="flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                    {item.icon}
                  </span>
                )}
                {item.label}
                {item.badge && (
                  <span className="ml-1.5">{item.badge}</span>
                )}
                {item.active && (
                  <svg className="ml-auto h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

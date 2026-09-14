"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MANUAL_SECTIONS,
  type ManualSection,
} from "@/components/help/help-content";

function ManualSectionCard({
  section,
  open,
  onToggle,
  onNavigate,
}: {
  section: ManualSection;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const Icon = section.icon;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${section.id}-panel`}
        id={`${section.id}-header`}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-overlay"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-light">
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-zinc-100">
            {section.title}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {section.blurb}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        id={`${section.id}-panel`}
        role="region"
        aria-labelledby={`${section.id}-header`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <ol className="space-y-3 border-t border-zinc-800 px-4 py-4">
            {section.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">
                    {step.title}
                  </p>
                  {step.body && (
                    <p className="mt-1 text-sm text-zinc-400">{step.body}</p>
                  )}
                  {step.action && (
                    <Link
                      href={step.action.href}
                      onClick={onNavigate}
                      className="mt-2 inline-flex items-center rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
                    >
                      {step.action.label}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function HelpGuide({ onNavigate }: { onNavigate?: () => void } = {}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {MANUAL_SECTIONS.map((section, i) => (
        <ManualSectionCard
          key={section.id}
          section={section}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
"use client";

import { useToast, ToastVariant } from "@/contexts/ToastContext";

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-zinc-900 border-l-4 border-l-green-500 text-zinc-100",
  error: "bg-zinc-900 border-l-4 border-l-red-500 text-zinc-100",
  warning: "bg-zinc-900 border-l-4 border-l-yellow-400 text-zinc-100",
  info: "bg-zinc-900 border-l-4 border-l-blue-500 text-zinc-100",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg border shadow-lg max-w-sm animate-in slide-in-from-right ${variantStyles[toast.variant]}`}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 shrink-0"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

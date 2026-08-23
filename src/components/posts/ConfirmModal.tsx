"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  confirmText,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setTyped("");
      setSubmitting(false);
    }
  }

  const gated = Boolean(confirmText);
  const canConfirm = !submitting && (!gated || typed === confirmText);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Keep the modal open; the caller surfaces the failure.
    } finally {
      setSubmitting(false);
    }
  };

  const requestClose = () => {
    if (!submitting) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={requestClose}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? "Working..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-zinc-300">{message}</p>
      {gated && (
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={`Type ${confirmText} to confirm`}
          autoComplete="off"
          className="mt-3 w-full rounded-lg border border-border bg-bg-overlay px-3 py-2 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:border-red-500/50"
        />
      )}
    </Modal>
  );
}

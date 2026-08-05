"use client";

import { Modal } from "@/components/ui/Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-zinc-300">{message}</p>
    </Modal>
  );
}

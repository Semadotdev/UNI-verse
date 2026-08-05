"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";

interface ReportModalProps {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
}

export function ReportModal({ open, title, url, onClose }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const { addToast } = useToast();

  const submit = async () => {
    if (sending) return;
    setSending(true);
    try {
      await ApiClient.post<{ reported: boolean }>(url, { reason: reason.trim() || undefined });
      addToast("Reported", "success");
      setReason("");
      onClose();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to report", "error");
    } finally {
      setSending(false);
    }
  };

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
            onClick={submit}
            disabled={sending}
            className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
          >
            {sending ? "Sending..." : "Submit report"}
          </button>
        </>
      }
    >
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Optional reason..."
        className="w-full min-h-[80px] rounded-lg border border-border bg-bg-overlay px-3 py-2 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:border-primary/50"
      />
    </Modal>
  );
}

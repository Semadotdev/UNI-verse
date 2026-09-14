"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { HelpGuide } from "@/components/help/HelpGuide";

const HelpModalContext = createContext<{ openHelpModal: () => void }>({
  openHelpModal: () => {},
});

export function useHelpModal() {
  return useContext(HelpModalContext);
}

export function HelpModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openHelpModal = useCallback(() => setOpen(true), []);

  return (
    <HelpModalContext.Provider value={{ openHelpModal }}>
      {children}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Help Center"
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <HelpGuide onNavigate={() => setOpen(false)} />
        </div>
      </Modal>
    </HelpModalContext.Provider>
  );
}
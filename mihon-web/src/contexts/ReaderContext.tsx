"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ReaderSettings {
  mode: "page" | "webtoon";
  direction: "ltr" | "rtl";
  brightness: number;
  bgColor: string;
  padding: number;
}

interface ReaderContextType {
  readerSettings: ReaderSettings;
  updateReaderSettings: (updates: Partial<ReaderSettings>) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
}

const defaultReaderSettings: ReaderSettings = {
  mode: "page",
  direction: "rtl",
  brightness: 1.0,
  bgColor: "#ffffff",
  padding: 0,
};

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(defaultReaderSettings);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const updateReaderSettings = (updates: Partial<ReaderSettings>) => {
    setReaderSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <ReaderContext.Provider
      value={{
        readerSettings,
        updateReaderSettings,
        currentPage,
        totalPages,
        setCurrentPage,
        setTotalPages,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error("useReader must be used within a ReaderProvider");
  }
  return context;
}

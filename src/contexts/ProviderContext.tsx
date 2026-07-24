"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ProviderContextType {
  selectedProvider: string;
  setSelectedProvider: (id: string) => void;
}

function getInitialProvider(): string {
  if (typeof window === "undefined") return "asurascans";
  const saved = localStorage.getItem("uni-verse-selected-provider");
  return saved || "asurascans";
}

const ProviderContext = createContext<ProviderContextType>({
  selectedProvider: "asurascans",
  setSelectedProvider: () => {},
});

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [selectedProvider, setSelectedProviderState] = useState(getInitialProvider);

  const setSelectedProvider = (id: string) => {
    setSelectedProviderState(id);
    localStorage.setItem("uni-verse-selected-provider", id);
  };

  return (
    <ProviderContext.Provider value={{ selectedProvider, setSelectedProvider }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  return useContext(ProviderContext);
}

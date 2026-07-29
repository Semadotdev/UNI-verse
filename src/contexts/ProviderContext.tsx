"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface ProviderContextType {
  selectedProvider: string;
  setSelectedProvider: (id: string) => void;
}

const ProviderContext = createContext<ProviderContextType>({
  selectedProvider: "asurascans",
  setSelectedProvider: () => {},
});

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [selectedProvider, setSelectedProviderState] = useState("asurascans");

  useEffect(() => {
    const saved = localStorage.getItem("uni-verse-selected-provider");
    if (saved) setSelectedProviderState(saved);
  }, []);

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

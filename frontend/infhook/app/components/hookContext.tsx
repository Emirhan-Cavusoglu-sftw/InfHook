"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface HookContextType {
  selectedHook: string;
  setSelectedHook: (hook: string) => void;
}

const HookContext = createContext<HookContextType | undefined>(undefined);

export const HookProvider = ({ children }: { children: ReactNode }) => {
  const [selectedHook, setSelectedHook] = useState<string>(
    "0x0000000000000000000000000000000000000000"
  );

  return (
    <HookContext.Provider value={{ selectedHook, setSelectedHook }}>
      {children}
    </HookContext.Provider>
  );
};

export const useHook = () => {
  const context = useContext(HookContext);
  if (!context) {
    throw new Error("useHook must be used within a HookProvider");
  }
  return context;
};

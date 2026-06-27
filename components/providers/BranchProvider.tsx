"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { siteConfig } from "@/config/site";

type BranchId = typeof siteConfig.branchIds[keyof typeof siteConfig.branchIds];

interface BranchContextValue {
  selectedBranchId:   BranchId | null;
  setSelectedBranch:  (id: BranchId, remember?: boolean) => void;
  clearBranch:        () => void;
  isLoaded:           boolean;
}

const STORAGE_KEY = "cgh_branch";

const BranchContext = createContext<BranchContextValue>({
  selectedBranchId:  null,
  setSelectedBranch: () => {},
  clearBranch:       () => {},
  isLoaded:          false,
});

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranchId, setSelectedBranchId] = useState<BranchId | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Read from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as BranchId | null;
      const validIds = Object.values(siteConfig.branchIds) as string[];
      if (stored && validIds.includes(stored)) {
        setSelectedBranchId(stored);
      }
    } catch {}
    setIsLoaded(true);
  }, []);

  const setSelectedBranch = useCallback((id: BranchId, remember = true) => {
    setSelectedBranchId(id);
    if (remember) {
      try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    }
  }, []);

  const clearBranch = useCallback(() => {
    setSelectedBranchId(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <BranchContext.Provider value={{ selectedBranchId, setSelectedBranch, clearBranch, isLoaded }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchContext() {
  return useContext(BranchContext);
}

// Helper: get branch config object from selected ID
export function useBranchConfig() {
  const { selectedBranchId } = useBranchContext();
  const branch = siteConfig.branches.find(b => b.id === selectedBranchId) ?? null;
  return branch;
}

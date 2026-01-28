"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

export interface BulkProgressState {
  isRunning: boolean;
  total: number;
  completed: number;
  currentSite: string | null;
  errors: string[];
  results: Array<{ siteName: string; title: string }>;
}

interface BulkProgressContextType {
  progress: BulkProgressState;
  setProgress: (progress: BulkProgressState | ((prev: BulkProgressState) => BulkProgressState)) => void;
  resetProgress: () => void;
  isCancelled: boolean;
  cancelGeneration: () => void;
  resetCancel: () => void;
}

const initialProgress: BulkProgressState = {
  isRunning: false,
  total: 0,
  completed: 0,
  currentSite: null,
  errors: [],
  results: [],
};

const BulkProgressContext = createContext<BulkProgressContextType | null>(null);

export function BulkProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgressState] = useState<BulkProgressState>(initialProgress);
  const cancelledRef = useRef(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const setProgress = useCallback((
    update: BulkProgressState | ((prev: BulkProgressState) => BulkProgressState)
  ) => {
    setProgressState(update);
  }, []);

  const resetProgress = useCallback(() => {
    setProgressState(initialProgress);
    cancelledRef.current = false;
    setIsCancelled(false);
  }, []);

  const cancelGeneration = useCallback(() => {
    cancelledRef.current = true;
    setIsCancelled(true);
  }, []);

  const resetCancel = useCallback(() => {
    cancelledRef.current = false;
    setIsCancelled(false);
  }, []);

  // Expose the ref for synchronous checks during the loop
  const value: BulkProgressContextType = {
    progress,
    setProgress,
    resetProgress,
    isCancelled: cancelledRef.current || isCancelled,
    cancelGeneration,
    resetCancel,
  };

  return (
    <BulkProgressContext.Provider value={value}>
      {children}
    </BulkProgressContext.Provider>
  );
}

export function useBulkProgress() {
  const context = useContext(BulkProgressContext);
  if (!context) {
    throw new Error("useBulkProgress must be used within a BulkProgressProvider");
  }
  return context;
}

// Export a hook that provides a ref-based check for the loop
export function useCancelRef() {
  const cancelledRef = useRef(false);

  const setCancelled = useCallback((value: boolean) => {
    cancelledRef.current = value;
  }, []);

  const checkCancelled = useCallback(() => {
    return cancelledRef.current;
  }, []);

  return { cancelledRef, setCancelled, checkCancelled };
}

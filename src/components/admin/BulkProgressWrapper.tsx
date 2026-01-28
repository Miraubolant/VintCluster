"use client";

import { type ReactNode } from "react";
import { BulkProgressProvider, useBulkProgress } from "@/contexts/BulkProgressContext";
import { BulkProgressBar } from "@/components/admin/scheduler/BulkProgressBar";

function BulkProgressDisplay() {
  const { progress, resetProgress, cancelGeneration } = useBulkProgress();

  // Only show if there's progress to display
  if (!progress.isRunning && progress.completed === 0 && progress.errors.length === 0) {
    return null;
  }

  return (
    <BulkProgressBar
      progress={progress}
      onClose={resetProgress}
      onStop={cancelGeneration}
    />
  );
}

export function BulkProgressWrapper({ children }: { children: ReactNode }) {
  return (
    <BulkProgressProvider>
      {children}
      <BulkProgressDisplay />
    </BulkProgressProvider>
  );
}

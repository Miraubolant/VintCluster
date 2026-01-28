"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BulkProgressState {
  isRunning: boolean;
  total: number;
  completed: number;
  currentSite: string | null;
  errors: string[];
  results: Array<{ siteName: string; title: string }>;
}

interface BulkProgressBarProps {
  progress: BulkProgressState;
  onClose: () => void;
  onComplete?: () => void;
}

export function BulkProgressBar({ progress, onClose, onComplete }: BulkProgressBarProps) {
  const [minimized, setMinimized] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const isComplete = !progress.isRunning && progress.completed > 0;
  const hasErrors = progress.errors.length > 0;

  useEffect(() => {
    if (isComplete && !showSuccess) {
      setShowSuccess(true);
      onComplete?.();
      // Auto-close after 5s if no errors
      if (!hasErrors) {
        const timer = setTimeout(() => {
          onClose();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isComplete, showSuccess, hasErrors, onClose, onComplete]);

  if (!progress.isRunning && progress.completed === 0 && progress.errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer"
          onClick={() => setMinimized(!minimized)}
        >
          <div className="flex items-center gap-2">
            {progress.isRunning ? (
              <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
            ) : isComplete ? (
              hasErrors ? (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )
            ) : null}
            <span className="font-medium text-sm text-gray-900">
              {progress.isRunning
                ? "Génération en cours"
                : hasErrors
                  ? "Terminé avec erreurs"
                  : "Génération terminée"
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-600">
              {progress.completed}/{progress.total}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 relative overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
              isComplete
                ? hasErrors
                  ? "bg-amber-500"
                  : "bg-green-500"
                : "bg-indigo-600"
            }`}
            style={{ width: `${percentage}%` }}
          />
          {progress.isRunning && (
            <div
              className="absolute inset-y-0 bg-indigo-400/50 animate-pulse"
              style={{
                left: `${percentage}%`,
                width: `${Math.min(10, 100 - percentage)}%`
              }}
            />
          )}
        </div>

        {/* Content */}
        {!minimized && (
          <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
            {/* Current status */}
            {progress.isRunning && progress.currentSite && (
              <div className="text-xs text-gray-600 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                {progress.currentSite}
              </div>
            )}

            {/* Recent results */}
            {progress.results.length > 0 && (
              <div className="space-y-1">
                {progress.results.slice(-3).map((result, i) => (
                  <div
                    key={i}
                    className="text-xs text-gray-700 flex items-start gap-2 animate-in fade-in duration-300"
                  >
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">
                      <span className="text-gray-500">{result.siteName}:</span> {result.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Errors */}
            {hasErrors && (
              <div className="space-y-1 pt-1 border-t border-gray-100">
                {progress.errors.slice(-2).map((error, i) => (
                  <div
                    key={i}
                    className="text-xs text-red-600 flex items-start gap-2"
                  >
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{error}</span>
                  </div>
                ))}
                {progress.errors.length > 2 && (
                  <span className="text-xs text-gray-400">
                    +{progress.errors.length - 2} autres erreurs
                  </span>
                )}
              </div>
            )}

            {/* Completion message */}
            {isComplete && !hasErrors && (
              <div className="text-xs text-green-600 font-medium pt-1">
                {progress.completed} article{progress.completed > 1 ? "s" : ""} généré{progress.completed > 1 ? "s" : ""} avec succès
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

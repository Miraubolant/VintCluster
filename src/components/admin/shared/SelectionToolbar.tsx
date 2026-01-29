"use client";

import { Button } from "@/components/ui/button";
import { X, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  children: React.ReactNode;
  className?: string;
  itemLabel?: string;
}

export function SelectionToolbar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  children,
  className,
  itemLabel = "élément",
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalCount;
  const pluralSuffix = selectedCount > 1 ? "s" : "";
  const itemLabelPlural = selectedCount > 1 ? `${itemLabel}s` : itemLabel;

  return (
    <div
      className={cn(
        "bg-indigo-50 border border-indigo-200 rounded-lg p-4",
        "flex flex-wrap items-center justify-between gap-4",
        "animate-in fade-in slide-in-from-top-2 duration-200",
        className
      )}
    >
      {/* Left side: Selection info */}
      <div className="flex items-center gap-3">
        <span className="font-medium text-indigo-900">
          {selectedCount} {itemLabelPlural} sélectionné{pluralSuffix}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            disabled={isAllSelected}
            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 h-8 px-2"
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Tout</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 h-8 px-2"
          >
            <Square className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Aucun</span>
          </Button>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {children}

        {/* Close button (mobile: always visible, desktop: optional) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="text-gray-400 hover:text-gray-600 h-8 w-8 sm:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Composant utilitaire pour séparer visuellement les groupes d'actions
export function ToolbarDivider() {
  return <div className="w-px h-6 bg-indigo-200 mx-1 hidden sm:block" />;
}

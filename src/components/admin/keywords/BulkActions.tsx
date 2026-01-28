"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Play, Archive, Trash2, XCircle } from "lucide-react";
import type { KeywordStatus } from "@/types/database";

interface BulkActionsProps {
  selectedCount: number;
  onStatusChange: (status: KeywordStatus) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  onStatusChange,
  onDelete,
  onClearSelection,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
      <span className="text-sm font-medium text-indigo-700">
        {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Actions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusChange("generating")}>
              <Play className="mr-2 h-4 w-4" />
              Lancer la génération
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange("archived")}>
              <Archive className="mr-2 h-4 w-4" />
              Archiver
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

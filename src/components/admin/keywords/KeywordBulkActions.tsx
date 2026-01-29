"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, Archive, Trash2, RotateCcw } from "lucide-react";
import { ToolbarDivider } from "@/components/admin/shared";
import type { KeywordStatus } from "@/types/database";

interface KeywordBulkActionsProps {
  selectedCount: number;
  onGenerate: () => void;
  onStatusChange: (status: KeywordStatus) => void;
  onDelete: () => void;
  isGenerating?: boolean;
}

export function KeywordBulkActions({
  selectedCount,
  onGenerate,
  onStatusChange,
  onDelete,
  isGenerating = false,
}: KeywordBulkActionsProps) {
  return (
    <>
      {/* Generate articles */}
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerate}
        disabled={isGenerating}
        className="text-purple-700 border-purple-300 hover:bg-purple-50"
      >
        <Sparkles className="h-4 w-4 mr-1" />
        {isGenerating ? "Génération..." : "Générer articles"}
      </Button>

      <ToolbarDivider />

      {/* Status changes */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onStatusChange("published")}
        disabled={isGenerating}
        className="text-green-700 border-green-300 hover:bg-green-50"
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Publier
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onStatusChange("archived")}
        disabled={isGenerating}
        className="text-gray-700 border-gray-300 hover:bg-gray-50"
      >
        <Archive className="h-4 w-4 mr-1" />
        Archiver
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onStatusChange("pending")}
        disabled={isGenerating}
        className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
      >
        <RotateCcw className="h-4 w-4 mr-1" />
        Réinitialiser
      </Button>

      <ToolbarDivider />

      {/* Delete */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        disabled={isGenerating}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Supprimer ({selectedCount})
      </Button>
    </>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { ToolbarDivider } from "@/components/admin/shared";
import {
  ImageIcon,
  Sparkles,
  Send,
  FileCheck,
  CheckCircle,
  Eye,
  XCircle,
  Trash2,
  Loader2,
  Zap,
} from "lucide-react";
import type { ArticleStatus } from "@/types/database";

interface ArticleBulkActionsProps {
  onRegenerateImages: () => void;
  onIndexNow: () => void;
  onImprove: () => void;
  onSEOImprove: () => void;
  onStatusChange: (status: ArticleStatus) => void;
  onDelete: () => void;
  disabled?: boolean;
  indexNowLoading?: boolean;
}

export function ArticleBulkActions({
  onRegenerateImages,
  onIndexNow,
  onImprove,
  onSEOImprove,
  onStatusChange,
  onDelete,
  disabled = false,
  indexNowLoading = false,
}: ArticleBulkActionsProps) {
  return (
    <>
      {/* Actions IA */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRegenerateImages}
        disabled={disabled}
        className="text-purple-700 border-purple-300 hover:bg-purple-50"
      >
        <ImageIcon className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Régénérer images</span>
        <span className="sm:hidden">Images</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onIndexNow}
        disabled={disabled || indexNowLoading}
        className="text-cyan-700 border-cyan-300 hover:bg-cyan-50"
      >
        {indexNowLoading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-1" />
        )}
        IndexNow
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onImprove}
        disabled={disabled}
        className="text-amber-700 border-amber-300 hover:bg-amber-50"
      >
        <Sparkles className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Améliorer</span>
        <span className="sm:hidden">IA</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onSEOImprove}
        disabled={disabled}
        className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold"
      >
        <Zap className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">SEO Expert</span>
        <span className="sm:hidden">SEO</span>
      </Button>

      <ToolbarDivider />

      {/* Actions de statut */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onStatusChange("draft")}
        disabled={disabled}
        className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
      >
        <FileCheck className="h-4 w-4 mr-1" />
        <span className="hidden md:inline">Brouillon</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onStatusChange("ready")}
        disabled={disabled}
        className="text-blue-700 border-blue-300 hover:bg-blue-50"
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        <span className="hidden md:inline">Prêt</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onStatusChange("published")}
        disabled={disabled}
        className="text-green-700 border-green-300 hover:bg-green-50"
      >
        <Eye className="h-4 w-4 mr-1" />
        <span className="hidden md:inline">Publier</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onStatusChange("unpublished")}
        disabled={disabled}
        className="text-gray-700 border-gray-300 hover:bg-gray-50"
      >
        <XCircle className="h-4 w-4 mr-1" />
        <span className="hidden md:inline">Dépublier</span>
      </Button>

      <ToolbarDivider />

      {/* Suppression */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        disabled={disabled}
        className="text-red-700 border-red-300 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Supprimer</span>
      </Button>
    </>
  );
}

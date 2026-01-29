"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Palette, Trash2 } from "lucide-react";
import { ToolbarDivider } from "@/components/admin/shared";
import type { SiteTemplate } from "@/types/database";
import { TEMPLATES } from "@/types/database";

interface SiteBulkActionsProps {
  selectedCount: number;
  selectedTemplate: SiteTemplate;
  onTemplateChange: (template: SiteTemplate) => void;
  onApplyTemplate: () => void;
  onGenerateSEO: () => void;
  onDelete: () => void;
  isLoading?: boolean;
  isGenerating?: boolean;
}

export function SiteBulkActions({
  selectedCount,
  selectedTemplate,
  onTemplateChange,
  onApplyTemplate,
  onGenerateSEO,
  onDelete,
  isLoading = false,
  isGenerating = false,
}: SiteBulkActionsProps) {
  const isDisabled = isLoading || isGenerating;

  return (
    <>
      {/* Template selector + Apply button */}
      <Select
        value={selectedTemplate}
        onValueChange={(value) => onTemplateChange(value as SiteTemplate)}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-[140px] h-9 text-sm bg-white">
          <SelectValue placeholder="Template" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(TEMPLATES).map(([key, template]) => (
            <SelectItem key={key} value={key}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={onApplyTemplate}
        disabled={isDisabled}
        className="text-purple-700 border-purple-300 hover:bg-purple-50"
      >
        <Palette className="h-4 w-4 mr-1" />
        {isLoading ? "Application..." : "Appliquer template"}
      </Button>

      <ToolbarDivider />

      {/* Generate SEO */}
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerateSEO}
        disabled={isDisabled}
        className="text-indigo-700 border-indigo-300 hover:bg-indigo-50"
      >
        <Sparkles className="h-4 w-4 mr-1" />
        {isGenerating ? "Génération..." : "Générer SEO"}
      </Button>

      <ToolbarDivider />

      {/* Delete */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        disabled={isDisabled}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Supprimer ({selectedCount})
      </Button>
    </>
  );
}

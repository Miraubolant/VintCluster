"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Sparkles,
  CheckCircle,
  Archive,
  Trash2,
  Loader2,
} from "lucide-react";
import type { KeywordWithSite } from "./KeywordColumns";
import type { KeywordStatus } from "@/types/database";

interface KeywordRowActionsProps {
  keyword: KeywordWithSite;
  isGenerating: boolean;
  onGenerate: (id: string) => void;
  onStatusChange: (id: string, status: KeywordStatus) => void;
  onDelete: (id: string) => void;
}

export function KeywordRowActions({
  keyword,
  isGenerating,
  onGenerate,
  onStatusChange,
  onDelete,
}: KeywordRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Generate article - only for pending keywords */}
        {keyword.status === "pending" && (
          <DropdownMenuItem
            onClick={() => onGenerate(keyword.id)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Générer l&apos;article
          </DropdownMenuItem>
        )}

        {/* Publish - only for generated keywords */}
        {keyword.status === "generated" && (
          <DropdownMenuItem onClick={() => onStatusChange(keyword.id, "published")}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Publier
          </DropdownMenuItem>
        )}

        {/* Archive - always available except for archived */}
        {keyword.status !== "archived" && (
          <DropdownMenuItem onClick={() => onStatusChange(keyword.id, "archived")}>
            <Archive className="mr-2 h-4 w-4" />
            Archiver
          </DropdownMenuItem>
        )}

        {/* Restore - only for archived */}
        {keyword.status === "archived" && (
          <DropdownMenuItem onClick={() => onStatusChange(keyword.id, "pending")}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Restaurer
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onDelete(keyword.id)}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Archive, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import type { Keyword, KeywordStatus } from "@/types/database";

interface KeywordWithSite extends Keyword {
  site?: {
    id: string;
    name: string;
    domain: string;
  };
}

interface KeywordsTableProps {
  keywords: KeywordWithSite[];
  selectedIds: string[];
  generatingIds: string[];
  onSelectChange: (ids: string[]) => void;
  onStatusChange: (ids: string[], status: KeywordStatus) => void;
  onDelete: (ids: string[]) => void;
  onGenerate: (id: string) => void;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  generating: { label: "En génération", className: "bg-blue-100 text-blue-700" },
  generated: { label: "Généré", className: "bg-purple-100 text-purple-700" },
  published: { label: "Publié", className: "bg-green-100 text-green-700" },
  archived: { label: "Archivé", className: "bg-gray-100 text-gray-600" },
};

function getStatusInfo(status: string | null) {
  return statusLabels[status || "pending"] || statusLabels.pending;
}

export function KeywordsTable({
  keywords,
  selectedIds,
  generatingIds,
  onSelectChange,
  onStatusChange,
  onDelete,
  onGenerate,
}: KeywordsTableProps) {
  const allSelected = keywords.length > 0 && selectedIds.length === keywords.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < keywords.length;

  function handleSelectAll() {
    if (allSelected) {
      onSelectChange([]);
    } else {
      onSelectChange(keywords.map((k) => k.id));
    }
  }

  function handleSelectOne(id: string) {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  }

  if (keywords.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Aucun mot-clé trouvé</p>
        <p className="text-sm text-gray-400 mt-1">
          Importez des mots-clés pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mot-clé
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priorité
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Créé le
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {keywords.map((keyword) => (
              <tr
                key={keyword.id}
                className={`hover:bg-gray-50 ${
                  selectedIds.includes(keyword.id) ? "bg-indigo-50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.includes(keyword.id)}
                    onCheckedChange={() => handleSelectOne(keyword.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">
                    {keyword.keyword}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {keyword.site?.name || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      generatingIds.includes(keyword.id)
                        ? "bg-blue-100 text-blue-700"
                        : getStatusInfo(keyword.status).className
                    }`}
                  >
                    {generatingIds.includes(keyword.id) && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {generatingIds.includes(keyword.id)
                      ? "En génération"
                      : getStatusInfo(keyword.status).label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{keyword.priority}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-500">
                    {keyword.created_at
                      ? new Date(keyword.created_at).toLocaleDateString("fr-FR")
                      : "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {keyword.status === "pending" && (
                        <DropdownMenuItem
                          onClick={() => onGenerate(keyword.id)}
                          disabled={generatingIds.includes(keyword.id)}
                        >
                          {generatingIds.includes(keyword.id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          Générer l&apos;article
                        </DropdownMenuItem>
                      )}
                      {keyword.status === "generated" && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange([keyword.id], "published")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Publier
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onStatusChange([keyword.id], "archived")}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archiver
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete([keyword.id])}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
